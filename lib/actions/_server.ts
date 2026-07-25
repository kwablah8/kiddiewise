import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireProfile } from "@/lib/auth/session";
import type { Profile } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

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

/**
 * Create the auth account behind a new staff member or parent, and return its id.
 *
 * `profiles.id` is a foreign key to `auth.users(id)`, so a person cannot exist in this system without
 * an auth account — there is no such thing as a profile-only record. Creating one needs the service
 * role, which is why every caller must already hold a `tenant()` context: that proves the caller is
 * signed in, and the role check below proves they are an admin.
 *
 * Invited rather than created with a password. `inviteUserByEmail` both creates the account and emails
 * the recipient a link to set their own credential — so no password is ever chosen, transmitted or
 * known by whoever added them. `createUser` would leave the account with an unusable password hash and
 * send nothing, stranding the new user with no way to discover they should reset it.
 *
 * Locally the invite email lands in Mailpit (http://127.0.0.1:54324), not a real inbox.
 */
export async function provisionUser(ctx: TenantContext, email: string): Promise<string> {
  if (ctx.profile.role !== "school_admin" && ctx.profile.role !== "super_admin") {
    throw new Error("Only an administrator can add staff or parents.");
  }

  const admin = createServiceClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email);

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
  const slug = process.env.SCHOOL_SLUG ?? "kiddiewise";
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
