import { z } from "zod";

// Dashboard child card. attendance_pct + latest_result are nullable: their real values arrive with
// Slices 2–3 (attendance + results); Slice 1 returns null and the card renders a gentle placeholder.
export const childSummaryVM = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  photo_url: z.string().nullable(),
  class_name: z.string().nullable(),
  attendance_pct: z.number().nullable(),
  latest_result: z
    .object({ subject: z.string(), score: z.number(), grade: z.string() })
    .nullable(),
});
export type ChildSummaryVM = z.infer<typeof childSummaryVM>;

// Announcement targeted at parents (03-DATABASE announcements.audience). Mock is school-wide.
export const parentAnnouncementVM = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  audience: z.enum(["parents", "everyone"]),
  created_at: z.string(),
});
export type ParentAnnouncementVM = z.infer<typeof parentAnnouncementVM>;

// Child profile (Slice 2): the student's own details + the teachers who take their class. `subject`
// is the subject a teacher takes, or "Class teacher" for the homeroom teacher.
export const childProfileVM = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  other_names: z.string().nullable(),
  photo_url: z.string().nullable(),
  admission_no: z.string(),
  date_of_birth: z.string(),
  gender: z.enum(["male", "female", "other"]),
  class_name: z.string().nullable(),
  teachers: z.array(z.object({ name: z.string(), subject: z.string() })),
});
export type ChildProfileVM = z.infer<typeof childProfileVM>;

// Attendance (Slice 2). Records are per-child dated statuses; the summary is derived from them.
export const attendanceStatus = z.enum(["present", "absent", "late"]);
export type AttendanceStatus = z.infer<typeof attendanceStatus>;

export const attendanceRecordVM = z.object({
  date: z.string(),
  status: attendanceStatus,
});
export type AttendanceRecordVM = z.infer<typeof attendanceRecordVM>;

export const attendanceSummaryVM = z.object({
  present: z.number(),
  absent: z.number(),
  late: z.number(),
  total: z.number(),
  pct: z.number().nullable(),
});
export type AttendanceSummaryVM = z.infer<typeof attendanceSummaryVM>;
