import { db, unwrapList } from "./_client";
import type { GradeBandVM, AssessmentTypeVM } from "@/lib/validators/grading";

// numeric columns arrive as strings over the wire (numeric is arbitrary-precision, so the driver
// won't silently narrow it to a float). Both VMs contract numbers, so convert at the boundary.

/** The school's grading scale, highest band first — how a grading scale reads. */
export async function listGradeBands(): Promise<GradeBandVM[]> {
  const rows = unwrapList(
    await db()
      .from("grade_bands")
      .select("id, min_score, max_score, grade, remark")
      .order("min_score", { ascending: false }),
    "grade bands",
  );
  return rows.map((b) => ({
    ...b,
    min_score: Number(b.min_score),
    max_score: Number(b.max_score),
  }));
}

export async function listAssessmentTypes(): Promise<AssessmentTypeVM[]> {
  const rows = unwrapList(
    await db()
      .from("assessment_types")
      .select("id, name, weight")
      .order("weight", { ascending: false }),
    "assessment types",
  );
  return rows.map((t) => ({ ...t, weight: Number(t.weight) }));
}
