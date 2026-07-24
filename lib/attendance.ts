import type { AttendanceStatus, RosterEntryVM } from "@/lib/validators/attendance";
import type { AttendanceRecord } from "@/lib/mock/attendance-records";

export interface RosterStudent {
  id: string;
  first_name: string;
  last_name: string;
  admission_no: string;
}

export interface UpsertMeta {
  class_id: string;
  date: string;
  term_id: string;
  marked_by: string | null;
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

/** Pure upsert by (student_id, date). Returns a NEW array; never mutates `existing`. */
export function applyAttendanceUpsert(
  existing: AttendanceRecord[],
  entries: { student_id: string; status: AttendanceStatus }[],
  meta: UpsertMeta,
): AttendanceRecord[] {
  const next = existing.map((r) => ({ ...r }));
  for (const e of entries) {
    const idx = next.findIndex((r) => r.student_id === e.student_id && r.date === meta.date);
    if (idx >= 0) {
      next[idx] = {
        ...next[idx],
        status: e.status,
        class_id: meta.class_id,
        term_id: meta.term_id,
        marked_by: meta.marked_by,
      };
    } else {
      next.push({
        student_id: e.student_id,
        class_id: meta.class_id,
        term_id: meta.term_id,
        date: meta.date,
        status: e.status,
        marked_by: meta.marked_by,
      });
    }
  }
  return next;
}
