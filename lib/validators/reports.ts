import { z } from "zod";

/**
 * Terminal reports (Admin → Terminal Reports).
 *
 * The stored figures (total, average, position, attendance) are a snapshot taken when the report is
 * generated. See lib/terminal-reports.ts for why a report is frozen while `results.grade` is not.
 */
export const terminalReportRowVM = z.object({
  /** Null before the report has been generated for this student. */
  id: z.string().nullable(),
  student_id: z.string(),
  student_name: z.string(),
  admission_no: z.string(),
  subject_count: z.number(),
  total_score: z.number().nullable(),
  average_score: z.number().nullable(),
  /** Derived from the average via the school's bands at read time — a label, not a stored value. */
  overall_grade: z.string().nullable(),
  position: z.number().nullable(),
  attendance_present: z.number(),
  attendance_total: z.number(),
  class_teacher_comment: z.string().nullable(),
  head_teacher_comment: z.string().nullable(),
  is_published: z.boolean(),
  generated_at: z.string().nullable(),
});
export type TerminalReportRowVM = z.infer<typeof terminalReportRowVM>;

export const terminalReportSheetVM = z.object({
  class_id: z.string(),
  class_name: z.string(),
  term_id: z.string(),
  term_name: z.string(),
  rows: z.array(terminalReportRowVM),
  /** How many of the generated rows are published — drives the publish/unpublish affordance. */
  published_count: z.number(),
  generated_count: z.number(),
});
export type TerminalReportSheetVM = z.infer<typeof terminalReportSheetVM>;

export interface TerminalReportFilter {
  class_id?: string;
  term_id?: string;
}

// ---- write contracts ----

export const generateReportsSchema = z.object({
  class_id: z.string().min(1, "Select a class"),
  term_id: z.string().min(1, "Select a term"),
});
export type GenerateReportsInput = z.infer<typeof generateReportsSchema>;

export const reportCommentsSchema = z.object({
  id: z.string().min(1),
  // Empty string from a cleared textarea means "no comment", which is null in the column.
  class_teacher_comment: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().max(1000, "Keep the comment under 1000 characters").nullable(),
  ),
  head_teacher_comment: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().max(1000, "Keep the comment under 1000 characters").nullable(),
  ),
});
export type ReportCommentsInput = z.infer<typeof reportCommentsSchema>;

export const publishReportsSchema = z.object({
  class_id: z.string().min(1),
  term_id: z.string().min(1),
  published: z.boolean(),
});
export type PublishReportsInput = z.infer<typeof publishReportsSchema>;
