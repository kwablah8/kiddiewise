import { z } from "zod";

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
});
export type TermVM = z.infer<typeof termVM>;

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
});
export type StaffVM = z.infer<typeof staffVM>;

// class_subjects row as shown on a class's assignments panel (and, joined the other way, on a
// staff member's derived "assigned classes/subjects" panel — hence `class_name` alongside
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
});
export type SubjectCreateInput = z.infer<typeof subjectCreateSchema>;
export const subjectUpdateSchema = subjectCreateSchema.partial().extend({ id: z.string() });

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
export const staffUpdateSchema = staffCreateSchema.partial().extend({ id: z.string() });

export const assignSubjectSchema = z.object({
  class_id: z.string().min(1), subject_id: z.string().min(1),
  teacher_id: z.string().nullable().default(null),
});
export type AssignSubjectInput = z.infer<typeof assignSubjectSchema>;
