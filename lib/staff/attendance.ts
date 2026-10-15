import type { ExportColumn } from "@/lib/export";
import { STAFF_ROLE_LABEL } from "@/lib/staff/roles";
import type { StaffAttendanceRowVM } from "@/lib/validators/attendance";
import type { StaffVM } from "@/lib/validators/academics";

/**
 * Staff have no register to mark, only the gate scans, so their attendance is derived from those.
 *
 * A school day is any day in the period on which at least one staff member scanned in: weekends,
 * holidays and a day the device was off never count against anyone. A linked staff member who did
 * not scan on a school day is absent that day; one scan, arrival or departure, makes them present.
 * Days before someone's hire date are not counted. Staff with no device number cannot be measured,
 * so they are listed with no figures rather than a misleading 0%.
 */
export function buildStaffAttendance(
  staff: StaffVM[],
  linkedStaffIds: ReadonlySet<string>,
  presence: readonly { date: string; staff_id: string }[],
): StaffAttendanceRowVM[] {
  const schoolDays = [...new Set(presence.map((p) => p.date))];
  const scanned = new Map<string, Set<string>>();
  for (const p of presence) {
    const days = scanned.get(p.staff_id) ?? new Set<string>();
    days.add(p.date);
    scanned.set(p.staff_id, days);
  }

  return staff
    .filter((s) => s.is_active)
    .map((s): StaffAttendanceRowVM => {
      const base = { staff_id: s.id, staff_no: s.staff_no, name: `${s.first_name} ${s.last_name}`, role: s.role };
      if (!linkedStaffIds.has(s.id)) {
        return { ...base, tracked: false, present: 0, absent: 0, marked: 0, pct: null };
      }
      const days = schoolDays.filter((d) => !s.hire_date || d >= s.hire_date);
      const mine = scanned.get(s.id) ?? new Set<string>();
      const present = days.filter((d) => mine.has(d)).length;
      const marked = days.length;
      return {
        ...base,
        tracked: true,
        present,
        absent: marked - present,
        marked,
        pct: marked === 0 ? null : Math.round((present / marked) * 100),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

const count = (r: StaffAttendanceRowVM, n: number) => (r.tracked ? String(n) : "—");
const countCsv = (r: StaffAttendanceRowVM, n: number) => (r.tracked ? String(n) : "");

export const staffAttendanceColumns: ExportColumn<StaffAttendanceRowVM>[] = [
  { header: "Staff No.", width: 1.2, pdf: (r) => r.staff_no },
  { header: "Name", width: 2.6, pdf: (r) => r.name },
  { header: "Role", width: 1.5, pdf: (r) => STAFF_ROLE_LABEL[r.role] },
  { header: "Present", width: 1, align: "right", pdf: (r) => count(r, r.present), csv: (r) => countCsv(r, r.present) },
  { header: "Absent", width: 1, align: "right", pdf: (r) => count(r, r.absent), csv: (r) => countCsv(r, r.absent) },
  { header: "Days recorded", width: 1.4, align: "right", pdf: (r) => count(r, r.marked), csv: (r) => countCsv(r, r.marked) },
  {
    header: "Attendance",
    width: 1.6,
    align: "right",
    pdf: (r) => (!r.tracked ? "No device number" : r.pct === null ? "—" : `${r.pct}%`),
    csv: (r) => (r.pct === null ? "" : String(r.pct)),
  },
];

/** The overall rate across everyone measured, for the report's header line. */
export function staffAttendanceDetails(labels: string[], rows: StaffAttendanceRowVM[]): string[] {
  const tracked = rows.filter((r) => r.tracked);
  const marked = tracked.reduce((sum, r) => sum + r.marked, 0);
  const present = tracked.reduce((sum, r) => sum + r.present, 0);
  const unlinked = rows.length - tracked.length;
  return [
    ...labels,
    `${rows.length} staff`,
    ...(unlinked > 0 ? [`${unlinked} with no device number`] : []),
    ...(marked === 0 ? [] : [`Staff attendance ${Math.round((present / marked) * 100)}%`]),
  ];
}
