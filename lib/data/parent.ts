import { activeYearId, db, unwrapList, unwrapMaybe } from "./_client";
import { scoreToGrade } from "@/lib/grading";
import { aggregateSubjectResults, overallAverage } from "@/lib/results";
import { summarizeAttendance } from "@/lib/parent/attendance";
import type {
  ChildProfileVM,
  ChildResultsVM,
  ChildSummaryVM,
  AttendanceRecordVM,
  ParentAnnouncementVM,
  TerminalReportVM,
} from "@/lib/validators/parent";
import type { GradeBandVM } from "@/lib/validators/grading";

/**
 * The parent portal.
 *
 * Every read here is scoped by RLS to the caller's linked children — `students_parent_read`,
 * `att_parent_read`, `res_parent_read` and friends all gate on `parent_of_student()`. The mock
 * version of this module had to re-implement that gate in application code (`isGuardianOf`); now the
 * database enforces it, so asking for a child you don't guard returns zero rows and these functions
 * resolve to null. That is the correct behaviour AND it cannot be bypassed from the client.
 *
 * `parentId` stays in each signature: the query hooks pass it as part of the React Query key, so a
 * cached parent's data can never be served to a different signed-in user.
 */

// Supabase infers row types by parsing the select string at the type level. That parser gives up on
// some of the multi-column-plus-embedded-relation selects below and yields `never`, so these reads
// declare their select as `string` (which opts into the untyped overload) and state the row shape
// explicitly instead. The shape is still checked — just by these interfaces rather than by inference.
const CHILD_PROFILE_SELECT: string = `
  id, first_name, last_name, other_names, photo_url, admission_no, date_of_birth, gender,
  enrollments(status, class_id, classes(name))
`;

const CHILD_REPORT_SELECT: string =
  "id, class_teacher_comment, average_score, is_published, term_id, terms(name, reopening_date)";

interface ChildProfileRow {
  id: string;
  first_name: string;
  last_name: string;
  other_names: string | null;
  photo_url: string | null;
  admission_no: string;
  date_of_birth: string;
  gender: "male" | "female" | "other";
  enrollments: { status: string; class_id: string; classes: { name: string } | null }[];
}

interface ChildReportRow {
  id: string;
  class_teacher_comment: string | null;
  average_score: number | null;
  is_published: boolean;
  term_id: string;
  terms: { name: string; reopening_date: string | null } | null;
}

interface ActiveTermRow {
  id: string;
  name: string;
}

async function activeTerm(): Promise<ActiveTermRow | null> {
  return unwrapMaybe<ActiveTermRow>(
    await db().from("terms").select("id, name").eq("is_active", true).maybeSingle(),
    "active term",
  );
}

async function gradeBands(): Promise<GradeBandVM[]> {
  const rows = unwrapList(
    await db().from("grade_bands").select("id, min_score, max_score, grade, remark"),
    "grade bands",
  );
  return rows.map((b) => ({
    ...b,
    min_score: Number(b.min_score),
    max_score: Number(b.max_score),
  }));
}

export async function getParentChildren(parentId: string): Promise<ChildSummaryVM[]> {
  void parentId; // RLS resolves "my children" from auth.uid(); the arg only keys the query cache.

  // The year first: a child's class is their enrollment in the ACTIVE year, and a promoted child
  // has one enrollment per year — unscoped, the embed would surface last year's class.
  const yearId = await activeYearId();
  let childrenQuery = db()
    .from("students")
    .select(
      `id, first_name, last_name, photo_url,
       enrollments(status, classes(name))`,
    )
    .order("first_name");
  if (yearId) childrenQuery = childrenQuery.eq("enrollments.academic_year_id", yearId);

  const [childrenRes, term, bands] = await Promise.all([
    childrenQuery,
    activeTerm(),
    gradeBands(),
  ]);

  const children = unwrapList(childrenRes, "children");
  if (children.length === 0) return [];

  const ids = children.map((c) => c.id);

  // Attendance and the latest result are fetched for all children at once rather than per child —
  // a parent with four children shouldn't cost nine round trips.
  const [attendanceRes, resultsRes] = await Promise.all([
    term
      ? db().from("attendance").select("student_id, status").eq("term_id", term.id).in("student_id", ids)
      : Promise.resolve({ data: [], error: null }),
    db()
      .from("results")
      .select("student_id, score, created_at, assessments!inner(max_score, subjects(name))")
      .eq("is_submitted", true)
      .in("student_id", ids)
      .order("created_at", { ascending: false }),
  ]);

  const attendance = unwrapList(attendanceRes, "attendance");
  const results = unwrapList(resultsRes, "results");

  return children.map((c): ChildSummaryVM => {
    const mine = attendance.filter((a) => a.student_id === c.id);
    // summarizeAttendance yields null pct for no records — "not measured", not "0% attendance".
    const pct = summarizeAttendance(mine.map((a) => ({ date: "", status: a.status }))).pct;

    // Already ordered newest-first, so the first match is the most recent.
    const latest = results.find((r) => r.student_id === c.id);
    const max = Number(latest?.assessments?.max_score ?? 0);
    const subject = latest?.assessments?.subjects?.name;

    let latest_result: ChildSummaryVM["latest_result"] = null;
    if (latest && subject && max > 0) {
      const percent = Math.round((Number(latest.score) / max) * 100);
      latest_result = {
        subject,
        score: percent,
        grade: scoreToGrade(percent, 100, bands)?.grade ?? "—",
      };
    }

    return {
      id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      photo_url: c.photo_url,
      class_name: c.enrollments.find((e) => e.status === "active")?.classes?.name ?? null,
      attendance_pct: pct,
      latest_result,
    };
  });
}

