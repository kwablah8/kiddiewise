import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireProfile } from "@/lib/auth/session";
import type { Profile } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import {
  generateTempPassword,
  tempPasswordExpiry,
  type IssuedCredentials,
} from "@/lib/temp-password";

export type { IssuedCredentials };

/**
 * Shared plumbing for the write layer.
 *
 * Writes are Server Actions, not client-side inserts. Reads can safely run in the browser because
 * RLS decides what comes back, but writes need three things the browser can't be trusted with:
 * `school_id` stamped from the session rather than the request body, `auth.uid()` recorded as the
 * author, and business rules (state-machine guards, uniqueness messages) enforced somewhere the
 * client cannot skip.
 */

export interface TenantContext {
  db: SupabaseClient<Database>;
  profile: Profile;
  /** The caller's school. Every insert stamps this — it is never taken from the input. */
  schoolId: string;
}

/**
 * The authenticated caller plus a request-scoped client. Redirects to /login when there is no
 * session, so an unauthenticated write can never reach a query.
 */
export async function tenant(): Promise<TenantContext> {
  const profile = await requireProfile();
  const db = await createClient();
  // profiles_school_required guarantees a school for every non-super_admin role; super_admin has no
  // school and therefore no tenant to write into.
  if (!profile.school_id) {
    throw new Error("This account isn't attached to a school, so it can't create records.");
  }
  return { db, profile, schoolId: profile.school_id };
}

/** The school's active academic year and term, which several writes must stamp. */
export async function activeContext(ctx: TenantContext): Promise<{
  academicYearId: string | null;
  termId: string | null;
}> {
  const { data } = await ctx.db
    .from("schools")
    .select("active_academic_year_id, active_term_id")
    .eq("id", ctx.schoolId)
    .single();
  return {
    academicYearId: data?.active_academic_year_id ?? null,
    termId: data?.active_term_id ?? null,
  };
}

// `data: T` (not `T | null`) so T infers as the driver's own `Row | null` union and `NonNullable<T>`
// narrows it for the caller. Declaring `T | null` here leaves T ambiguous and TS resolves it to never.
interface WriteResult<T> {
  data: T;
  error: { message: string; code?: string } | null;
}

/**
 * Unwrap a write, turning a Postgres error into a message a user can act on.
 *
 * Constraint violations are translated rather than surfaced raw: `23505` (unique) and `23503`
 * (foreign key) are the two a user can actually cause, and "duplicate key value violates unique
 * constraint students_school_id_admission_no_key" is not a sentence anyone should read in a toast.
 */
export function assertWrite<T>(
  res: WriteResult<T>,
  context: string,
  friendly?: string,
): NonNullable<T> {
  if (res.error) {
    const code = res.error.code;
    if (code === "23505") {
      throw new Error(friendly ?? `That ${context} already exists.`);
    }
    if (code === "23503") {
      throw new Error(
        friendly ?? `That ${context} refers to something that no longer exists.`,
      );
    }
    // 42501 is RLS/privilege denial — the row exists but this caller may not touch it.
    if (code === "42501") {
      throw new Error("You don't have permission to make that change.");
    }
    throw new Error(`${context}: ${res.error.message}`);
  }
  if (res.data === null || res.data === undefined) {
    throw new Error(`${context}: the record could not be saved.`);
  }
  return res.data as NonNullable<T>;
}

/** Same, for writes that return nothing (deletes, bulk upserts). */
export function assertOk(
  res: { error: { message: string; code?: string } | null },
  context: string,
  friendly?: string,
): void {
  assertWrite({ data: res.error ? null : ({} as unknown), error: res.error }, context, friendly);
}

function assertAdmin(ctx: TenantContext): void {
  if (ctx.profile.role !== "school_admin" && ctx.profile.role !== "super_admin") {
    throw new Error("Only an administrator can add staff or parents or send portal invitations.");
  }
}

/** Where an invited user is sent to choose their password. */
export function passwordSetupUrl(): string {
  // Must be on Supabase's redirect allowlist (site_url + additional_redirect_urls in config.toml),
  // or the auth server silently falls back to site_url and the user lands on the marketing page.
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";
  return `${base.replace(/\/$/, "")}/update-password`;
}

