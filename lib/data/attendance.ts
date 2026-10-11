import { activeYearId, db, readAllPaged, unwrapList } from "./_client";
import { buildRegisterSummary, buildRoster } from "@/lib/attendance";
import type { AttendanceRosterVM, RegisterSummaryRowVM } from "@/lib/validators/attendance";

/**
 * The register for one class on one date: every enrolled student, each carrying that day's status or
 * null when unmarked, and the time they scanned in at the gate if they did.
 *
 * The two reads are independent, so they run concurrently. Filtering attendance by class and date
 * (not date alone) matters because a student who changed class mid-term could otherwise pick up a
 * status recorded against their old class.
 *
 * The roster is the active year's enrollments: a register is always taken "now", and last year's
 * placements (which promotion leaves untouched) must not surface students who have moved up.
 */
export async function getRoster(classId: string, date: string): Promise<AttendanceRosterVM> {
  const yearId = await activeYearId();
  let rosterQuery = db()
    .from("enrollments")
    .select("students!inner(id, first_name, last_name, admission_no)")
    .eq("class_id", classId)
    .eq("status", "active");
  if (yearId) rosterQuery = rosterQuery.eq("academic_year_id", yearId);

  const [studentsRes, existingRes, arrivalsRes] = await Promise.all([
    rosterQuery,
    db()
      .from("attendance")
      .select("student_id, status")
      .eq("class_id", classId)
      .eq("date", date),
    // Gate scan-in times. Teachers can't read the scan log itself; this returns only their own
    // class's arrivals (migration 0045).
    db().rpc("class_gate_arrivals", { p_class_id: classId, p_date: date }),
  ]);

  const enrolled = unwrapList(studentsRes, "class roster");
  const existing = unwrapList(existingRes, "attendance for date");
  const arrivals = unwrapList(arrivalsRes, "gate arrivals");

  const students = enrolled
    .map((e) => e.students)
    .filter((s): s is NonNullable<typeof s> => s !== null);

  return { class_id: classId, date, entries: buildRoster(students, existing, arrivals) };
}

/**
 * Every student on a class's roll, tallied over one term's register. Marks are read for this class
 * and term, so a mark recorded against a student's old class (they moved mid-term) is left out, the
 * same rule the daily roster follows. Paged: a term's marks for a class run well past 1000 rows.
 */
export async function getRegisterSummary(classId: string, termId: string): Promise<RegisterSummaryRowVM[]> {
  const yearId = await activeYearId();
  let rosterQuery = db()
    .from("enrollments")
    .select("students!inner(id, first_name, last_name, admission_no)")
    .eq("class_id", classId)
    .eq("status", "active");
  if (yearId) rosterQuery = rosterQuery.eq("academic_year_id", yearId);

  const [studentsRes, records] = await Promise.all([
    rosterQuery,
    readAllPaged(
      (from, to) =>
        db()
          .from("attendance")
          .select("student_id, status")
          .eq("class_id", classId)
          .eq("term_id", termId)
          .order("date")
          .order("student_id")
          .range(from, to),
      "register marks",
    ),
  ]);

  const students = unwrapList(studentsRes, "class roster")
    .map((e) => e.students)
    .filter((s): s is NonNullable<typeof s> => s !== null);
  return buildRegisterSummary(students, records);
}
