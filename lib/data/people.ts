import { db, unwrapList, unwrapMaybe } from "./_client";
import { computeStudentStats } from "@/lib/students";
import { scoreToGrade } from "@/lib/grading";
import { aggregateSubjectResults } from "@/lib/results";
import { studentListItemVM } from "@/lib/validators/people";
import { derivePortalStatus } from "@/lib/temp-password";
import type {
  StudentListItemVM,
  StudentDetailVM,
  ParentListItemVM,
  ClassOptionVM,
  StudentStatsVM,
  StudentAcademicsVM,
  GuardianVM,
  BloodGroup,
} from "@/lib/validators/people";
import type { GradeBandVM } from "@/lib/validators/grading";
import type { SubjectResultVM } from "@/lib/validators/parent";

// A student's class is NOT a column on `students` — it comes from their active enrollment, so a
// promotion is one enrollment write rather than an update to the student row. Guardians likewise
// come from `student_guardians`. Both are embedded here so a list is one round trip.
const LIST_SELECT = `
  id, admission_no, first_name, last_name, gender, enrollment_status, photo_url,
  enrollments(class_id, status, classes(name)),
  student_guardians(parent_profile_id, relationship, is_primary,
    parent:profiles!student_guardians_parent_profile_id_fkey(first_name, last_name, email, occupation))
`;

const DETAIL_SELECT = `${LIST_SELECT},
  date_of_birth, other_names, blood_group, enrollment_date, medical_conditions, allergies,
  prev_school_name, prev_class_ended, prev_average_score, prev_year_attended,
  email, phone, address, city, town, initial_academic_year_id, initial_term_id
`;

interface GuardianJoin {
  parent_profile_id: string;
  relationship: "mother" | "father" | "guardian" | "other";
  is_primary: boolean;
  parent: {
    first_name: string;
    last_name: string;
    email: string;
    occupation: string | null;
  } | null;
}

interface StudentListRow {
  id: string;
  admission_no: string;
  first_name: string;
  last_name: string;
  gender: "male" | "female" | "other";
  enrollment_status: "active" | "inactive" | "graduated" | "withdrawn" | "transferred";
  photo_url: string | null;
  enrollments: { class_id: string; status: string; classes: { name: string } | null }[];
  student_guardians: GuardianJoin[];
}

interface StudentDetailRow extends StudentListRow {
  date_of_birth: string;
  other_names: string | null;
  blood_group: BloodGroup | null;
  enrollment_date: string | null;
  medical_conditions: string | null;
  allergies: string | null;
  prev_school_name: string | null;
  prev_class_ended: string | null;
  prev_average_score: string | null;
  prev_year_attended: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  town: string | null;
  initial_academic_year_id: string | null;
  initial_term_id: string | null;
}

/** The student's current class, from their active enrollment. */
function activeEnrollment(s: StudentListRow) {
  return s.enrollments.find((e) => e.status === "active") ?? null;
}

function guardianName(g: GuardianJoin): string {
  return g.parent ? `${g.parent.first_name} ${g.parent.last_name}` : "Unknown guardian";
}

function toListItemVM(s: StudentListRow): StudentListItemVM {
  const enrollment = activeEnrollment(s);
  return {
    id: s.id,
    admission_no: s.admission_no,
    first_name: s.first_name,
    last_name: s.last_name,
    gender: s.gender,
    enrollment_status: s.enrollment_status,
    photo_url: s.photo_url,
    class_id: enrollment?.class_id ?? null,
    class_name: enrollment?.classes?.name ?? null,
    guardian_names: s.student_guardians.map(guardianName),
  };
}

function toGuardianVM(g: GuardianJoin): GuardianVM {
  return {
    parent_profile_id: g.parent_profile_id,
    name: guardianName(g),
    email: g.parent?.email ?? "",
    occupation: g.parent?.occupation ?? null,
    relationship: g.relationship,
    is_primary: g.is_primary,
  };
}

function toDetailVM(s: StudentDetailRow): StudentDetailVM {
  return {
    ...toListItemVM(s),
    date_of_birth: s.date_of_birth,
    guardians: s.student_guardians.map(toGuardianVM),
    other_names: s.other_names,
    blood_group: s.blood_group,
    enrollment_date: s.enrollment_date,
    medical_conditions: s.medical_conditions,
    allergies: s.allergies,
    prev_school_name: s.prev_school_name,
    prev_class_ended: s.prev_class_ended,
    prev_average_score: s.prev_average_score,
    prev_year_attended: s.prev_year_attended,
    email: s.email,
    phone: s.phone,
    address: s.address,
    city: s.city,
    town: s.town,
    initial_academic_year_id: s.initial_academic_year_id,
    initial_term_id: s.initial_term_id,
  };
}

// The filter params arrive as loose strings from URL/select state, so they are narrowed against the
// real enums here rather than trusted. An unrecognised value is ignored, not sent to Postgres — a
// bad `?status=` in the address bar should show an unfiltered list, not a 400.
const ENROLLMENT_STATUSES = studentListItemVM.shape.enrollment_status.options;
const GENDERS = studentListItemVM.shape.gender.options;

type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];
type Gender = (typeof GENDERS)[number];

const asStatus = (v: string | undefined): EnrollmentStatus | undefined =>
  ENROLLMENT_STATUSES.find((s) => s === v);
