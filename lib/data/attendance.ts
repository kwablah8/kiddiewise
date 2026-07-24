import { simulate } from "./_devState";
import { store } from "@/lib/mock/store";
import { buildRoster } from "@/lib/attendance";
import type { AttendanceRosterVM } from "@/lib/validators/attendance";

export function getRoster(classId: string, date: string): Promise<AttendanceRosterVM> {
  const students = store.students
    .filter((s) => s.class_id === classId)
    .map((s) => ({
      id: s.id,
      first_name: s.first_name,
      last_name: s.last_name,
      admission_no: s.admission_no,
    }));
  // Match by date; buildRoster keys on student_id, so records for other classes are ignored.
  const existing = store.attendance
    .filter((r) => r.date === date)
    .map((r) => ({ student_id: r.student_id, status: r.status }));
  const entries = buildRoster(students, existing);
  return simulate({ class_id: classId, date, entries }, { class_id: classId, date, entries: [] });
}
