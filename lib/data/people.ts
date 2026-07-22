import { simulate } from "./_devState";
import { store } from "@/lib/mock/store";
import type {
  StudentListItemVM,
  StudentDetailVM,
  ParentListItemVM,
  ClassOptionVM,
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
  };
}

function matchesSearch(s: StudentRecord, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
  return fullName.includes(q) || s.admission_no.toLowerCase().includes(q);
}

export function listStudents(params: { search?: string } = {}): Promise<StudentListItemVM[]> {
  const search = params.search ?? "";
  const result = store.students.filter((s) => matchesSearch(s, search)).map(toListItemVM);
  return simulate(result, []);
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

export function listClassOptions(): Promise<ClassOptionVM[]> {
  return simulate(
    store.classes.map((c) => ({ ...c })),
    [],
  );
}