const asGender = (v: string | undefined): Gender | undefined => GENDERS.find((g) => g === v);

export async function listStudents(
  params: { search?: string; status?: string; gender?: string; class_id?: string } = {},
): Promise<StudentListItemVM[]> {
  const { search = "", status, gender, class_id } = params;

  let q = db().from("students").select(LIST_SELECT).order("first_name");
  const statusFilter = asStatus(status);
  const genderFilter = asGender(gender);
  if (statusFilter) q = q.eq("enrollment_status", statusFilter);
  if (genderFilter) q = q.eq("gender", genderFilter);
  if (search.trim()) {
    // Matches either name part or the admission number, the three things an admin types into the
    // search box. `%` and `,` are stripped because both are `or()` filter syntax, not text.
    const term = search.trim().replace(/[%,]/g, "");
    q = q.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,admission_no.ilike.%${term}%`,
    );
  }

  const rows = unwrapList(await q, "students");
  const mapped = rows.map(toListItemVM);

  // Filtered after mapping: class comes from the embedded enrollment, and PostgREST cannot filter a
  // parent row on an embedded column without turning the join into an inner join — which would also
  // drop unenrolled students from the unfiltered list.
  return class_id ? mapped.filter((s) => s.class_id === class_id) : mapped;
}

/** Stat cards for the Students page — derived from the FULL roster via the pure, tested helper. */
export async function getStudentStats(): Promise<StudentStatsVM> {
  const all = await listStudents();
  return computeStudentStats(all);
}

export async function getStudent(id: string): Promise<StudentDetailVM | null> {
  const row = unwrapMaybe(
    await db().from("students").select(DETAIL_SELECT).eq("id", id).single(),
    "student",
  );
  return row ? toDetailVM(row) : null;
}

/**
 * Academic performance for one student: this term's per-subject standing plus the published
 * terminal report, if any.
 *
 * A student sits several assessments per subject per term, but the screen shows one row per
 * subject — so the per-subject score is the MEAN of that subject's submitted scores, expressed as a
 * percentage of each assessment's own max_score (assessments are not all out of 100). The grade and
 * remark are then derived from the school's own bands, never read from the stored per-result grade,
 * so editing the grading scale re-grades every view at once.
 */
export async function getStudentAcademics(studentId: string): Promise<StudentAcademicsVM> {
  const [termRes, bandsRes, resultsRes, reportRes] = await Promise.all([
    db().from("terms").select("id, name").eq("is_active", true).maybeSingle(),
    db().from("grade_bands").select("id, min_score, max_score, grade, remark"),
    db()
      .from("results")
      .select(
        "score, teacher_comment, created_at, assessments!inner(max_score, term_id, subjects(name))",
      )
      .eq("is_submitted", true)
      .eq("student_id", studentId),
    db()
      .from("terminal_reports")
      .select("class_teacher_comment, average_score, is_published")
      .eq("student_id", studentId)
      .eq("is_published", true)
      .maybeSingle(),
  ]);

  const term = unwrapMaybe(termRes, "active term");
  const bands: GradeBandVM[] = unwrapList(bandsRes, "grade bands");
  const allResults = unwrapList(resultsRes, "student results");
  const report = unwrapMaybe(reportRes, "terminal report");
  const termName = term?.name ?? "This term";

  // Filtered here rather than in the query: the term filter lives on the embedded assessment, and
  // an absent active term must yield "no results this term" rather than every result ever recorded.
  const termResults = term ? allResults.filter((r) => r.assessments?.term_id === term.id) : [];

  const subjects: SubjectResultVM[] = aggregateSubjectResults(
    termResults.map((r) => ({
      subject: r.assessments?.subjects?.name ?? null,
      score: Number(r.score),
      max_score: Number(r.assessments?.max_score ?? 0),
      teacher_comment: r.teacher_comment,
      recorded_at: r.created_at,
    })),
    bands,
  );

  if (!report) return { term_name: termName, subjects, report: null };

  // The report's own average is the source of truth once published — it was computed against the
  // full term, which may include subjects outside this term's submitted set.
  const average = report.average_score === null ? null : Math.round(Number(report.average_score));
  const overall = average !== null ? scoreToGrade(average, 100, bands) : null;

  return {
    term_name: termName,
    subjects,
    report: {
      published: true,
      class_teacher_remark: report.class_teacher_comment ?? "",
      overall_average: average,
      overall_grade: overall?.grade ?? null,
    },
  };
}

export async function listParents(): Promise<ParentListItemVM[]> {
  const rows = unwrapList(
    await db()
      .from("profiles")
      .select(
        `id, first_name, last_name, email, phone, occupation,
         must_change_password, temp_password_expires_at, password_changed_at,
         student_guardians(students(first_name, last_name))`,
      )
      .eq("role", "parent")
      .order("first_name"),
    "parents",
  );

  const now = Date.now();
  return rows.map((p) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    email: p.email,
    phone: p.phone,
    occupation: p.occupation,
    portal_status: derivePortalStatus(p, now),
    children_names: p.student_guardians
      .map((g) => (g.students ? `${g.students.first_name} ${g.students.last_name}` : null))
      .filter((n): n is string => n !== null),
  }));
}

export async function listClassOptions(): Promise<ClassOptionVM[]> {
  return unwrapList(
    await db().from("classes").select("id, name, level").order("name"),
    "class options",
  );
}
