import { z } from "zod";

export const assessmentListItemVM = z.object({
  id: z.string(),
  title: z.string(),
  class_id: z.string(),
  class_name: z.string(),
  subject_id: z.string(),
  subject_name: z.string(),
  term_id: z.string(),
  term_name: z.string(),
  assessment_type_id: z.string(),
  type_name: z.string(),
  max_score: z.number(),
  date: z.string().nullable(),
  result_count: z.number(),
  is_submitted: z.boolean(),
});
export type AssessmentListItemVM = z.infer<typeof assessmentListItemVM>;

export const assessmentResultVM = z.object({
  student_id: z.string(),
  student_name: z.string(),
  admission_no: z.string(),
  score: z.number(),
  grade: z.string().nullable(),   // derived from the grading scale
  remark: z.string().nullable(),  // derived from the grading scale
});
export type AssessmentResultVM = z.infer<typeof assessmentResultVM>;

export const assessmentDetailVM = assessmentListItemVM.extend({
  results: z.array(assessmentResultVM),
});
export type AssessmentDetailVM = z.infer<typeof assessmentDetailVM>;

export interface AssessmentFilters {
  term_id?: string;
  class_id?: string;
  subject_id?: string;
}

// ---------------------------------------------------------------------------
// Score entry (Teacher → Grade)
// ---------------------------------------------------------------------------

/**
 * One row of the mark sheet. `score` is nullable because "not marked yet" is a real, common state,
 * a teacher enters a class over several sittings, and a student absent for the test has no mark
 * rather than a zero. Conflating the two would quietly turn absences into failures.
 */
export const scoreSheetEntryVM = z.object({
  student_id: z.string(),
  student_name: z.string(),
  admission_no: z.string(),
  score: z.number().nullable(),
  teacher_comment: z.string().nullable(),
  /** Whether this student's mark has been released to the parent. */
  is_submitted: z.boolean(),
});
export type ScoreSheetEntryVM = z.infer<typeof scoreSheetEntryVM>;

export const scoreSheetVM = z.object({
  assessment: assessmentListItemVM,
  entries: z.array(scoreSheetEntryVM),
});
export type ScoreSheetVM = z.infer<typeof scoreSheetVM>;

/**
 * Write contract for saving marks.
 *
 * The upper bound is not here: it is the assessment's own `max_score`, which this schema cannot see.
 * The action loads the assessment and checks it server-side, so the rule holds even if the request
 * bypasses the form entirely.
 */
export const saveResultsSchema = z.object({
  assessment_id: z.string().min(1),
  /** false = save a draft the parent can't see; true = release these marks. */
  submit: z.boolean().default(false),
  entries: z
    .array(
      z.object({
        student_id: z.string().min(1),
        // Blank input arrives as null and means "leave unmarked", no row is written for it.
        score: z.number().min(0, "Score can't be negative").nullable(),
        teacher_comment: z.string().nullable().default(null),
      }),
    )
    .min(1, "Enter at least one score"),
});
export type SaveResultsInput = z.infer<typeof saveResultsSchema>;

export const assessmentCreateSchema = z.object({
  class_id: z.string().min(1, "Select a class"),
  subject_id: z.string().min(1, "Select a subject"),
  term_id: z.string().min(1, "Select a term"),
  assessment_type_id: z.string().min(1, "Select a type"),
  title: z.string().min(1, "Required"),
  max_score: z.coerce.number().positive("Must be greater than 0"),
  // Native date input yields "" when empty → store null (the column is nullable).
  date: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.string().nullable()),
});
export type AssessmentCreateInput = z.infer<typeof assessmentCreateSchema>;

// Class, subject and term are not editable, results already recorded against the assessment
// would silently move with it. Recreate instead.
export const assessmentUpdateSchema = assessmentCreateSchema
  .omit({ class_id: true, subject_id: true, term_id: true })
  .partial()
  .extend({ id: z.string().min(1) });
export type AssessmentUpdateInput = z.infer<typeof assessmentUpdateSchema>;