/**
 * Create the auth account behind a new staff member or parent, and return its id.
 *
 * `profiles.id` is a foreign key to `auth.users(id)`, so a person cannot exist in this system without
 * an auth account — there is no such thing as a profile-only record. Creating one needs the service
 * role, which is why every caller must hold a `tenant()` context: that proves the caller is signed in,
 * and `assertAdmin` proves they may do this.
 *
 * Deliberately SILENT — it notifies nobody. The admin-issued temporary password is handed over in
 * person (or over WhatsApp) by whoever created the record; sending mail here would need an SMTP
 * provider the school may not have, and would fire at addresses that are often wrong at admission.
 * `invitePortalUser` is the separate route for people who would rather set their own password.
 *
 * `tempPassword` is required: an account with no usable password is one the holder can only reach via
 * an invite link, which is a state neither create flow wants.
 */
export async function provisionUser(
  ctx: TenantContext,
  email: string,
  tempPassword: string,
): Promise<string> {
  assertAdmin(ctx);

  const admin = createServiceClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    // Pre-confirmed so the recipient goes straight to signing in rather than confirming an address
    // the school already vouched for face to face.
    email_confirm: true,
  });

  if (error || !data.user) {
    // auth.users sits outside RLS, so a clashing email surfaces here rather than as a constraint
    // violation on profiles.
    const message = error?.message.toLowerCase() ?? "";
    if (message.includes("already been registered") || message.includes("already exists")) {
      throw new Error("Someone with that email address already has an account.");
    }
    throw new Error(
      `Could not create an account for ${email}: ${error?.message ?? "unknown error"}`,
    );
  }

  return data.user.id;
}

/**
 * Mark a profile as holding an admin-issued temporary password.
 *
 * Written with the service role because `authenticated` has no grant on these columns — deliberately,
 * since `profiles_self_update` would otherwise let the holder clear their own `must_change_password`
 * flag and skip the change (see migration 0020).
 */
export async function markTempCredential(profileId: string, expiresAt: string): Promise<void> {
  const { error } = await createServiceClient()
    .from("profiles")
    .update({
      must_change_password: true,
      temp_password_expires_at: expiresAt,
      password_changed_at: null,
    })
    .eq("id", profileId);
  if (error) throw new Error(`Could not flag the temporary password: ${error.message}`);
}

/**
 * Issue a FRESH temporary password for someone who already has an account.
 *
 * This exists because the original cannot be shown again — passwords are stored as bcrypt hashes, so
 * there is nothing to reveal. Keeping the plaintext around to make a "re-copy" button possible would
 * put every parent's password in the database in readable form, visible to any admin and exposed
 * wholesale in a breach. Regenerating gives the admin the same outcome (a credential they can send
 * again) without that: the previous password simply stops working.
 */
export async function reissueTempPassword(
  ctx: TenantContext,
  profileId: string,
): Promise<IssuedCredentials> {
  assertAdmin(ctx);

  // Read through the CALLER's client so RLS confines this to their own school — with the service role
  // this would be a cross-tenant password-reset machine.
  const { data: target, error } = await ctx.db
    .from("profiles")
    .select("first_name, last_name, email, is_active")
    .eq("id", profileId)
    .maybeSingle();

  if (error) throw new Error(`Could not load that person: ${error.message}`);
  if (!target) throw new Error("That person is not in your school.");
  if (!target.is_active) {
    throw new Error("This account is deactivated. Reactivate it before issuing a new password.");
  }

  const tempPassword = generateTempPassword();
  const expiresAt = tempPasswordExpiry(new Date());

  const { error: pwError } = await createServiceClient().auth.admin.updateUserById(profileId, {
    password: tempPassword,
  });
  if (pwError) throw new Error(`Could not set a new temporary password: ${pwError.message}`);

  await markTempCredential(profileId, expiresAt);

  return {
    profileId,
    personName: `${target.first_name} ${target.last_name}`,
    email: target.email,
    tempPassword,
    expiresAt,
  };
}

