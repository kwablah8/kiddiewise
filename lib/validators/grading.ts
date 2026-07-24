import { z } from "zod";

// grade_bands (0008): a percentage range → letter grade → remark. The school's grading scale.
export const gradeBandVM = z.object({
  id: z.string(),
  min_score: z.number(),
  max_score: z.number(),
  grade: z.string(),
  remark: z.string(),
});
export type GradeBandVM = z.infer<typeof gradeBandVM>;

// `.refine` yields a ZodEffects (no `.extend`/`.partial`), so keep the fields as a plain object and
// refine create/update separately off it.
const gradeBandFields = z.object({
  min_score: z.coerce.number().min(0, "0–100").max(100, "0–100"),
  max_score: z.coerce.number().min(0, "0–100").max(100, "0–100"),
  grade: z.string().min(1, "Required"),
  remark: z.string().min(1, "Required"),
});
const minLeMax = (d: { min_score: number; max_score: number }) => d.min_score <= d.max_score;
const minLeMaxErr = { message: "Min must be ≤ max", path: ["min_score"] };

export const gradeBandCreateSchema = gradeBandFields.refine(minLeMax, minLeMaxErr);
export type GradeBandCreateInput = z.infer<typeof gradeBandCreateSchema>;
export const gradeBandUpdateSchema = gradeBandFields.extend({ id: z.string() }).refine(minLeMax, minLeMaxErr);
export type GradeBandUpdateInput = z.infer<typeof gradeBandUpdateSchema>;

// assessment_types (0008): name + weight (percent toward the term total). Unique name per school.
export const assessmentTypeVM = z.object({
  id: z.string(),
  name: z.string(),
  weight: z.number(),
});
export type AssessmentTypeVM = z.infer<typeof assessmentTypeVM>;

export const assessmentTypeCreateSchema = z.object({
  name: z.string().min(1, "Required"),
  weight: z.coerce.number().min(0, "0–100").max(100, "0–100"),
});
export type AssessmentTypeCreateInput = z.infer<typeof assessmentTypeCreateSchema>;
export const assessmentTypeUpdateSchema = assessmentTypeCreateSchema.extend({ id: z.string() });
export type AssessmentTypeUpdateInput = z.infer<typeof assessmentTypeUpdateSchema>;
