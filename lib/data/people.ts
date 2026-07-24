import { simulate } from "./_devState";
import { store } from "@/lib/mock/store";
import { computeStudentStats } from "@/lib/students";
import { scoreToGrade } from "@/lib/grading";
import type {
  StudentListItemVM,
  StudentDetailVM,
  ParentListItemVM,
  ClassOptionVM,
  StudentStatsVM,
  StudentAcademicsVM,
} from "@/lib/validators/people";

type StudentRecord = (typeof store)["students"][number];

function toListItemVM(s: StudentRecord): StudentListItemVM {
  return {
    id: s.id,
    admission_no: s.admission_no,
    first_name: s.first_name,
    last_name: s.last_name,
    gender: s.gender,
    enrollment_status: s.enrollment_status,
    photo_url: s.photo_url,
    class_id: s.class_id,
    class_name: s.class_name,
    guardian_names: s.guardians.map((g) => g.name),
  };
}

function toDetailVM(s: StudentRecord): StudentDetailVM {
  return {
    ...toListItemVM(s),
    date_of_birth: s.date_of_birth,
    guardians: s.guardians.map((g) => ({ ...g })),
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

function matchesSearch(s: StudentRecord, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
  return fullName.includes(q) || s.admission_no.toLowerCase().includes(q);
}

export function listStudents(
  params: { search?: string; status?: string; gender?: string; class_id?: string } = {},
): Promise<StudentListItemVM[]> {
  const { search = "", status, gender, class_id } = params;
  const result = store.students
    .filter((s) => matchesSearch(s, search))
    .filter((s) => (status ? s.enrollment_status === status : true))
    .filter((s) => (gender ? s.gender === gender : true))
    .filter((s) => (class_id ? s.class_id === class_id : true))
    .map(toListItemVM);
  return simulate(result, []);
}

// Derives the Students page stat cards from the full roster (unfiltered), via the pure helper.
export function getStudentStats(): Promise<StudentStatsVM> {
  return simulate(computeStudentStats(store.students.map(toListItemVM)), computeStudentStats([]));
}

export function getStudent(id: string): Promise<StudentDetailVM | null> {
  const found = store.students.find((s) => s.id === id);
  const result = found ? toDetailVM(found) : null;
  return simulate(result, null);
}

// The current term's display name (SEAM: real path reads the active term for the school). Mirrors
// the private helper of the same name in lib/data/parent.ts.
function activeTermName(): string {
  return store.terms.find((t) => t.is_active)?.name ?? "This term";
}

// Academic performance for a single student — the admin's own read of this term's results plus
// the published terminal report, if any. Mirrors getChildResults/getChildReport in
// lib/data/parent.ts, minus the guardian gate (an admin may read any student in their school;
// SEAM: RLS scopes this to `school_id`, not a guardian link).
export function getStudentAcademics(studentId: string): Promise<StudentAcademicsVM> {
  const termName = activeTermName();
  const subjects = store.childSubjectResults
    .filter((r) => r.student_id === studentId)
    .map((r) => {
      const g = scoreToGrade(r.score, 100, store.gradeBands);
      return {
        subject: r.subject,
        score: r.score,
        grade: g?.grade ?? "—",
        remark: g?.remark ?? "—",
        teacher_comment: r.teacher_comment,
      };
    });

  let report: StudentAcademicsVM["report"] = null;
  const rep = store.terminalReports.find((r) => r.student_id === studentId && r.published);
  if (rep) {
    const scores = store.childSubjectResults.filter((r) => r.student_id === studentId);
    const average = scores.length
      ? Math.round(scores.reduce((sum, r) => sum + r.score, 0) / scores.length)
      : null;
    const overall = average !== null ? scoreToGrade(average, 100, store.gradeBands) : null;
    report = {
      published: true,
      class_teacher_remark: rep.class_teacher_remark,
      overall_average: average,
      overall_grade: overall?.grade ?? null,
    };
  }

  const vm: StudentAcademicsVM = { term_name: termName, subjects, report };
  // `empty` state → this term, no results yet, no report.
  return simulate(vm, { term_name: termName, subjects: [], report: null });
}

export function listParents(): Promise<ParentListItemVM[]> {
  return simulate(
    store.parents.map((p) => ({ ...p, children_names: [...p.children_names] })),
    [],
  );
}

// Reconciled for Slice 3: derives from the real Academics classes store (`store.classes`,
// seeded from `lib/mock/fixtures.ts#mockClasses`) instead of a separate placeholder fixture,
// so a class created via Academics immediately appears in the student form's dropdown.
export function listClassOptions(): Promise<ClassOptionVM[]> {
  return simulate(
    store.classes.map((c) => ({ id: c.id, name: c.name, level: c.level })),
    [],
  );
}
