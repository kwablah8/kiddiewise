import { z } from "zod";

import {
  extraFeeAssignmentVM,
  feesOverviewVM,
  paymentVM,
  studentFeeVM,
} from "@/lib/validators/fees";

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
// Only submitted results reach the parent: the read filters on `results.is_submitted`, so a
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
// `tr_parent_read` policy checks is_published, and the read filters on it too), an unpublished or
// absent report resolves to null.
/** One frozen subject row of the child's report card, as published by the school. */
export const childReportSubjectVM = z.object({
  subject_name: z.string(),
  short_code: z.string().nullable(),
  class_score: z.number().nullable(),
  exam_score: z.number().nullable(),
  total: z.number().nullable(),
  class_average: z.number().nullable(),
  class_lowest: z.number().nullable(),
  class_highest: z.number().nullable(),
  grade: z.string().nullable(),
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
  /** The card's "Total Score" line: the sum of the subject totals, not an average. */
  total_score: z.number().nullable(),
  class_teacher_remark: z.string(),
  /** The head's line on the card. Written by the admin, published with the rest of it. */
  head_teacher_remark: z.string(),
  /** The GES subject table. Empty for reports generated before the subject snapshot existed. */
  subjects: z.array(childReportSubjectVM),
  // Everything else the printed card carries (spec 2026-07-31): the header block, attendance,
  // and the class teacher's per-child paragraphs.
  class_name: z.string().nullable(),
  level_name: z.string().nullable(),
  class_teacher_name: z.string().nullable(),
  year_name: z.string().nullable(),
  position: z.number().nullable(),
  passes: z.number().nullable(),
  class_average: z.number().nullable(),
  class_lowest_average: z.number().nullable(),
  class_highest_average: z.number().nullable(),
  level_position: z.number().nullable(),
  level_size: z.number().nullable(),
  enrolled_count: z.number().nullable(),
  attendance_present: z.number(),
  attendance_total: z.number(),
  conduct: z.string().nullable(),
  attitude: z.string().nullable(),
  interest: z.string().nullable(),
  promoted_to: z.string().nullable(),
  // When school reopens after this term, if the school has set it. The line parents look for first
  // after the grades; they plan childcare, travel and fees around it.
  reopening_date: z.string().nullable(),
});
export type TerminalReportVM = z.infer<typeof terminalReportVM>;

// ---------------------------------------------------------------------------
// Fees
// ---------------------------------------------------------------------------

/**
 * A child's fee position as the parent portal shows it.
 *
 * Composed from the ADMIN fee view-models on purpose, rather than a parent-shaped copy of them: the
 * same `student_fee_positions` view, the same `summarizeFees` arithmetic and the same payment rows
 * back both screens, so what a parent is told they owe and what the office's Fees screen shows for
 * that child cannot drift apart. Parents remain read-only, RLS grants them SELECT
 * on `invoices` / `payments` / `extra_fee_assignments` for their own children and nothing more.
 */
export const childFeesVM = z.object({
  /** The academic year `class_fees` belongs to. Null when the school has no active year set. */
  year_name: z.string().nullable(),
  /** The derived figures behind the summary card, see `lib/fees/summary.ts`. */
  overview: feesOverviewVM,
  /** One row per invoice raised for the active year: a full-year invoice, or one per term. */
  class_fees: z.array(studentFeeVM),
  /** Assigned extra fees, uniform, exam, PTA levy. These carry no academic year of their own. */
  extra_fees: z.array(extraFeeAssignmentVM),
  /**
   * Every payment recorded for this child, newest first, deliberately not scoped to the active
   * year. A receipt from a previous year is still the parent's proof of payment, so the history has
   * to outlive the year it was collected in.
   */
  payments: z.array(paymentVM),
});
export type ChildFeesVM = z.infer<typeof childFeesVM>;
