import type { ExportColumn } from "@/lib/export";
import type { StaffVM } from "@/lib/validators/academics";

const dash = (value: string | null) => value ?? "—";

/** The staff list as the page shows it, with a phone number added for the office. */
export const staffColumns: ExportColumn<StaffVM>[] = [
  { header: "Staff No.", width: 1.1, pdf: (s) => s.staff_no },
  { header: "Name", width: 2.2, pdf: (s) => `${s.first_name} ${s.last_name}` },
  { header: "Role", width: 1.3, pdf: (s) => (s.role === "teacher" ? "Teacher" : "Administrator") },
  { header: "Position", width: 1.6, pdf: (s) => dash(s.position), csv: (s) => s.position ?? "" },
  { header: "Department", width: 1.5, pdf: (s) => dash(s.department), csv: (s) => s.department ?? "" },
  { header: "Email", width: 2.6, pdf: (s) => s.email },
  { header: "Phone", width: 1.4, pdf: (s) => dash(s.phone), csv: (s) => s.phone ?? "" },
  { header: "Classes", width: 0.9, align: "right", pdf: (s) => String(s.class_count) },
  { header: "Subjects", width: 0.9, align: "right", pdf: (s) => String(s.subject_count) },
  { header: "Employment", width: 1.2, pdf: (s) => (s.is_active ? "Active" : "Inactive") },
];

export function staffDetails(staff: StaffVM[]): string[] {
  const active = staff.filter((s) => s.is_active).length;
  return [`${staff.length} staff`, `${active} active`];
}
