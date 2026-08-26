import { z } from "zod";
// Portal access is one concept across the platform: a staff member and a parent hold the same kind
// of admin-issued credential, so they share the enum and its labels rather than each defining one.
import { portalAccessStatus } from "@/lib/validators/people";

export const academicYearVM = z.object({
  id: z.string(), name: z.string(),           // "2026/2027"
  start_date: z.string(), end_date: z.string(), is_active: z.boolean(),
  term_count: z.number(),
});
export type AcademicYearVM = z.infer<typeof academicYearVM>;

export const termVM = z.object({
  id: z.string(), academic_year_id: z.string(), name: z.string(),
  ordinal: z.number().int().min(1).max(3),
  start_date: z.string(), end_date: z.string(), is_active: z.boolean(),
  // When school reopens after this term, printed on its reports. Null until confirmed; a
  // placeholder date on a report card is worse than a blank one. See migration 0023.
  reopening_date: z.string().nullable(),
});
export type TermVM = z.infer<typeof termVM>;

export const setReopeningDateSchema = z.object({
  term_id: z.string().min(1),
  // Null clears it, which is the "×" on the terminal reports banner.
  reopening_date: z.string().nullable(),
});
export type SetReopeningDateInput = z.infer<typeof setReopeningDateSchema>;

export const classVM = z.object({
  id: z.string(), name: z.string(), level: z.string(),
  capacity: z.number().nullable(),
  class_teacher_id: z.string().nullable(), class_teacher_name: z.string().nullable(),
  student_count: z.number(),            // derived from active-year enrollments
  subject_count: z.number(),            // derived from class_subjects
});
export type ClassVM = z.infer<typeof classVM>;

export const subjectVM = z.object({
  id: z.string(), name: z.string(), code: z.string().nullable(), class_count: z.number(),
  // False when the school has stopped teaching it. Kept rather than deleted so existing marks and
  // class assignments still resolve, see migration 0022.
  is_active: z.boolean(),
});
export type SubjectVM = z.infer<typeof subjectVM>;

// A staff member's auth role (drives portal access + staff_no prefix). Non-teaching staff are
// filed under `school_admin`; `position` carries the finer job title. (03-DATABASE user_role.)
export const staffRole = z.enum(["teacher", "school_admin"]);
export type StaffRole = z.infer<typeof staffRole>;
export const staffGender = z.enum(["male", "female", "other"]);
export type StaffGender = z.infer<typeof staffGender>;

export const staffVM = z.object({
  id: z.string(), first_name: z.string(), last_name: z.string(),
  email: z.string(), phone: z.string().nullable(),
  staff_no: z.string(),
  role: staffRole,
  position: z.string().nullable(),          // free-text title, e.g. "Head Teacher", "Accountant"
  department: z.string().nullable(),
  gender: staffGender.nullable(),
  date_of_birth: z.string().nullable(),
  hire_date: z.string().nullable(),         // employment / joined date
  qualification: z.string().nullable(),
  is_active: z.boolean(),
  class_count: z.number(), subject_count: z.number(),   // derived from class_subjects + class_teacher
  // Same credential lifecycle as a parent, staff are handed a generated temporary password at
  // creation and must replace it on first sign-in. Derived from the profile's password columns.
  portal_status: portalAccessStatus,
});
export type StaffVM = z.infer<typeof staffVM>;

// class_subjects row as shown on a class's assignments panel (and, joined the other way, on a
// staff member's derived "assigned classes/subjects" panel, hence `class_name` alongside
// `subject_name`).
export const assignmentVM = z.object({
  id: z.string(), class_id: z.string(), class_name: z.string(),
  subject_id: z.string(), subject_name: z.string(),
  teacher_id: z.string().nullable(), teacher_name: z.string().nullable(),
});
export type AssignmentVM = z.infer<typeof assignmentVM>;

