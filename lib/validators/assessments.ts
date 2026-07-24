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
