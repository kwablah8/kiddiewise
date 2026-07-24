import type { SubjectVM } from "@/lib/validators/academics";

export interface SubjectStats {
  total: number;
  assigned: number; // taught in ≥1 class
  unassigned: number; // not yet on any class
  classAssignments: number; // Σ class_count — total subject-class placements
}

/** Overview counts for the Subjects page, derived from the subject list (no stored status). */
export function subjectStats(subjects: SubjectVM[]): SubjectStats {
  let assigned = 0;
  let classAssignments = 0;
  for (const s of subjects) {
    if (s.class_count > 0) assigned += 1;
    classAssignments += s.class_count;
  }
  return {
    total: subjects.length,
    assigned,
    unassigned: subjects.length - assigned,
    classAssignments,
  };
}