export const activeContextVM = z.object({
  active_year: academicYearVM.nullable(), active_term: termVM.nullable(),
});
export type ActiveContextVM = z.infer<typeof activeContextVM>;

// ---- write schemas (final Server-Action contracts) ----
export const academicYearCreateSchema = z.object({
  name: z.string().min(1, "Required"),
  start_date: z.string().min(1, "Required"), end_date: z.string().min(1, "Required"),
});
export type AcademicYearCreateInput = z.infer<typeof academicYearCreateSchema>;

export const termCreateSchema = z.object({
  academic_year_id: z.string().min(1),
  name: z.string().min(1, "Required"),
  ordinal: z.coerce.number().int().min(1).max(3),
  start_date: z.string().min(1, "Required"), end_date: z.string().min(1, "Required"),
});
export type TermCreateInput = z.infer<typeof termCreateSchema>;

export const academicYearUpdateSchema = academicYearCreateSchema.partial().extend({ id: z.string().min(1) });
export type AcademicYearUpdateInput = z.infer<typeof academicYearUpdateSchema>;
// A term cannot move to another year, that would drag its attendance and assessments with it.
export const termUpdateSchema = termCreateSchema
  .omit({ academic_year_id: true })
  .partial()
  .extend({ id: z.string().min(1) });
export type TermUpdateInput = z.infer<typeof termUpdateSchema>;

export const classCreateSchema = z.object({
  name: z.string().min(1, "Required"), level: z.string().min(1, "Required"),
  capacity: z.coerce.number().int().positive().nullable().default(null),
  class_teacher_id: z.string().nullable().default(null),
});
export type ClassCreateInput = z.infer<typeof classCreateSchema>;
export const classUpdateSchema = classCreateSchema.partial().extend({ id: z.string() });
export type ClassUpdateInput = z.infer<typeof classUpdateSchema>;

export const subjectCreateSchema = z.object({
  name: z.string().min(1, "Required"), code: z.string().nullable().default(null),
  // A subject is created because it is being taught, so the default is active. The form does not
  // ask; the status is changed later, from the list, when the school drops it.
  is_active: z.boolean().default(true),
});
export type SubjectCreateInput = z.infer<typeof subjectCreateSchema>;
export const subjectUpdateSchema = subjectCreateSchema.partial().extend({ id: z.string() });

// `is_active` is a security state, not a display flag: flipping it false also bans the auth
// account (lib/actions/academics.ts), so a departed staff member cannot sign in.
export const staffCreateSchema = z.object({
  first_name: z.string().min(1, "Required"), last_name: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email"),
  role: staffRole.default("teacher"),
  phone: z.string().nullable().default(null),
  position: z.string().nullable().default(null),
  department: z.string().nullable().default(null),
  gender: staffGender.nullable().default(null),
  date_of_birth: z.string().nullable().default(null),
  hire_date: z.string().nullable().default(null),
  qualification: z.string().nullable().default(null),
});
export type StaffCreateInput = z.infer<typeof staffCreateSchema>;
// not `staffCreateSchema.partial()`: the create schema's `.default(null)`s would turn an omitted
// key into an explicit null, and updateStaff writes what it's given, a status-only toggle
// (`{ id, is_active }`) would silently wipe every other column. Here an omitted key stays
// undefined, which the action reads as "leave that column alone". `role` is deliberately absent,
// changing someone's role is not an edit, it's a re-provisioning decision this app doesn't offer.
export const staffUpdateSchema = z.object({
  id: z.string(),
  first_name: z.string().min(1, "Required").optional(),
  last_name: z.string().min(1, "Required").optional(),
  email: z.string().email("Enter a valid email").optional(),
  phone: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  gender: staffGender.nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  hire_date: z.string().nullable().optional(),
  qualification: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export const assignSubjectSchema = z.object({
  class_id: z.string().min(1), subject_id: z.string().min(1),
  teacher_id: z.string().nullable().default(null),
});
export type AssignSubjectInput = z.infer<typeof assignSubjectSchema>;
