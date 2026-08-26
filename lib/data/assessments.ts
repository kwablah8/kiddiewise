import { db, unwrapList, unwrapMaybe } from "./_client";
import { scoreToGrade } from "@/lib/grading";
import { buildScoreSheet } from "@/lib/results";
import type {
  ScoreSheetVM,
  AssessmentListItemVM,
  AssessmentDetailVM,
  AssessmentResultVM,
  AssessmentFilters,
} from "@/lib/validators/assessments";
import type { GradeBandVM } from "@/lib/validators/grading";

const SELECT = `
  id, title, class_id, subject_id, term_id, assessment_type_id, max_score, date,
  classes(name), subjects(name), terms(name, academic_year_id), assessment_types(name),
  results(is_submitted)
`;

interface AssessmentRow {
  id: string;
  title: string;
  class_id: string;
  subject_id: string;
  term_id: string;
  assessment_type_id: string;
  max_score: number;
  date: string | null;
  classes: { name: string } | null;
  subjects: { name: string } | null;
  terms: { name: string; academic_year_id: string } | null;
  assessment_types: { name: string } | null;
  results: { is_submitted: boolean }[];
}

/**
 * `is_submitted` is a property of each RESULT, not of the assessment, the DB has no column for it.
 * An assessment counts as submitted once it has results and every one of them is submitted, which is
 * what "the teacher has finished entering and released these marks" actually means. Deriving it means
 * it can never disagree with the underlying rows.
 */
function toListItemVM(a: AssessmentRow): AssessmentListItemVM {
  return {
    id: a.id,
    title: a.title,
    class_id: a.class_id,
    class_name: a.classes?.name ?? "",
    subject_id: a.subject_id,
    subject_name: a.subjects?.name ?? "",
    term_id: a.term_id,
    term_name: a.terms?.name ?? "",
    assessment_type_id: a.assessment_type_id,
    type_name: a.assessment_types?.name ?? "",
    max_score: Number(a.max_score),
    date: a.date,
    result_count: a.results.length,
    is_submitted: a.results.length > 0 && a.results.every((r) => r.is_submitted),
  };
}

export async function listAssessments(
  filters: AssessmentFilters = {},
): Promise<AssessmentListItemVM[]> {
  let q = db().from("assessments").select(SELECT).order("date", { ascending: false });
  if (filters.term_id) q = q.eq("term_id", filters.term_id);
  if (filters.class_id) q = q.eq("class_id", filters.class_id);
  if (filters.subject_id) q = q.eq("subject_id", filters.subject_id);

  return unwrapList(await q, "assessments").map(toListItemVM);
}

export async function getAssessment(id: string): Promise<AssessmentDetailVM | null> {
  const [assessmentRes, resultsRes, bandsRes] = await Promise.all([
    db().from("assessments").select(SELECT).eq("id", id).single(),
    db()
      .from("results")
      .select("student_id, score, students(first_name, last_name, admission_no)")
      .eq("assessment_id", id),
    db().from("grade_bands").select("id, min_score, max_score, grade, remark"),
  ]);

  const assessment = unwrapMaybe(assessmentRes, "assessment");
  if (!assessment) return null;

  const bands: GradeBandVM[] = unwrapList(bandsRes, "grade bands").map((b) => ({
    ...b,
    min_score: Number(b.min_score),
    max_score: Number(b.max_score),
  }));

  const max = Number(assessment.max_score);
  const results: AssessmentResultVM[] = unwrapList(resultsRes, "assessment results")
    .map((r) => {
      const score = Number(r.score);
      // Graded against the assessment's own max and the CURRENT scale, not the stored grade, so a
      // corrected grading scale is reflected here immediately.
      const derived = scoreToGrade(score, max, bands);
      return {
        student_id: r.student_id,
        student_name: r.students ? `${r.students.first_name} ${r.students.last_name}` : "—",
        admission_no: r.students?.admission_no ?? "—",
        score,
        grade: derived?.grade ?? null,
        remark: derived?.remark ?? null,
      };
    })
    // Highest first, how a teacher reads a mark sheet.
    .sort((a, b) => b.score - a.score);

  return { ...toListItemVM(assessment), results };
}

/**
 * The teacher's own assessments: those whose (class, subject) pair they are assigned to teach.
 *
 * RLS on `assessments` allows same-school reads (an admin oversees all of them), so the teacher
 * scope is applied here. It matches on the PAIR, not on class alone, a teacher who takes Maths in
 * Basic 1 should not see the English assessments for the same class.
 */
export async function listTeacherAssessments(
  teacherId: string,
): Promise<AssessmentListItemVM[]> {
  const assignments = unwrapList(
    await db().from("class_subjects").select("class_id, subject_id").eq("teacher_id", teacherId),
    "teacher assignments",
  );
  if (assignments.length === 0) return [];

  const mine = new Set(assignments.map((a) => `${a.class_id}:${a.subject_id}`));

  const rows = unwrapList(
    await db()
      .from("assessments")
      .select(SELECT)
      .in("class_id", [...new Set(assignments.map((a) => a.class_id))])
      .order("date", { ascending: false }),
    "teacher assessments",
  );

  return rows.filter((a) => mine.has(`${a.class_id}:${a.subject_id}`)).map(toListItemVM);
}

/**
 * The mark sheet for one assessment: every actively-enrolled student in its class, carrying their
 * existing mark or null.
 *
 * Driven by the ENROLMENT rather than by existing result rows, so a student who joined mid-term shows
 * up unmarked instead of being silently missing from the sheet. RLS confines both reads to the
 * teacher's own classes.
 */
export async function getScoreSheet(assessmentId: string): Promise<ScoreSheetVM | null> {
  // Explicit type argument: the multi-line SELECT defeats Supabase's type-level select parser, which
  // then infers `never`. AssessmentRow states the shape instead.
  const assessment = unwrapMaybe<AssessmentRow>(
    await db().from("assessments").select(SELECT).eq("id", assessmentId).single(),
    "assessment",
  );
  if (!assessment) return null;

  // The roster is scoped to the year the assessment's own term belongs to, not the active year,
  // so last year's mark sheet keeps showing last year's cohort after a promotion rollover.
  let rosterQuery = db()
    .from("enrollments")
    .select("students!inner(id, first_name, last_name, admission_no)")
    .eq("class_id", assessment.class_id)
    .eq("status", "active");
  if (assessment.terms) {
    rosterQuery = rosterQuery.eq("academic_year_id", assessment.terms.academic_year_id);
  }

  const [rosterRes, existingRes] = await Promise.all([
    rosterQuery,
    db()
      .from("results")
      .select("student_id, score, teacher_comment, is_submitted")
      .eq("assessment_id", assessmentId),
  ]);

  const students = unwrapList(rosterRes, "class roster")
    .map((e) => e.students)
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const existing = unwrapList(existingRes, "existing results").map((r) => ({
    student_id: r.student_id,
    score: Number(r.score),
    teacher_comment: r.teacher_comment,
    is_submitted: r.is_submitted,
  }));

  return {
    assessment: toListItemVM(assessment),
    entries: buildScoreSheet(students, existing),
  };
}
