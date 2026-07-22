import { z } from "zod";

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
  relationship: z.enum(["mother", "father", "guardian", "other"]),
  is_primary: z.boolean(),
});
export const studentDetailVM = studentListItemVM.extend({
  date_of_birth: z.string(),
  guardians: z.array(guardianVM),
});
export type StudentDetailVM = z.infer<typeof studentDetailVM>;
export type GuardianVM = z.infer<typeof guardianVM>;

export const parentListItemVM = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  children_names: z.array(z.string()),
});
export type ParentListItemVM = z.infer<typeof parentListItemVM>;

// Class option for the enrollment dropdown (from Academics; mocked here until Slice 3).
export const classOptionVM = z.object({ id: z.string(), name: z.string(), level: z.string() });
export type ClassOptionVM = z.infer<typeof classOptionVM>;

// Write inputs (final Server Action contracts).
export const studentCreateSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  date_of_birth: z.string().min(1, "Required"), // ISO date
  gender: z.enum(["male", "female", "other"]),
  admission_no: z.string().min(1, "Required"),
  class_id: z.string().nullable(), // creates enrollment when set
  photo_url: z.string().nullable(),
  enrollment_status: z
    .enum(["active", "inactive", "graduated", "withdrawn", "transferred"])
    .default("active"),
  guardian_ids: z.array(z.string()).default([]), // link existing parents
});
export type StudentCreateInput = z.infer<typeof studentCreateSchema>;
export const studentUpdateSchema = studentCreateSchema.partial().extend({ id: z.string() });
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;

export const parentCreateSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().nullable(),
});
export type ParentCreateInput = z.infer<typeof parentCreateSchema>;

export const linkGuardianSchema = z.object({
  student_id: z.string(),
  parent_profile_id: z.string(),
  relationship: z.enum(["mother", "father", "guardian", "other"]),
  is_primary: z.boolean(),
});
export type LinkGuardianInput = z.infer<typeof linkGuardianSchema>;
