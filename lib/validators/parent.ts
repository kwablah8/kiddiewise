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

// Results (Slice 3): a per-subject term score with its derived grade/remark and the teacher's note.
// Only submitted results reach the parent — the read filters on `results.is_submitted`, so a
// teacher's work-in-progress marks are never visible.
export const subjectResultVM = z.object({
  subject: z.string(),
  score: z.number(),
  grade: z.string(),
  remark: z.string(),
  teacher_comment: z.string().nullable(),
});
export type SubjectResultVM = z.infer<typeof subjectResultVM>;

export const childResultsVM = z.object({
  term_name: z.string(),
  subjects: z.array(subjectResultVM),
});
export type ChildResultsVM = z.infer<typeof childResultsVM>;

// The published terminal report for a term. Only published reports are ever returned (the
// `tr_parent_read` policy checks is_published, and the read filters on it too) — an unpublished or
// absent report resolves to null.
/** One frozen subject row of the child's report card, as published by the school. */
export const childReportSubjectVM = z.object({
  subject_name: z.string(),
  class_score: z.number().nullable(),
  exam_score: z.number().nullable(),
  total: z.number().nullable(),
  position: z.number().nullable(),
  remark: z.string().nullable(),
});
export type ChildReportSubjectVM = z.infer<typeof childReportSubjectVM>;

export const terminalReportVM = z.object({
  id: z.string(),
  term_name: z.string(),
  published: z.boolean(),
  overall_average: z.number().nullable(),
  overall_grade: z.string().nullable(),
  class_teacher_remark: z.string(),
  /** The GES subject table. Empty for reports generated before the subject snapshot existed. */
  subjects: z.array(childReportSubjectVM),
  // When school reopens after this term, if the school has set it. The line parents look for first
  // after the grades — they plan childcare, travel and fees around it.
  reopening_date: z.string().nullable(),
});
export type TerminalReportVM = z.infer<typeof terminalReportVM>;
