import { simulate } from "./_devState";
import { store } from "@/lib/mock/store";
import type {
  AcademicYearVM,
  TermVM,
  ActiveContextVM,
  ClassVM,
  SubjectVM,
  StaffVM,
  AssignmentVM,
} from "@/lib/validators/academics";

type AcademicYearRecord = (typeof store)["academicYears"][number];
type TermRecord = (typeof store)["terms"][number];
type ClassRecord = (typeof store)["classes"][number];
type SubjectRecord = (typeof store)["subjects"][number];
type StaffRecord = (typeof store)["staff"][number];
type AssignmentRecord = (typeof store)["classSubjects"][number];

function toYearVM(y: AcademicYearRecord): AcademicYearVM {
  return {
    ...y,
    term_count: store.terms.filter((t) => t.academic_year_id === y.id).length,
  };
}

function toTermVM(t: TermRecord): TermVM {
  return { ...t };
}

// SEAM: mock-approximate. The real school reads `student_count` off the active-year
// `enrollments` join; the Slice-2 student model instead carries each student's current
// `class_id` directly (no separate enrollments table yet), so this counts students by
// `class_id` — consistent with how `lib/data/people.ts` already denormalizes class info.
function toClassVM(c: ClassRecord): ClassVM {
  const teacher = c.class_teacher_id ? store.staff.find((s) => s.id === c.class_teacher_id) : null;
  return {
    id: c.id,
    name: c.name,
    level: c.level,
    capacity: c.capacity,
    class_teacher_id: c.class_teacher_id,
    class_teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : null,
    student_count: store.students.filter((s) => s.class_id === c.id).length,
    subject_count: store.classSubjects.filter((cs) => cs.class_id === c.id).length,
  };
}

function toSubjectVM(s: SubjectRecord): SubjectVM {
  return {
    id: s.id,
    name: s.name,
    code: s.code,
    class_count: store.classSubjects.filter((cs) => cs.subject_id === s.id).length,
  };
}

// class_count/subject_count are derived from BOTH class_subjects (subject-teacher
// assignments) and classes.class_teacher_id (being a class's homeroom teacher), unioned by
// class id / subject id so a teacher assigned the same subject in two classes still counts
// as one subject but two classes.
function toStaffVM(s: StaffRecord): StaffVM {
  const classIds = new Set<string>();
  const subjectIds = new Set<string>();
  for (const c of store.classes) {
    if (c.class_teacher_id === s.id) classIds.add(c.id);
  }
  for (const cs of store.classSubjects) {
    if (cs.teacher_id === s.id) {
      classIds.add(cs.class_id);
      subjectIds.add(cs.subject_id);
    }
  }
  return {
    id: s.id,
    first_name: s.first_name,
    last_name: s.last_name,
    email: s.email,
    phone: s.phone,
    staff_no: s.staff_no,
    role: s.role,
    position: s.position,
    department: s.department,
    gender: s.gender,
    date_of_birth: s.date_of_birth,
    hire_date: s.hire_date,
    qualification: s.qualification,
    is_active: s.is_active,
    class_count: classIds.size,
    subject_count: subjectIds.size,
  };
}

function toAssignmentVM(a: AssignmentRecord): AssignmentVM {
  const cls = store.classes.find((c) => c.id === a.class_id);
  const subject = store.subjects.find((s) => s.id === a.subject_id);
  const teacher = a.teacher_id ? store.staff.find((s) => s.id === a.teacher_id) : null;
  return {
    id: a.id,
    class_id: a.class_id,
    class_name: cls?.name ?? "",
    subject_id: a.subject_id,
    subject_name: subject?.name ?? "",
    teacher_id: a.teacher_id,
    teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : null,
  };
}

export function listAcademicYears(): Promise<AcademicYearVM[]> {
  return simulate(store.academicYears.map(toYearVM), []);
}

export function listTerms(yearId?: string): Promise<TermVM[]> {
  const result = store.terms
    .filter((t) => yearId === undefined || t.academic_year_id === yearId)
    .map(toTermVM);
  return simulate(result, []);
}

export function getActiveContext(): Promise<ActiveContextVM> {
  const year = store.academicYears.find((y) => y.is_active) ?? null;
  const term = store.terms.find((t) => t.is_active) ?? null;
  const result: ActiveContextVM = {
    active_year: year ? toYearVM(year) : null,
    active_term: term ? toTermVM(term) : null,
  };
  return simulate(result, { active_year: null, active_term: null });
}

export function listClasses(): Promise<ClassVM[]> {
  return simulate(store.classes.map(toClassVM), []);
}

export function getClass(id: string): Promise<ClassVM | null> {
  const found = store.classes.find((c) => c.id === id);
  return simulate(found ? toClassVM(found) : null, null);
}

export function listSubjects(): Promise<SubjectVM[]> {
  return simulate(store.subjects.map(toSubjectVM), []);
}

export function listStaff(): Promise<StaffVM[]> {
  return simulate(store.staff.map(toStaffVM), []);
}

export function getStaff(id: string): Promise<StaffVM | null> {
  const found = store.staff.find((s) => s.id === id);
  return simulate(found ? toStaffVM(found) : null, null);
}

export function listAssignments(classId: string): Promise<AssignmentVM[]> {
  const result = store.classSubjects
    .filter((a) => a.class_id === classId)
    .map(toAssignmentVM);
  return simulate(result, []);
}

// Same class_subjects rows as `listAssignments`, filtered the other way — by teacher rather
// than class — for the staff detail page's derived "subjects taught" panel (06-UI §6/§7).
export function listAssignmentsForStaff(staffId: string): Promise<AssignmentVM[]> {
  const result = store.classSubjects
    .filter((a) => a.teacher_id === staffId)
    .map(toAssignmentVM);
  return simulate(result, []);
}
