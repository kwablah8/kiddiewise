import { store } from "@/lib/mock/store";
import { assessmentCreateSchema, type AssessmentCreateInput } from "@/lib/validators/assessments";

// SEAM: becomes a Server Action. The real version sets school_id/created_by and RLS enforces that the
// teacher owns the class_subject; signature + validation stay identical, only the body swaps.
export async function createAssessment(input: AssessmentCreateInput): Promise<{ id: string }> {
  const data = assessmentCreateSchema.parse(input);
  const id = crypto.randomUUID();
  store.addAssessment({ id, ...data, is_submitted: false });
  return { id };
}
