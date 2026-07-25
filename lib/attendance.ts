import type { AttendanceStatus, RosterEntryVM } from "@/lib/validators/attendance";

export interface RosterStudent {
  id: string;
  first_name: string;
  last_name: string;
  admission_no: string;
}

/** Merge a class's students with that date's existing records → each entry carries its status or null,
 *  ordered by full name. */
export function buildRoster(
  students: RosterStudent[],
  existingForDate: { student_id: string; status: AttendanceStatus }[],
): RosterEntryVM[] {
  const byStudent = new Map(existingForDate.map((r) => [r.student_id, r.status]));
  return students
    .map((s) => ({
      student_id: s.id,
      first_name: s.first_name,
      last_name: s.last_name,
      admission_no: s.admission_no,
      status: byStudent.get(s.id) ?? null,
    }))
    .sort((a, b) =>
      `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`),
    );
}
