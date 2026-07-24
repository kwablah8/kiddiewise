import type { ChildSummaryVM } from "@/lib/validators/parent";

// Minimal structural shape the scope logic needs — satisfied by the mock store's student records and,
// post-Supabase, by a students-join-guardians row. Keeping it structural keeps this helper pure/testable.
export interface StudentForScope {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  class_name: string | null;
  guardians: readonly { parent_profile_id: string }[];
}

/** True iff `childId` is a student this parent guards. The RLS stand-in — every child-scoped read
 *  must gate on this so a parent can never reach a child they aren't linked to. */
export function isGuardianOf(
  parentId: string,
  childId: string,
  students: readonly StudentForScope[],
): boolean {
  const child = students.find((s) => s.id === childId);
  return !!child && child.guardians.some((g) => g.parent_profile_id === parentId);
}

/** This parent's children, as dashboard summaries. attendance_pct/latest_result are null in Slice 1
 *  (populated once attendance/results land in Slices 2–3). */
export function childrenOf(
  parentId: string,
  students: readonly StudentForScope[],
): ChildSummaryVM[] {
  return students
    .filter((s) => s.guardians.some((g) => g.parent_profile_id === parentId))
    .map((s) => ({
      id: s.id,
      first_name: s.first_name,
      last_name: s.last_name,
      photo_url: s.photo_url,
      class_name: s.class_name,
      attendance_pct: null,
      latest_result: null,
    }));
}
