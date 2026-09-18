import { toCsv } from "@/lib/csv";
import { formatRole } from "@/lib/format";
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

const STUDENT_CSV_HEADERS = ["Admission No.", "Name", "Class", "Gender", "Status", "Guardian(s)"];

// Same columns as the roster PDF (lib/pdf/students-roster.ts), pure so it's unit-tested the same way.
export function studentsToCsv(students: StudentListItemVM[]): string {
  const rows = students.map((s) => [
    s.admission_no,
    `${s.first_name} ${s.last_name}`,
    s.class_name ?? "",
    formatRole(s.gender),
    formatRole(s.enrollment_status),
    s.guardian_names.join(", "),
  ]);
  return toCsv(STUDENT_CSV_HEADERS, rows);
}
