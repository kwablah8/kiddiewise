import * as fx from "./fixtures";
import type { StudentListItemVM, ParentListItemVM, GuardianVM } from "@/lib/validators/people";
import type { AcademicYearVM, TermVM, ClassVM, SubjectVM, StaffVM, AssignmentVM } from "@/lib/validators/academics";

// SEAM: in-memory only (resets on reload). Real backend replaces reads/writes in lib/data +
// lib/actions; the store shape here mirrors the tables (students + student_guardians + profiles
// + classes) closely enough that swapping in real queries is a drop-in.
type StudentRecord = Omit<StudentListItemVM, "guardian_names"> & {
  date_of_birth: string;
  guardians: GuardianVM[];
};

// Academics raw records mirror the generated `Database` row shapes (minus `school_id`/
// `created_at`); derived VM-only fields (term_count, class_teacher_name, student_count,
// subject_count, class_count, subject_name, teacher_name) are computed at read time in
// lib/data/academics.ts, never stored — so they can never go stale after a mutation.
type AcademicYearRecord = Omit<AcademicYearVM, "term_count">;
type TermRecord = TermVM;
type ClassRecord = Omit<ClassVM, "class_teacher_name" | "student_count" | "subject_count">;
type SubjectRecord = Omit<SubjectVM, "class_count">;
type StaffRecord = Omit<StaffVM, "class_count" | "subject_count">;
type AssignmentRecord = Omit<AssignmentVM, "subject_name" | "teacher_name">;

// Seed by copying (not referencing) fixtures, and deep-copy each student's guardians array so
// mutations never leak back into the shared fixture module.
const students: StudentRecord[] = fx.mockStudents.map((s) => ({
  ...s,
  guardians: s.guardians.map((g) => ({ ...g })),
}));
const parents: ParentListItemVM[] = fx.mockParents.map((p) => ({
  ...p,
  children_names: [...p.children_names],
}));
const academicYears: AcademicYearRecord[] = fx.mockAcademicYears.map((y) => ({ ...y }));
const terms: TermRecord[] = fx.mockTerms.map((t) => ({ ...t }));
const classes: ClassRecord[] = fx.mockClasses.map((c) => ({ ...c }));
const subjects: SubjectRecord[] = fx.mockSubjects.map((s) => ({ ...s }));
const staff: StaffRecord[] = fx.mockStaff.map((s) => ({ ...s }));
const classSubjects: AssignmentRecord[] = fx.mockClassSubjects.map((a) => ({ ...a }));

export const store = {
  students,
  parents,
  classes,
  academicYears,
  terms,
  subjects,
  staff,
  classSubjects,

  addStudent(rec: StudentRecord) {
    students.unshift(rec);
  },
  updateStudent(id: string, patch: Partial<StudentRecord>) {
    const i = students.findIndex((s) => s.id === id);
    if (i >= 0) students[i] = { ...students[i]!, ...patch };
  },
  admissionExists(no: string, exceptId?: string) {
    return students.some((s) => s.admission_no === no && s.id !== exceptId);
  },
  addParent(p: ParentListItemVM) {
    parents.unshift(p);
  },
  linkGuardian(studentId: string, g: GuardianVM) {
    const s = students.find((x) => x.id === studentId);
    if (!s) return;
    // Single-primary invariant: a student has at most one primary guardian. When a new link is
    // marked primary, demote any existing primaries. (At integration the real path enforces this
    // via a partial unique index on student_guardians(student_id) WHERE is_primary, or in the action.)
    if (g.is_primary) {
      for (const existing of s.guardians) existing.is_primary = false;
    }
    if (!s.guardians.some((x) => x.parent_profile_id === g.parent_profile_id)) {
      s.guardians.push(g);
    }
    // Keep the parent's children_names in sync — the real backend derives both sides of this
    // relationship from the same student_guardians join, so a link changes what both
    // `getStudent`/`listStudents` AND `listParents` return (mirrored by useLinkGuardian
    // invalidating both `students` and `parents` query keys).
    const p = parents.find((x) => x.id === g.parent_profile_id);
    const fullName = `${s.first_name} ${s.last_name}`;
    if (p && !p.children_names.includes(fullName)) {
      p.children_names.push(fullName);
    }
  },

  // ---- Academics -----------------------------------------------------------

  addYear(rec: AcademicYearRecord) {
    academicYears.unshift(rec);
  },
  // Single-active-year invariant (mirrors the DB partial-unique index on
  // academic_years(school_id) WHERE is_active): setting one active demotes all others.
  setActiveYear(id: string) {
    for (const y of academicYears) y.is_active = y.id === id;
  },
  addTerm(rec: TermRecord) {
    terms.unshift(rec);
  },
  // Single-active-term invariant (same partial-unique-index pattern as years, scoped to the
  // whole school — a school has exactly one "current" term regardless of which year it's in).
  setActiveTerm(id: string) {
    for (const t of terms) t.is_active = t.id === id;
  },

  addClass(rec: ClassRecord) {
    classes.unshift(rec);
  },
  updateClass(id: string, patch: Partial<ClassRecord>) {
    const i = classes.findIndex((c) => c.id === id);
    if (i >= 0) classes[i] = { ...classes[i]!, ...patch };
  },

  subjectNameExists(name: string, exceptId?: string) {
    const needle = name.trim().toLowerCase();
    return subjects.some((s) => s.name.trim().toLowerCase() === needle && s.id !== exceptId);
  },
  addSubject(rec: SubjectRecord) {
    subjects.unshift(rec);
  },
  updateSubject(id: string, patch: Partial<SubjectRecord>) {
    const i = subjects.findIndex((s) => s.id === id);
    if (i >= 0) subjects[i] = { ...subjects[i]!, ...patch };
  },

  // staff_no auto-assign: TCH-<n> where n = max existing numeric suffix + 1.
  nextStaffNo() {
    const max = staff.reduce((acc, s) => {
      const match = /^TCH-(\d+)$/.exec(s.staff_no);
      const n = match ? Number(match[1]) : 0;
      return Math.max(acc, n);
    }, 0);
    return `TCH-${max + 1}`;
  },
  addStaff(rec: StaffRecord) {
    staff.unshift(rec);
  },
  updateStaff(id: string, patch: Partial<StaffRecord>) {
    const i = staff.findIndex((s) => s.id === id);
    if (i >= 0) staff[i] = { ...staff[i]!, ...patch };
  },

  assignmentExists(classId: string, subjectId: string) {
    return classSubjects.some((a) => a.class_id === classId && a.subject_id === subjectId);
  },
  assignSubject(rec: AssignmentRecord) {
    classSubjects.unshift(rec);
  },
  unassign(id: string) {
    const i = classSubjects.findIndex((a) => a.id === id);
    if (i >= 0) classSubjects.splice(i, 1);
  },
};
