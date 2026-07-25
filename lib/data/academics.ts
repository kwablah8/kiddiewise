import { db, unwrapList, unwrapMaybe } from "./_client";
import type {
  AcademicYearVM,
  TermVM,
  ActiveContextVM,
  ClassVM,
  SubjectVM,
  StaffVM,
  AssignmentVM,
  StaffRole,
  StaffGender,
} from "@/lib/validators/academics";

// Counts on these view-models (term_count, student_count, subject_count, class_count) are DERIVED at
// read time, never stored — so they cannot go stale after a mutation (golden rule 9). PostgREST
// computes them server-side via embedded aggregate selects (`terms(count)`), which keeps it to a
// single round trip rather than N+1 follow-up queries.

const YEAR_SELECT = "id, name, start_date, end_date, is_active, terms(count)";

interface YearRow {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  terms: { count: number }[];
}

const toYearVM = (y: YearRow): AcademicYearVM => ({
  id: y.id,
  name: y.name,
  start_date: y.start_date,
  end_date: y.end_date,
  is_active: y.is_active,
  term_count: y.terms[0]?.count ?? 0,
});

export async function listAcademicYears(): Promise<AcademicYearVM[]> {
  const rows = unwrapList(
    await db().from("academic_years").select(YEAR_SELECT).order("start_date", { ascending: false }),
    "academic years",
  );
  return rows.map(toYearVM);
}

export async function listTerms(yearId?: string): Promise<TermVM[]> {
  let q = db()
    .from("terms")
    .select("id, academic_year_id, name, ordinal, start_date, end_date, is_active")
    .order("ordinal");
  if (yearId !== undefined) q = q.eq("academic_year_id", yearId);
  return unwrapList(await q, "terms");
}

