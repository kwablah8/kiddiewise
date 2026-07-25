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
]);

/** Whether a path may be viewed without a session. */
export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // Nested marketing content (e.g. /news/first-term-opens) is public with its section.
  return ["/news/", "/gallery/", "/about/"].some((prefix) => pathname.startsWith(prefix));
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
