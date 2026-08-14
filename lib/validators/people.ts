import { z } from "zod";
import { subjectResultVM } from "@/lib/validators/parent";

export const bloodGroup = z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);
export type BloodGroup = z.infer<typeof bloodGroup>;

// Student as shown in the list: student row + derived active-enrollment class + guardian names.
export const studentListItemVM = z.object({
  id: z.string(),
  admission_no: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  gender: z.enum(["male", "female", "other"]),
  enrollment_status: z.enum(["active", "inactive", "graduated", "withdrawn", "transferred"]),
  photo_url: z.string().nullable(),
  class_id: z.string().nullable(),
  class_name: z.string().nullable(),
  guardian_names: z.array(z.string()),
});
export type StudentListItemVM = z.infer<typeof studentListItemVM>;

export const guardianVM = z.object({
  parent_profile_id: z.string(),
  name: z.string(),
  email: z.string(),
  occupation: z.string().nullable(),
  relationship: z.enum(["mother", "father", "guardian", "other"]),
  is_primary: z.boolean(),
});
export const studentDetailVM = studentListItemVM.extend({
  date_of_birth: z.string(),
  guardians: z.array(guardianVM),
  other_names: z.string().nullable(),
  blood_group: bloodGroup.nullable(),
  enrollment_date: z.string().nullable(),
  medical_conditions: z.string().nullable(),
  allergies: z.string().nullable(),
  prev_school_name: z.string().nullable(),
  prev_class_ended: z.string().nullable(),
  prev_average_score: z.string().nullable(),
  prev_year_attended: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  town: z.string().nullable(),
  initial_academic_year_id: z.string().nullable(),
  initial_term_id: z.string().nullable(),
});
export type StudentDetailVM = z.infer<typeof studentDetailVM>;
export type GuardianVM = z.infer<typeof guardianVM>;

/**
 * Whether the holder has taken ownership of their portal account.
 *  - `active`   — they signed in and replaced the temporary password. The account is theirs.
 *  - `pending`  — temporary credentials issued, not yet used. The admin still knows the password.
 *  - `expired`  — the temporary password lapsed unused; the admin must issue a fresh one.
 *  - `no_access` — no credentials have ever been issued (e.g. invited by link, never completed).
 */
export const portalAccessStatus = z.enum(["active", "pending", "expired", "no_access"]);
export type PortalAccessStatus = z.infer<typeof portalAccessStatus>;

export const PORTAL_ACCESS_LABEL: Record<PortalAccessStatus, string> = {
  active: "Active",
  pending: "Awaiting first sign-in",
  expired: "Password expired",
  no_access: "No access yet",
};

export const parentListItemVM = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  occupation: z.string().nullable(),
  children_names: z.array(z.string()),
  portal_status: portalAccessStatus,
});
export type ParentListItemVM = z.infer<typeof parentListItemVM>;

// Inline "Add New Guardian" from the student drawer. All optional; the create action treats it as
// "provided" only when first_name, last_name and a valid email are present, then creates a parent
// (with occupation/phone) and links them as the primary guardian with the chosen relationship.
export const newGuardianSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  relationship: z.enum(["mother", "father", "guardian", "other"]),
  occupation: z.string(),
  phone: z.string(),
  email: z.string(),
});
export type NewGuardianInput = z.infer<typeof newGuardianSchema>;

// Class option for the enrollment dropdown (from Academics; mocked here until Slice 3).
export const classOptionVM = z.object({ id: z.string(), name: z.string(), level: z.string() });
export type ClassOptionVM = z.infer<typeof classOptionVM>;

// Write inputs (final Server Action contracts).
export const studentCreateSchema = z.object({
  first_name: z.string().trim().min(1, "Required").max(80, "That name is too long"),
  last_name: z.string().trim().min(1, "Required").max(80, "That name is too long"),
  date_of_birth: z.string().min(1, "Required"), // ISO date
  gender: z.enum(["male", "female", "other"]),
  admission_no: z.string().default(""), // "" → auto-generated in the action
  class_id: z.string().nullable(), // creates enrollment when set
  photo_url: z.string().nullable(),
  enrollment_status: z
    .enum(["active", "inactive", "graduated", "withdrawn", "transferred"])
    .default("active"),
  guardian_ids: z.array(z.string()).default([]), // link existing parents
  other_names: z.string().nullable().default(null),
  blood_group: bloodGroup.nullable().default(null),
  enrollment_date: z.string().nullable().default(null),
  medical_conditions: z.string().trim().max(1000, "Keep this under 1000 characters").nullable().default(null),
  allergies: z.string().trim().max(1000, "Keep this under 1000 characters").nullable().default(null),
  prev_school_name: z.string().nullable().default(null),
  prev_class_ended: z.string().nullable().default(null),
  prev_average_score: z.string().nullable().default(null),
  prev_year_attended: z.string().nullable().default(null),
  email: z.string().nullable().default(null),
  phone: z.string().nullable().default(null),
  address: z.string().trim().max(300, "Keep this under 300 characters").nullable().default(null),
  city: z.string().nullable().default(null),
  town: z.string().nullable().default(null),
  initial_academic_year_id: z.string().nullable().default(null),
  initial_term_id: z.string().nullable().default(null),
  new_guardian: newGuardianSchema.partial().nullable().default(null),
});
export type StudentCreateInput = z.infer<typeof studentCreateSchema>;
export const studentUpdateSchema = studentCreateSchema.partial().extend({ id: z.string() });
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;

export const parentCreateSchema = z.object({
  first_name: z.string().trim().min(1, "Required").max(80, "That name is too long"),
  last_name: z.string().trim().min(1, "Required").max(80, "That name is too long"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().nullable(),
  occupation: z.string().trim().max(120, "Keep this under 120 characters").nullable().default(null),
});
export type ParentCreateInput = z.infer<typeof parentCreateSchema>;

export const linkGuardianSchema = z.object({
  student_id: z.string(),
  parent_profile_id: z.string(),
  relationship: z.enum(["mother", "father", "guardian", "other"]),
  is_primary: z.boolean(),
});
export type LinkGuardianInput = z.infer<typeof linkGuardianSchema>;

// Academic performance (admin view of a single student): this term's per-subject results (same
// shape the parent portal reads, subject/score/grade/remark/teacher_comment) plus the published
// terminal report, if any. Ungated — unlike the parent portal's guardian-scoped equivalent, this
// is the admin's own read of the school's data, so there is no guardian check.
export const studentAcademicsVM = z.object({
  term_name: z.string(),
  subjects: z.array(subjectResultVM),
  report: z
    .object({
      published: z.boolean(),
      class_teacher_remark: z.string(),
      overall_average: z.number().nullable(),
      overall_grade: z.string().nullable(),
    })
    .nullable(),
});
export type StudentAcademicsVM = z.infer<typeof studentAcademicsVM>;

export const studentStatsVM = z.object({
  total: z.number(),
  active: z.number(),
  assigned: z.number(),
  male: z.number(),
  female: z.number(),
});
export type StudentStatsVM = z.infer<typeof studentStatsVM>;