export async function getActiveContext(): Promise<ActiveContextVM> {
  // Two independent reads rather than one join: the active term does not have to belong to the
  // active year during a year rollover, so joining them would hide a mid-transition state.
  const [yearRes, termRes] = await Promise.all([
    db().from("academic_years").select(YEAR_SELECT).eq("is_active", true).maybeSingle(),
    db()
      .from("terms")
      .select("id, academic_year_id, name, ordinal, start_date, end_date, is_active")
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  const year = unwrapMaybe(yearRes, "active year");
  const term = unwrapMaybe(termRes, "active term");

  return {
    active_year: year ? toYearVM(year) : null,
    active_term: term ?? null,
  };
}

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------
const CLASS_SELECT = `
  id, name, level, capacity, class_teacher_id,
  class_teacher:profiles!classes_class_teacher_id_fkey(first_name, last_name),
  enrollments(count),
  class_subjects(count)
`;

interface ClassRow {
  id: string;
  name: string;
  level: string;
  capacity: number | null;
  class_teacher_id: string | null;
  class_teacher: { first_name: string; last_name: string } | null;
  enrollments: { count: number }[];
  class_subjects: { count: number }[];
}

const toClassVM = (c: ClassRow): ClassVM => ({
  id: c.id,
  name: c.name,
  level: c.level,
  capacity: c.capacity,
  class_teacher_id: c.class_teacher_id,
  class_teacher_name: c.class_teacher
    ? `${c.class_teacher.first_name} ${c.class_teacher.last_name}`
    : null,
  student_count: c.enrollments[0]?.count ?? 0,
  subject_count: c.class_subjects[0]?.count ?? 0,
});

export async function listClasses(): Promise<ClassVM[]> {
  const rows = unwrapList(
    await db().from("classes").select(CLASS_SELECT).order("name"),
    "classes",
  );
  return rows.map(toClassVM);
}

export async function getClass(id: string): Promise<ClassVM | null> {
  const row = unwrapMaybe(
    await db().from("classes").select(CLASS_SELECT).eq("id", id).single(),
    "class",
  );
  return row ? toClassVM(row) : null;
}

// ---------------------------------------------------------------------------
// Subjects
// ---------------------------------------------------------------------------
export async function listSubjects(): Promise<SubjectVM[]> {
  const rows = unwrapList(
    await db().from("subjects").select("id, name, code, class_subjects(count)").order("name"),
    "subjects",
  );
  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    class_count: s.class_subjects[0]?.count ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------
// class_count/subject_count union TWO relationships: subject assignments (class_subjects.teacher_id)
// and being a class's homeroom teacher (classes.class_teacher_id). A teacher taking the same subject
// in two classes counts as one subject but two classes — hence the Sets rather than row counts.
const STAFF_SELECT = `
  id, first_name, last_name, email, phone, staff_no, role, position, department,
  gender, date_of_birth, hire_date, qualification, is_active,
  class_subjects(class_id, subject_id),
  homeroom:classes!classes_class_teacher_id_fkey(id)
`;

interface StaffRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  staff_no: string | null;
  role: "super_admin" | "school_admin" | "teacher" | "parent";
  position: string | null;
  department: string | null;
  gender: "male" | "female" | "other" | null;
  date_of_birth: string | null;
  hire_date: string | null;
  qualification: string | null;
  is_active: boolean;
  class_subjects: { class_id: string; subject_id: string }[];
  homeroom: { id: string }[];
}

function toStaffVM(s: StaffRow): StaffVM {
  const classIds = new Set<string>(s.homeroom.map((c) => c.id));
  const subjectIds = new Set<string>();
  for (const cs of s.class_subjects) {
    classIds.add(cs.class_id);
    subjectIds.add(cs.subject_id);
  }
  return {
    id: s.id,
    first_name: s.first_name,
    last_name: s.last_name,
    email: s.email,
    phone: s.phone,
    // The VM contracts a string because the UI always shows a staff number; profiles.staff_no is
    // nullable because parents have none. Staff rows always have one assigned at creation.
    staff_no: s.staff_no ?? "—",
    // Only teacher/school_admin reach these screens (the query filters on it), so the narrowing is
    // safe — but assert it rather than casting blindly.
    role: (s.role === "teacher" ? "teacher" : "school_admin") satisfies StaffRole,
    position: s.position,
    department: s.department,
    gender: s.gender satisfies StaffGender | null,
    date_of_birth: s.date_of_birth,
    hire_date: s.hire_date,
    qualification: s.qualification,
    is_active: s.is_active,
    class_count: classIds.size,
    subject_count: subjectIds.size,
  };
}

export async function listStaff(): Promise<StaffVM[]> {
  const rows = unwrapList(
    await db()
      .from("profiles")
      .select(STAFF_SELECT)
      // Parents live in the same table; the Staff screen is teaching + admin staff only.
      .in("role", ["teacher", "school_admin"])
      .order("staff_no"),
    "staff",
  );
  return rows.map(toStaffVM);
}

export async function getStaff(id: string): Promise<StaffVM | null> {
  const row = unwrapMaybe(
    await db().from("profiles").select(STAFF_SELECT).eq("id", id).single(),
    "staff member",
  );
  return row ? toStaffVM(row) : null;
}

// ---------------------------------------------------------------------------
// class_subjects assignments
// ---------------------------------------------------------------------------
const ASSIGNMENT_SELECT = `
  id, class_id, subject_id, teacher_id,
  classes(name), subjects(name),
  teacher:profiles!class_subjects_teacher_id_fkey(first_name, last_name)
`;

interface AssignmentRow {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string | null;
  classes: { name: string } | null;
  subjects: { name: string } | null;
  teacher: { first_name: string; last_name: string } | null;
}

const toAssignmentVM = (a: AssignmentRow): AssignmentVM => ({
  id: a.id,
  class_id: a.class_id,
  class_name: a.classes?.name ?? "",
  subject_id: a.subject_id,
  subject_name: a.subjects?.name ?? "",
  teacher_id: a.teacher_id,
  // Null teacher is legitimate — the UI renders "Unassigned".
  teacher_name: a.teacher ? `${a.teacher.first_name} ${a.teacher.last_name}` : null,
});

export async function listAssignments(classId: string): Promise<AssignmentVM[]> {
  const rows = unwrapList(
    await db().from("class_subjects").select(ASSIGNMENT_SELECT).eq("class_id", classId),
    "class assignments",
  );
  return rows.map(toAssignmentVM).sort((a, b) => a.subject_name.localeCompare(b.subject_name));
}

/** The same class_subjects rows filtered by teacher, for the staff detail page. */
export async function listAssignmentsForStaff(staffId: string): Promise<AssignmentVM[]> {
  const rows = unwrapList(
    await db().from("class_subjects").select(ASSIGNMENT_SELECT).eq("teacher_id", staffId),
    "staff assignments",
  );
  return rows.map(toAssignmentVM).sort((a, b) => a.class_name.localeCompare(b.class_name));
}
