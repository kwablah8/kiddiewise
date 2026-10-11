import type { ExportColumn } from "@/lib/export";
import type { AttendanceStatus, RegisterSummaryRowVM, RosterEntryVM } from "@/lib/validators/attendance";

export interface RosterStudent {
  id: string;
  first_name: string;
  last_name: string;
  admission_no: string;
}

/** Merge a class's students with that date's existing records → each entry carries its status or null,
 *  and its gate scan-in time or null, ordered by full name. */
export function buildRoster(
  students: RosterStudent[],
  existingForDate: { student_id: string; status: AttendanceStatus }[],
  arrivals: { student_id: string; arrived_at: string }[] = [],
): RosterEntryVM[] {
  const byStudent = new Map(existingForDate.map((r) => [r.student_id, r.status]));
  const scannedAt = new Map(arrivals.map((a) => [a.student_id, a.arrived_at]));
  return students
    .map((s) => ({
      student_id: s.id,
      first_name: s.first_name,
      last_name: s.last_name,
      admission_no: s.admission_no,
      status: byStudent.get(s.id) ?? null,
      scanned_at: scannedAt.get(s.id) ?? null,
    }))
    .sort((a, b) =>
      `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`),
    );
}

/** Tally each student's marks over a term, ordered by name. A student with no marks still appears. */
export function buildRegisterSummary(
  students: RosterStudent[],
  records: { student_id: string; status: AttendanceStatus }[],
): RegisterSummaryRowVM[] {
  const tally = new Map<string, { present: number; late: number; absent: number }>();
  for (const r of records) {
    const t = tally.get(r.student_id) ?? { present: 0, late: 0, absent: 0 };
    t[r.status] += 1;
    tally.set(r.student_id, t);
  }
  return students
    .map((s): RegisterSummaryRowVM => {
      const t = tally.get(s.id) ?? { present: 0, late: 0, absent: 0 };
      const marked = t.present + t.late + t.absent;
      return {
        student_id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        admission_no: s.admission_no,
        ...t,
        marked,
        pct: marked === 0 ? null : Math.round(((t.present + t.late) / marked) * 100),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const registerSummaryColumns: ExportColumn<RegisterSummaryRowVM>[] = [
  { header: "Admission No.", width: 1.4, pdf: (r) => r.admission_no },
  { header: "Student", width: 2.6, pdf: (r) => r.name },
  { header: "Present", width: 1, align: "right", pdf: (r) => String(r.present) },
  { header: "Late", width: 1, align: "right", pdf: (r) => String(r.late) },
  { header: "Absent", width: 1, align: "right", pdf: (r) => String(r.absent) },
  { header: "Days marked", width: 1.3, align: "right", pdf: (r) => String(r.marked) },
  {
    header: "Attendance",
    width: 1.3,
    align: "right",
    pdf: (r) => (r.pct === null ? "—" : `${r.pct}%`),
    csv: (r) => (r.pct === null ? "" : String(r.pct)),
  },
];

/** The class's overall rate across every marked day, for the report's header line. */
export function registerSummaryDetails(labels: string[], rows: RegisterSummaryRowVM[]): string[] {
  const marked = rows.reduce((sum, r) => sum + r.marked, 0);
  const attended = rows.reduce((sum, r) => sum + r.present + r.late, 0);
  return [
    ...labels,
    `${rows.length} student${rows.length === 1 ? "" : "s"}`,
    ...(marked === 0 ? [] : [`Class attendance ${Math.round((attended / marked) * 100)}%`]),
  ];
}
