import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import type { AppRole } from "@/lib/auth/access";

/**
 * Server-side session access. Every Server Component, Server Action and route handler that needs to
 * know who is calling goes through here.
 *
 * `profiles` is the app's identity record; `auth.users` only proves the credential. The role and
 * school_id that scope every query live on the profile, so "signed in" means both exist, an auth
 * user without a profile row is treated as signed out rather than as a user with no permissions.
 */

/** The caller's profile, or null when there is no valid session. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  // getUser() revalidates the JWT against the auth server. getSession() only decodes the cookie,
  // which a hostile client controls, never use it to make an authorization decision.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data ?? null;
}

/** The caller's profile, redirecting to /login when there is none. Use in protected pages. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return profile;
}

/**
 * The caller's profile, asserting one of `roles`. Bounced to their own portal home rather than
 * /login when signed in as the wrong role, being logged in but on the wrong page is a navigation
 * mistake, not an authentication failure.
 *
 * This is a convenience for pages, not the security boundary; RLS is. A missed
 * call here shows the wrong chrome; it does not leak another school's or role's data.
 */
export async function requireRole(...roles: AppRole[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!roles.includes(profile.role)) {
    const { homePathForRole } = await import("@/lib/auth/access");
    redirect(homePathForRole(profile.role));
  }
  return profile;
}

/**
 * The active academic year and term for the caller's school. Writes that need a term (attendance,
 * assessments) and reads that scope to "this term" both need it, and it is a property of the
 * school rather than of the request, so it is resolved here rather than passed through the UI.
 */
export async function getActiveContext(): Promise<{
  schoolId: string;
  academicYearId: string | null;
  termId: string | null;
}> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("schools")
    .select("id, active_academic_year_id, active_term_id")
    .eq("id", profile.school_id!)
    .single();

  return {
    schoolId: profile.school_id!,
    academicYearId: data?.active_academic_year_id ?? null,
    termId: data?.active_term_id ?? null,
  };
}
