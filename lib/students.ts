import type { ExportColumn } from "@/lib/export";
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

/** The roster as printed and as exported. */
export const studentColumns: ExportColumn<StudentListItemVM>[] = [
  { header: "Admission No.", width: 14, pdf: (s) => s.admission_no },
  { header: "Name", width: 22, pdf: (s) => `${s.first_name} ${s.last_name}` },
  { header: "Class", width: 16, pdf: (s) => s.class_name ?? "—", csv: (s) => s.class_name ?? "" },
  { header: "Gender", width: 10, pdf: (s) => formatRole(s.gender) },
  { header: "Status", width: 14, pdf: (s) => formatRole(s.enrollment_status) },
  {
    header: "Guardian(s)",
    width: 24,
    pdf: (s) => (s.guardian_names.length > 0 ? s.guardian_names.join(", ") : "—"),
    csv: (s) => s.guardian_names.join(", "),
  },
];
