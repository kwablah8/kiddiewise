import { z } from "zod";

/**
 * Terminal reports (Admin → Terminal Reports).
 *
 * The stored figures (total, average, position, attendance) are a snapshot taken when the report is
 * generated. See lib/terminal-reports.ts for why a report is frozen while `results.grade` is not.
 */
/** One frozen subject row on the GES card: Class Score · Exams Score · Total · Position · Remarks. */
export const reportSubjectRowVM = z.object({
  subject_name: z.string(),
  class_score: z.number().nullable(),
  exam_score: z.number().nullable(),
  total: z.number().nullable(),
  position: z.number().nullable(),
  remark: z.string().nullable(),
});
export type ReportSubjectRowVM = z.infer<typeof reportSubjectRowVM>;

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
  // The class teacher's per-student card fields (spec 2026-07-31 §2).
  conduct: z.string().nullable(),
  attitude: z.string().nullable(),
  interest: z.string().nullable(),
  promoted_to: z.string().nullable(),
  /** "Number on roll" at generation time; null before the report exists. */
  enrolled_count: z.number().nullable(),
  /** Frozen at generation; empty until the report has been generated. */
  subjects: z.array(reportSubjectRowVM),
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

// Empty string from a cleared textarea means "not filled", which is null in the column.
const cardText = (max: number, label: string) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().max(max, `Keep ${label} under ${max} characters`).nullable(),
  );

// Every field optional: an omitted key means "leave that column alone" (the action patches only
// what was sent), while an empty string explicitly clears. Same lesson as staffUpdateSchema — a
// caller saving one field must not wipe the others.
export const reportCommentsSchema = z.object({
  id: z.string().min(1),
  class_teacher_comment: cardText(1000, "the comment").optional(),
  head_teacher_comment: cardText(1000, "the comment").optional(),
  conduct: cardText(500, "conduct").optional(),
  attitude: cardText(500, "attitude").optional(),
  interest: cardText(500, "interest").optional(),
  promoted_to: cardText(100, "promoted-to").optional(),
});
export type ReportCommentsInput = z.infer<typeof reportCommentsSchema>;

export const publishReportsSchema = z.object({
  class_id: z.string().min(1),
  term_id: z.string().min(1),
  published: z.boolean(),
});
export type PublishReportsInput = z.infer<typeof publishReportsSchema>;