export interface PortalInvite {
  /** Present when delivery was "link" — the admin copies this and sends it themselves. */
  link: string | null;
  /** True when an email was dispatched to the recipient. */
  emailSent: boolean;
  email: string;
}

/**
 * Grant portal access to an existing profile, either by emailing them or by handing the admin a link
 * to send themselves.
 *
 * The "link" mode is not a fallback — for Ghanaian day schools it is the primary channel. Staff
 * already coordinate with parents over WhatsApp, many parents don't check email, and pasting a link
 * into a chat gives the admin immediate confirmation it arrived. Email is offered alongside for the
 * parents who do use it.
 *
 * A `recovery` link is used rather than an `invite` one because the account already exists (created
 * silently by `provisionUser`) and `inviteUserByEmail` refuses an address that is already registered.
 * Functionally identical from the recipient's side: a one-time link that lets them set a password.
 */
export async function invitePortalUser(
  ctx: TenantContext,
  profileId: string,
  delivery: "email" | "link",
): Promise<PortalInvite> {
  assertAdmin(ctx);

  // Read through the CALLER's client, not the service role: RLS then guarantees an admin can only
  // invite someone in their own school. Looking the email up with elevated rights would make this
  // action a cross-tenant invitation machine.
  const { data: target, error } = await ctx.db
    .from("profiles")
    .select("email, is_active")
    .eq("id", profileId)
    .maybeSingle();

  if (error) throw new Error(`Could not load that person: ${error.message}`);
  if (!target) throw new Error("That person is not in your school.");
  if (!target.is_active) {
    throw new Error("This account is deactivated. Reactivate it before inviting them.");
  }

  const redirectTo = passwordSetupUrl();

  if (delivery === "link") {
    // generateLink returns the URL WITHOUT sending anything — exactly what "copy and WhatsApp it"
    // needs.
    const { data, error: linkError } = await createServiceClient().auth.admin.generateLink({
      type: "recovery",
      email: target.email,
      options: { redirectTo },
    });
    if (linkError || !data.properties?.action_link) {
      throw new Error(`Could not generate an invite link: ${linkError?.message ?? "unknown error"}`);
    }
    return { link: data.properties.action_link, emailSent: false, email: target.email };
  }

  // Sent through the request-scoped anon client, which is the path that actually dispatches mail.
  const { error: mailError } = await ctx.db.auth.resetPasswordForEmail(target.email, {
    redirectTo,
  });
  if (mailError) {
    throw new Error(`Could not email that invitation: ${mailError.message}`);
  }
  return { link: null, emailSent: true, email: target.email };
}

/**
 * Delete an auth user created moments ago, after a later step failed.
 *
 * Provisioning spans two systems: `auth.users` (service role) and `profiles` (RLS). If the profile
 * insert fails, the orphaned auth account would block the admin from ever retrying with that email —
 * the failure would look permanent. There is no cross-system transaction, so this is the compensating
 * action. Best-effort by design: if the cleanup itself fails there is nothing further to do, and
 * throwing here would mask the original error, which is the one worth reporting.
 */
export async function rollbackProvisionedUser(userId: string): Promise<void> {
  try {
    await createServiceClient().auth.admin.deleteUser(userId);
  } catch {
    /* swallowed on purpose — see above */
  }
}

/**
 * The school an anonymous admissions inquiry belongs to.
 *
 * A visitor on the public site has no session, so they cannot be asked which tenant they are writing
 * into, and `anon` has no SELECT policy on `schools` to look it up with. So the slug→id resolution
 * runs with the service role — the ONLY elevated step — and the insert itself still goes through the
 * anon path governed by `inq_anon_insert`. Configure `SCHOOL_SLUG` per deployment.
 */
export async function publicSchoolId(): Promise<string> {
  const slug = process.env.SCHOOL_SLUG ?? "slis";
  const { data, error } = await createServiceClient()
    .from("schools")
    .select("id")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    throw new Error(
      `No school is configured for slug "${slug}". Set SCHOOL_SLUG to a school that exists.`,
    );
  }
  return data.id;
}
