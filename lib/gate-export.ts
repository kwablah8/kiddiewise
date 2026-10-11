import type { ExportColumn } from "@/lib/export";
import { formatClockTime, formatDate } from "@/lib/format";
import { localParts } from "@/lib/gate";
import type { PersonKind, PresenceDayVM } from "@/lib/validators/gate";

export interface CheckinExportRow {
  date: string;
  name: string;
  /** A student's class, or a staff member's role. */
  detail: string | null;
  arrived_at: string | null;
  left_at: string | null;
  late: boolean;
}

function status(r: CheckinExportRow): string {
  if (r.arrived_at) return r.late ? "Late" : "On time";
  return "No arrival scan";
}

export function checkinColumns(kind: PersonKind, timeZone: string): ExportColumn<CheckinExportRow>[] {
  // Spreadsheet times are 24-hour "07:42" so they sort and subtract; paper reads "7:42 AM".
  const clock = (iso: string | null) => (iso ? formatClockTime(iso, timeZone) : "—");
  const clock24 = (iso: string | null) => (iso ? localParts(new Date(iso), timeZone).time.slice(0, 5) : "");
  return [
    { header: "Date", width: 1.3, pdf: (r) => formatDate(r.date), csv: (r) => r.date },
    { header: "Name", width: 2.6, pdf: (r) => r.name },
    { header: kind === "student" ? "Class" : "Role", width: 1.6, pdf: (r) => r.detail ?? "—", csv: (r) => r.detail ?? "" },
    { header: "Arrived", width: 1.1, pdf: (r) => clock(r.arrived_at), csv: (r) => clock24(r.arrived_at) },
    { header: "Left", width: 1.1, pdf: (r) => clock(r.left_at), csv: (r) => clock24(r.left_at) },
    { header: "Status", width: 1.5, pdf: status },
  ];
}

/**
 * The scans in a date range for one kind of person, oldest day first and by name within a day.
 * `classOf` maps a student's id to their class so a single class can be picked out; staff are never
 * narrowed by class. Only people who scanned appear: this lists attendance, not absence.
 */
export function buildCheckinRows(
  presence: PresenceDayVM[],
  kind: PersonKind,
  classId: string | null,
  classOf: Map<string, string | null>,
): CheckinExportRow[] {
  return presence
    .flatMap((p): CheckinExportRow[] => {
      if (p.person?.kind !== kind) return [];
      if (kind === "student" && classId && classOf.get(p.person.id) !== classId) return [];
      return [
        {
          date: p.date,
          name: p.person.name,
          detail: p.person.detail,
          arrived_at: p.arrived_at,
          left_at: p.left_at,
          late: p.late,
        },
      ];
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}

export function checkinDetails(labels: string[], rows: CheckinExportRow[]): string[] {
  const arrivals = rows.filter((r) => r.arrived_at);
  const late = arrivals.filter((r) => r.late).length;
  return [...labels, `${rows.length} check-in${rows.length === 1 ? "" : "s"}`, `${late} late`];
}