export async function getParentAnnouncements(parentId: string): Promise<ParentAnnouncementVM[]> {
  void parentId;
  // The `ann_read` policy already restricts this to published announcements whose audience includes
  // parents, so no audience filter is repeated here — duplicating it in the query would imply the
  // client was the thing enforcing it.
  const rows = unwrapList(
    await db()
      .from("announcements")
      .select("id, title, body, audience, created_at")
      .order("published_at", { ascending: false }),
    "announcements",
  );

  return rows.flatMap((a) =>
    // The VM narrows to the two audiences a parent can see; 'teachers' can't reach here via RLS.
    a.audience === "parents" || a.audience === "everyone"
      ? [{ id: a.id, title: a.title, body: a.body, audience: a.audience, created_at: a.created_at }]
      : [],
  );
}

export async function getChildProfile(
  parentId: string,
  childId: string,
): Promise<ChildProfileVM | null> {
  void parentId;

  // Scoped to the active year for the same reason as getParentChildren above.
  const yearId = await activeYearId();
  let q = db().from("students").select(CHILD_PROFILE_SELECT).eq("id", childId);
  if (yearId) q = q.eq("enrollments.academic_year_id", yearId);
  const student = unwrapMaybe<ChildProfileRow>(await q.single(), "child profile");
  // Null here is both "no such student" and "not your child" — RLS makes them indistinguishable
  // from the client, which is exactly right: existence itself shouldn't leak.
  if (!student) return null;

  const enrollment = student.enrollments.find((e) => e.status === "active") ?? null;

  const teachers: { name: string; subject: string }[] = [];
  if (enrollment) {
    const [classRes, assignmentsRes] = await Promise.all([
      db()
        .from("classes")
        .select("class_teacher:profiles!classes_class_teacher_id_fkey(first_name, last_name)")
        .eq("id", enrollment.class_id)
        .maybeSingle(),
      db()
        .from("class_subjects")
        .select(
          `subjects(name), teacher:profiles!class_subjects_teacher_id_fkey(first_name, last_name)`,
        )
        .eq("class_id", enrollment.class_id),
    ]);

    const cls = unwrapMaybe(classRes, "class teacher");
    if (cls?.class_teacher) {
      teachers.push({
        name: `${cls.class_teacher.first_name} ${cls.class_teacher.last_name}`,
        subject: "Class teacher",
      });
    }

    for (const a of unwrapList(assignmentsRes, "class subjects")) {
      if (a.teacher && a.subjects) {
        teachers.push({
          name: `${a.teacher.first_name} ${a.teacher.last_name}`,
          subject: a.subjects.name,
        });
      }
    }
  }

  return {
    id: student.id,
    first_name: student.first_name,
    last_name: student.last_name,
    other_names: student.other_names,
    photo_url: student.photo_url,
    admission_no: student.admission_no,
    date_of_birth: student.date_of_birth,
    gender: student.gender,
    class_name: enrollment?.classes?.name ?? null,
    teachers,
  };
}

/** A child's attendance history, newest first. */
export async function getChildAttendance(
  parentId: string,
  childId: string,
): Promise<AttendanceRecordVM[]> {
  void parentId;
  return unwrapList(
    await db()
      .from("attendance")
      .select("date, status")
      .eq("student_id", childId)
      .order("date", { ascending: false }),
    "child attendance",
  );
}

export async function getChildResults(
  parentId: string,
  childId: string,
): Promise<ChildResultsVM | null> {
  void parentId;

  const [term, bands] = await Promise.all([activeTerm(), gradeBands()]);
  const termName = term?.name ?? "This term";

  const rows = unwrapList(
    await db()
      .from("results")
      .select("score, teacher_comment, created_at, assessments!inner(max_score, term_id, subjects(name))")
      // Unsubmitted results are a teacher's work in progress — a parent must never see a draft mark.
      .eq("is_submitted", true)
      .eq("student_id", childId),
    "child results",
  );

  const forTerm = term ? rows.filter((r) => r.assessments?.term_id === term.id) : [];

  return {
    term_name: termName,
    subjects: aggregateSubjectResults(
      forTerm.map((r) => ({
        subject: r.assessments?.subjects?.name ?? null,
        score: Number(r.score),
        max_score: Number(r.assessments?.max_score ?? 0),
        teacher_comment: r.teacher_comment,
        recorded_at: r.created_at,
      })),
      bands,
    ),
  };
}

export async function getChildReport(
  parentId: string,
  childId: string,
): Promise<TerminalReportVM | null> {
  void parentId;

  const [term, bands] = await Promise.all([activeTerm(), gradeBands()]);

  let q = db()
    .from("terminal_reports")
    .select(CHILD_REPORT_SELECT)
    .eq("student_id", childId)
    // Belt and braces with `tr_parent_read`: an unpublished report is the class teacher's draft.
    .eq("is_published", true);
  if (term) q = q.eq("term_id", term.id);

  const report = unwrapMaybe<ChildReportRow>(await q.maybeSingle(), "child report");
  if (!report) return null;

  // Prefer the report's stored average — it was computed over the whole term when published, which
  // may include subjects beyond the currently submitted set. Fall back to deriving it.
  let average = report.average_score === null ? null : Math.round(Number(report.average_score));
  if (average === null) {
    const results = await getChildResults(parentId, childId);
    average = overallAverage(results?.subjects ?? []);
  }

  return {
    id: report.id,
    term_name: report.terms?.name ?? term?.name ?? "This term",
    reopening_date: report.terms?.reopening_date ?? null,
    published: true,
    overall_average: average,
    overall_grade: average !== null ? (scoreToGrade(average, 100, bands)?.grade ?? null) : null,
    class_teacher_remark: report.class_teacher_comment ?? "",
  };
}
