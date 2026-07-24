import { simulate } from "./_devState";
import { store } from "@/lib/mock/store";
import type { GradeBandVM, AssessmentTypeVM } from "@/lib/validators/grading";

// Bands returned high→low (A at top) — how a grading scale reads. Copy-on-read (sibling convention).
export function listGradeBands(): Promise<GradeBandVM[]> {
  const result = store.gradeBands
    .map((b) => ({ ...b }))
    .sort((a, b) => b.min_score - a.min_score);
  return simulate(result, []);
}

export function listAssessmentTypes(): Promise<AssessmentTypeVM[]> {
  return simulate(
    store.assessmentTypes.map((t) => ({ ...t })),
    [],
  );
}
