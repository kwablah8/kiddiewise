import { db, unwrapList } from "./_client";
import type { PromotionCandidateVM } from "@/lib/validators/promotion";

/**
 * The end-of-year review list for one class.
 *
 * Four reads rather than one join, deliberately. The three decision figures come from three
 * unrelated parts of the schema — published reports, attendance marks, and the fee-position view —
 * and each is already the canonical derivation used elsewhere in the app (golden rule 9). Forcing
 * them into a single PostgREST query would mean either a new database view duplicating logic that
 * already exists in three places, or embedded joins that silently drop students with no marks and
 * no attendance, which are exactly the students an admin needs to see before promoting anybody.
 *
 * Every read is scoped by RLS to the caller's school, and by the arguments to one class and year.
 * A class holds tens of students, so this is four small queries, not a fan-out.
 */
export async function listPromotionCandidates(
  classId: string,
  academicYearId: string,
): Promise<PromotionCandidateVM[]> {
  // 1. Who is actually in the class this year. `active` only: a student already withdrawn or
  //    transferred should not be offered a place in next year's class.
  const enrolled = unwrapList(
    await db()
      .from("enrollments")
      .select("student_id, students(first_name, last_name, admission_no)")
      .eq("class_id", classId)
      .eq("academic_year_id", academicYearId)
      .eq("status", "active"),
    "promotion candidates",
  );

  if (enrolled.length === 0) return [];
  const studentIds = enrolled.map((e) => e.student_id);

  const [reports, attendance, positions] = await Promise.all([
    // 2. Published reports only — an unpublished report is the class teacher's draft, and deciding
    //    a child's year on a draft is exactly the mistake this filter prevents.
    db()
      .from("terminal_reports")
      .select("student_id, average_score")
      .in("student_id", studentIds)
      .eq("academic_year_id", academicYearId)
      .eq("is_published", true),
    // 3. Attendance hangs off the TERM, not the year, so the year is reached through the term.
    db()
      .from("attendance")
      .select("student_id, status, terms!inner(academic_year_id)")
      .in("student_id", studentIds)
      .eq("terms.academic_year_id", academicYearId),
    // 4. The same view the Fees screens read, so a balance here can never disagree with a balance
    //    there.
    db()
      .from("student_fee_positions")
      .select("student_id, balance")
      .in("student_id", studentIds)
      .eq("academic_year_id", academicYearId),
  ]);

  const reportRows = unwrapList(reports, "promotion reports");
  const attendanceRows = unwrapList(attendance, "promotion attendance");
  const positionRows = unwrapList(positions, "promotion fee positions");

  const averages = new Map<string, number[]>();
  for (const r of reportRows) {
    if (r.average_score === null) continue;
    const list = averages.get(r.student_id) ?? [];
    list.push(Number(r.average_score));
    averages.set(r.student_id, list);
  }

  const present = new Map<string, number>();
  const marked = new Map<string, number>();
  for (const a of attendanceRows) {
    marked.set(a.student_id, (marked.get(a.student_id) ?? 0) + 1);
    // 'late' counts as present: the child was in school. Treating lateness as absence would
    // understate attendance on a report an admin is using to hold a child back.
    if (a.status !== "absent") present.set(a.student_id, (present.get(a.student_id) ?? 0) + 1);
  }

  const owed = new Map<string, number>();
  for (const p of positionRows) {
    if (p.student_id === null) continue;
    owed.set(p.student_id, (owed.get(p.student_id) ?? 0) + Number(p.balance ?? 0));
  }

  return enrolled
    .map((e): PromotionCandidateVM => {
      const marks = averages.get(e.student_id) ?? [];
      const totalMarked = marked.get(e.student_id) ?? 0;
      return {
        student_id: e.student_id,
        student_name: e.students
          ? `${e.students.first_name} ${e.students.last_name}`
          : "Unknown student",
        admission_no: e.students?.admission_no ?? "—",
        // Null, not zero, when nothing is published. Zero would read as "this child scored nothing".
        year_average:
          marks.length === 0 ? null : Math.round(marks.reduce((a, b) => a + b, 0) / marks.length),
        attendance_rate:
          totalMarked === 0
            ? null
            : Math.round(((present.get(e.student_id) ?? 0) / totalMarked) * 100),
        outstanding: owed.get(e.student_id) ?? 0,
      };
    })
    .sort((a, b) => a.student_name.localeCompare(b.student_name));
}
