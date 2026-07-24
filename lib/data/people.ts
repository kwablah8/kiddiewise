import { simulate } from "./_devState";
import { store } from "@/lib/mock/store";
import { computeStudentStats } from "@/lib/students";
import type {
  StudentListItemVM,
  StudentDetailVM,
  ParentListItemVM,
  ClassOptionVM,
  StudentStatsVM,
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
