import type { Profile } from "@/lib/types";

export type AppRole = Profile["role"]; // "super_admin" | "school_admin" | "teacher" | "parent"

const TEACHER_ROOT = "/teacher";

function isInTeacherSubtree(pathname: string): boolean {
  return pathname === TEACHER_ROOT || pathname.startsWith(`${TEACHER_ROOT}/`);
}

/** Portal home per role — where login lands a user and where the guard bounces them back to. */
export function homePathForRole(role: AppRole): string {
  if (role === "teacher") return "/teacher/dashboard";
  if (role === "parent") return "/portal";
  return "/dashboard"; // school_admin | super_admin
}

/** Whether a role may view an (app) path. Teachers own /teacher/*; admins own everything else under
 *  (app); parents own nothing under (app) yet (they live at /portal). */
export function isPathAllowedForRole(role: AppRole, pathname: string): boolean {
  const inTeacher = isInTeacherSubtree(pathname);
  if (role === "teacher") return inTeacher;
  if (role === "parent") return false;
  return !inTeacher; // school_admin | super_admin
}
