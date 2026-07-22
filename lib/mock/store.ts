import * as fx from "./fixtures";
import type {
  StudentListItemVM,
  ParentListItemVM,
  ClassOptionVM,
  GuardianVM,
} from "@/lib/validators/people";

// SEAM: in-memory only (resets on reload). Real backend replaces reads/writes in lib/data +
// lib/actions; the store shape here mirrors the tables (students + student_guardians + profiles
// + classes) closely enough that swapping in real queries is a drop-in.
type StudentRecord = Omit<StudentListItemVM, "guardian_names"> & {
  date_of_birth: string;
  guardians: GuardianVM[];
};

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
const classes: ClassOptionVM[] = fx.mockClassOptions.map((c) => ({ ...c }));

export const store = {
  students,
  parents,
  classes,
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
};
