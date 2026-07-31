import { db, unwrapList, unwrapMaybe } from "./_client";
import { aggregateSubjectResults } from "@/lib/results";
import { reportTotals, assignPositions, overallGrade, attendanceTotals } from "@/lib/terminal-reports";
import type { GradeBandVM } from "@/lib/validators/grading";
import type {
  TerminalReportRowVM,
  TerminalReportSheetVM,
} from "@/lib/validators/reports";

/**
 * The terminal-report sheet for one class and term.
 *
 * Driven by the ENROLMENT, like the register and the mark sheet: every actively-enrolled student
 * appears, whether or not a report has been generated for them. A sheet that only listed generated
 * rows would hide exactly the students an admin needs to notice — the ones still missing a report.
 *
 * Where a report EXISTS, its stored figures are shown, because a report is a snapshot and the admin
 * must see what was actually recorded. Where it does not, the figures are computed live so the admin
 * can see what generating would produce before committing to it.
 */
export async function getReportSheet(
  classId: string,
  termId: string,
): Promise<TerminalReportSheetVM | null> {
  // The term resolves first because the roster is scoped to the year that term belongs to — NOT
  // the active year — so last term's sheet keeps showing that year's cohort after a rollover.
  const term = unwrapMaybe<{ id: string; name: string; academic_year_id: string }>(
    await db().from("terms").select("id, name, academic_year_id").eq("id", termId).maybeSingle(),
    "term",
  );
  if (!term) return null;

  const [classRes, bandsRes, enrolledRes, reportsRes] = await Promise.all([
    db().from("classes").select("id, name").eq("id", classId).maybeSingle(),
    db().from("grade_bands").select("id, min_score, max_score, grade, remark"),
    db()
      .from("enrollments")
      .select("students!inner(id, first_name, last_name, admission_no)")
      .eq("class_id", classId)
      .eq("status", "active")
      .eq("academic_year_id", term.academic_year_id),
    db()
      .from("terminal_reports")
      .select(
        "id, student_id, total_score, average_score, position, attendance_present, attendance_total, class_teacher_comment, head_teacher_comment, is_published, generated_at",
      )
      .eq("class_id", classId)
      .eq("term_id", termId),
  ]);

  const klass = unwrapMaybe<{ id: string; name: string }>(classRes, "class");
  if (!klass) return null;

  const bands: GradeBandVM[] = unwrapList(bandsRes, "grade bands").map((b) => ({
    ...b,
    min_score: Number(b.min_score),
    max_score: Number(b.max_score),
  }));

  const students = unwrapList(enrolledRes, "class roster")
    .map((e) => e.students)
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const reports = unwrapList(reportsRes, "terminal reports");
  const reportByStudent = new Map(reports.map((r) => [r.student_id, r]));

  if (students.length === 0) {
    return {
      class_id: klass.id,
      class_name: klass.name,
      term_id: term.id,
      term_name: term.name,
      rows: [],
      published_count: 0,
      generated_count: 0,
    };
  }

  const studentIds = students.map((s) => s.id);

  // Live figures for students with no report yet. Fetched for everyone in one go rather than per
  // student — a class of 40 would otherwise be 80 round trips.
  const [resultsRes, attendanceRes] = await Promise.all([
    db()
      .from("results")
      .select("student_id, score, teacher_comment, created_at, assessments!inner(max_score, term_id, subjects(name))")
      .eq("is_submitted", true)
      .in("student_id", studentIds),
    db()
      .from("attendance")
      .select("student_id, status")
      .eq("term_id", termId)
      .in("student_id", studentIds),
  ]);

  const allResults = unwrapList(resultsRes, "results");
  const allAttendance = unwrapList(attendanceRes, "attendance");

  // Rows built first WITHOUT positions, because a position only means something once every student's
  // average is known.
  const draft = students.map((s) => {
    const stored = reportByStudent.get(s.id);

    const subjects = aggregateSubjectResults(
      allResults
        .filter((r) => r.student_id === s.id && r.assessments?.term_id === termId)
        .map((r) => ({
          subject: r.assessments?.subjects?.name ?? null,
          score: Number(r.score),
          max_score: Number(r.assessments?.max_score ?? 0),
          teacher_comment: r.teacher_comment,
          recorded_at: r.created_at,
        })),
      bands,
    );
    const live = reportTotals(subjects);
    const attendance = attendanceTotals(allAttendance.filter((a) => a.student_id === s.id));

    return {
      id: stored?.id ?? null,
      student_id: s.id,
      student_name: `${s.first_name} ${s.last_name}`,
      admission_no: s.admission_no,
      subject_count: live.subject_count,
      // Stored figures win where a report exists — that is the snapshot the school committed to.
      total_score: stored ? numberOrNull(stored.total_score) : live.total_score,
      average_score: stored ? numberOrNull(stored.average_score) : live.average_score,
      attendance_present: stored ? stored.attendance_present : attendance.present,
      attendance_total: stored ? stored.attendance_total : attendance.total,
      class_teacher_comment: stored?.class_teacher_comment ?? null,
      head_teacher_comment: stored?.head_teacher_comment ?? null,
      is_published: stored?.is_published ?? false,
      generated_at: stored?.generated_at ?? null,
      storedPosition: stored?.position ?? null,
    };
  });

  // Positions are recomputed live for ungenerated rows so the preview is coherent, but a generated
  // report keeps the position it was given — otherwise a published rank would drift as marks change.
  const positioned = assignPositions(draft);

  const rows: TerminalReportRowVM[] = positioned
    .map(({ storedPosition, position, ...rest }) => ({
      ...rest,
      position: rest.id ? storedPosition : position,
      overall_grade: overallGrade(rest.average_score, bands)?.grade ?? null,
    }))
    .sort((a, b) => a.student_name.localeCompare(b.student_name));

  return {
    class_id: klass.id,
    class_name: klass.name,
    term_id: term.id,
    term_name: term.name,
    rows,
    published_count: rows.filter((r) => r.is_published).length,
    generated_count: rows.filter((r) => r.id !== null).length,
  };
}

/** numeric arrives as a string over the wire; a null stays null. */
function numberOrNull(v: number | string | null): number | null {
  return v === null ? null : Number(v);
}
