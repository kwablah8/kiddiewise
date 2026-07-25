import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";
import { homePathForRole, isPathAllowedForRole, isPublicPath } from "@/lib/auth/access";

/**
 * Refreshes the auth cookie AND gates every request.
 *
 * Doing the role check here rather than only in the client layout matters for two reasons: the user
 * never sees a flash of the wrong portal before being bounced, and an attacker can't skip it by
 * disabling JavaScript. It is still not the security boundary — RLS is (golden rule 2). This layer
 * decides which page renders; RLS decides which rows exist.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Revalidates the token against the auth server and rotates the cookie if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === "/login" || pathname === "/reset-password";

  if (!user) {
    // Unauthenticated: marketing and the auth pages are fine, everything else goes to /login.
    if (isPublicPath(pathname)) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Preserve where they were headed so login can return them there.
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Signed in. The role lives on the profile, not the JWT, so this costs one primary-key lookup per
  // navigation. Worth it for a server-side guard; if it ever shows up in latency the fix is a custom
  // access-token hook that stamps the role into app_metadata, not deleting the check.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Authenticated but not provisioned into a school — nothing can be scoped, so don't let them
    // into the app shell. Sign-out happens client-side; here we just refuse the protected route.
    if (isPublicPath(pathname)) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Already signed in: /login and /reset-password are pointless — send them to their portal.
  // /update-password is deliberately NOT in this list: arriving there with a session is the normal
  // recovery flow, since the emailed link signs the user in before they set a new password.
  if (isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = homePathForRole(profile.role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Marketing pages stay open to signed-in users — an admin may legitimately view the public site.
  if (isPublicPath(pathname)) return response;

  if (!isPathAllowedForRole(profile.role, pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = homePathForRole(profile.role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
