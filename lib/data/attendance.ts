import { db, unwrapList } from "./_client";
import { buildRoster } from "@/lib/attendance";
import type { AttendanceRosterVM } from "@/lib/validators/attendance";

/**
 * The register for one class on one date: every enrolled student, each carrying that day's status or
 * null when unmarked.
 *
 * The two reads are independent, so they run concurrently. Filtering attendance by class AND date
 * (not date alone) matters because a student who changed class mid-term could otherwise pick up a
 * status recorded against their old class.
 */
export async function getRoster(classId: string, date: string): Promise<AttendanceRosterVM> {
  const [studentsRes, existingRes] = await Promise.all([
    db()
      .from("enrollments")
      .select("students!inner(id, first_name, last_name, admission_no)")
      .eq("class_id", classId)
      .eq("status", "active"),
    db()
      .from("attendance")
      .select("student_id, status")
      .eq("class_id", classId)
      .eq("date", date),
  ]);

  const enrolled = unwrapList(studentsRes, "class roster");
  const existing = unwrapList(existingRes, "attendance for date");

  const students = enrolled
    .map((e) => e.students)
    .filter((s): s is NonNullable<typeof s> => s !== null);

  return { class_id: classId, date, entries: buildRoster(students, existing) };
}
