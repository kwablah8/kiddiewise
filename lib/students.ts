import type { StudentListItemVM, StudentStatsVM } from "@/lib/validators/people";

// Derives the Students page stat cards from the full roster. Pure, unit-tested.
export function computeStudentStats(students: StudentListItemVM[]): StudentStatsVM {
  return {
    total: students.length,
    active: students.filter((s) => s.enrollment_status === "active").length,
    assigned: students.filter((s) => s.class_id !== null).length,
    male: students.filter((s) => s.gender === "male").length,
    female: students.filter((s) => s.gender === "female").length,
  };
}
