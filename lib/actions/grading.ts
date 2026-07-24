import { store } from "@/lib/mock/store";
import {
  gradeBandCreateSchema,
  gradeBandUpdateSchema,
  assessmentTypeCreateSchema,
  assessmentTypeUpdateSchema,
  type GradeBandCreateInput,
  type GradeBandUpdateInput,
  type AssessmentTypeCreateInput,
  type AssessmentTypeUpdateInput,
} from "@/lib/validators/grading";

// SEAM: each becomes a Server Action calling Supabase (grade_bands / assessment_types are admin-write
// per 0008 RLS); signatures + validation stay identical, only the body swaps.

export async function createGradeBand(input: GradeBandCreateInput): Promise<{ id: string }> {
  const data = gradeBandCreateSchema.parse(input);
  const id = crypto.randomUUID();
  store.addGradeBand({ id, ...data });
  return { id };
}

export async function updateGradeBand(input: GradeBandUpdateInput): Promise<{ id: string }> {
  const { id, ...rest } = gradeBandUpdateSchema.parse(input);
  store.updateGradeBand(id, rest);
  return { id };
}

export async function deleteGradeBand(input: { id: string }): Promise<{ ok: true }> {
  store.deleteGradeBand(input.id);
  return { ok: true };
}

// Rejects a duplicate type name, case-insensitive (mirrors DB unique(school_id, name)).
export async function createAssessmentType(input: AssessmentTypeCreateInput): Promise<{ id: string }> {
  const data = assessmentTypeCreateSchema.parse(input);
  if (store.assessmentTypeNameExists(data.name)) {
    throw new Error("An assessment type with this name already exists.");
  }
  const id = crypto.randomUUID();
  store.addAssessmentType({ id, ...data });
  return { id };
}

export async function updateAssessmentType(input: AssessmentTypeUpdateInput): Promise<{ id: string }> {
  const { id, ...rest } = assessmentTypeUpdateSchema.parse(input);
  if (store.assessmentTypeNameExists(rest.name, id)) {
    throw new Error("An assessment type with this name already exists.");
  }
  store.updateAssessmentType(id, rest);
  return { id };
}

// Guarded: blocked when any assessment references the type (mirrors DB `on delete restrict`).
export async function deleteAssessmentType(input: { id: string }): Promise<{ ok: true }> {
  if (store.assessmentTypeInUse(input.id)) {
    throw new Error("This type is used by existing assessments and can't be deleted.");
  }
  store.deleteAssessmentType(input.id);
  return { ok: true };
}
