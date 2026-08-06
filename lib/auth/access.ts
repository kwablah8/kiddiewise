import type { Profile } from "@/lib/types";

export type AppRole = Profile["role"]; // "super_admin" | "school_admin" | "teacher" | "parent"

const TEACHER_ROOT = "/teacher";
const PARENT_ROOT = "/parent";

function inSubtree(pathname: string, root: string): boolean {
  return pathname === root || pathname.startsWith(`${root}/`);
}

/** Portal home per role — where login lands a user and where the guard bounces them back to. */
export function homePathForRole(role: AppRole): string {
  if (role === "teacher") return "/teacher/dashboard";
  if (role === "parent") return "/parent/dashboard";
  return "/dashboard"; // school_admin | super_admin
}

// Route groups like (app) and (marketing) don't appear in the URL, so the middleware can't infer
// "is this page protected" from the path shape. We list what is PUBLIC and treat everything else as
// requiring a session — so a newly added admin route is protected by default. Getting this
// backwards (listing protected paths) is how pages ship unguarded.
const PUBLIC_PATHS = new Set([
  "/", // marketing home
  "/about",
  "/admissions",
  "/news",
  "/gallery",
  "/contact",
  "/login",
  "/reset-password",
  "/update-password",
  // The Sanity Studio. "Public" here means "this app's session guard does not apply", NOT "open":
  // the Studio authenticates against Sanity itself and shows a login screen to anyone without a
  // Sanity account on the project. Listing it is what stops `updateSession` from bouncing an
  // unauthenticated editor to /login, and — because `isPublicPath` is consulted BEFORE the role
  // check — what stops a signed-in teacher or parent from being redirected to their own portal.
  "/studio",
  // Sanity's revalidation webhook. Sanity's servers have no session with us, so the session guard has
  // to let this POST through — it is protected by an HMAC signature against SANITY_REVALIDATE_SECRET
  // instead, verified in the route itself. Without this entry the middleware redirects the webhook to
  // /login and publishing silently stops reaching the site.
  "/api/revalidate-sanity",
]);

/** Whether a path may be viewed without a session. */
export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // Nested marketing content (e.g. /news/first-term-opens) is public with its section. `/studio/` is
  // here because the Studio is a catch-all route that navigates into deep paths of its own
  // (/studio/structure/newsPost, /studio/vision, …), all of it the same one app.
  return ["/news/", "/gallery/", "/about/", "/studio/"].some((prefix) =>
    pathname.startsWith(prefix),
  );
}

/** Whether a role may view an (app) path. Teachers own /teacher/*; parents own /parent/*; admins own
 *  everything else under (app). Note /teachers and /parents (admin management routes) are NOT the
 *  /teacher and /parent subtrees. */
export function isPathAllowedForRole(role: AppRole, pathname: string): boolean {
  const inTeacher = inSubtree(pathname, TEACHER_ROOT);
  const inParent = inSubtree(pathname, PARENT_ROOT);
  if (role === "teacher") return inTeacher;
  if (role === "parent") return inParent;
  return !inTeacher && !inParent; // school_admin | super_admin
}
