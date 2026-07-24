import { store } from "@/lib/mock/store";
import {
  academicYearCreateSchema,
  termCreateSchema,
  classCreateSchema,
  classUpdateSchema,
  subjectCreateSchema,
  subjectUpdateSchema,
  staffCreateSchema,
  staffUpdateSchema,
  assignSubjectSchema,
  type AcademicYearCreateInput,
  type TermCreateInput,
  type ClassCreateInput,
  type ClassUpdateInput,
  type SubjectCreateInput,
  type StaffCreateInput,
  type AssignSubjectInput,
} from "@/lib/validators/academics";
import { z } from "zod";

type ClassRecord = (typeof store)["classes"][number];
type SubjectRecord = (typeof store)["subjects"][number];
type StaffRecord = (typeof store)["staff"][number];

// SEAM: becomes a Server Action calling Supabase; signature + validation stay identical. New
// years are created inactive — an explicit setActiveYear call is required to activate one.
export async function createYear(input: AcademicYearCreateInput): Promise<{ id: string }> {
  const data = academicYearCreateSchema.parse(input);
  const id = crypto.randomUUID();
  store.addYear({
    id,
    name: data.name,
    start_date: data.start_date,
    end_date: data.end_date,
    is_active: false,
  });
  return { id };
}

// SEAM: becomes a Server Action calling Supabase; signature + validation stay identical.
export async function createTerm(input: TermCreateInput): Promise<{ id: string }> {
  const data = termCreateSchema.parse(input);
  if (!store.academicYears.some((y) => y.id === data.academic_year_id)) {
    throw new Error("Academic year not found.");
  }
  const id = crypto.randomUUID();
  store.addTerm({
    id,
    academic_year_id: data.academic_year_id,
    name: data.name,
    ordinal: data.ordinal,
    start_date: data.start_date,
    end_date: data.end_date,
    is_active: false,
  });
  return { id };
}

// SEAM: becomes a Server Action calling Supabase; signature + validation stay identical.
// Enforces the single-active-year invariant (mirrors the DB partial-unique index).
export async function setActiveYear(input: { id: string }): Promise<{ id: string }> {
  if (!store.academicYears.some((y) => y.id === input.id)) {
    throw new Error("Academic year not found.");
  }
  store.setActiveYear(input.id);
  return { id: input.id };
}

// SEAM: becomes a Server Action calling Supabase; signature + validation stay identical.
// Enforces the single-active-term invariant and that the term belongs to a real year.
export async function setActiveTerm(input: { id: string }): Promise<{ id: string }> {
  const term = store.terms.find((t) => t.id === input.id);
  if (!term) throw new Error("Term not found.");
  if (!store.academicYears.some((y) => y.id === term.academic_year_id)) {
    throw new Error("This term's academic year no longer exists.");
  }
  store.setActiveTerm(input.id);
  return { id: input.id };
}

// SEAM: becomes a Server Action calling Supabase; signature + validation stay identical.
export async function createClass(input: ClassCreateInput): Promise<{ id: string }> {
  const data = classCreateSchema.parse(input);
  if (data.class_teacher_id && !store.staff.some((s) => s.id === data.class_teacher_id)) {
    throw new Error("Class teacher not found.");
  }
  const id = crypto.randomUUID();
  store.addClass({
    id,
    name: data.name,
    level: data.level,
    capacity: data.capacity ?? null,
    class_teacher_id: data.class_teacher_id ?? null,
  });
  return { id };
}

// SEAM: becomes a Server Action calling Supabase; signature + validation stay identical.
export async function updateClass(input: ClassUpdateInput): Promise<{ id: string }> {
  const data = classUpdateSchema.parse(input);
  if (data.class_teacher_id && !store.staff.some((s) => s.id === data.class_teacher_id)) {
    throw new Error("Class teacher not found.");
  }
  // Build the patch from only the fields actually present — spreading a raw partial (with
  // explicit `undefined`s for untouched fields) into the store record would clobber existing
  // values, since `{...record, ...patch}` overwrites on any own key, undefined or not.
  //
  // NOTE: `capacity`/`class_teacher_id` carry `.nullable().default(null)` on the base
  // classCreateSchema, so under `.partial()` they never parse to `undefined` — an omitted key
  // resolves to `null`, same as an explicit `null`. There is no "untouched" state for these two
  // fields to detect; they are always taken from `data` (full-form-submission semantics, which
  // matches how the edit form actually calls this — RHF submits every registered field).
  const patch: Partial<ClassRecord> = {
    capacity: data.capacity,
    class_teacher_id: data.class_teacher_id,
  };
  if (data.name !== undefined) patch.name = data.name;
  if (data.level !== undefined) patch.level = data.level;
  store.updateClass(data.id, patch);
  return { id: data.id };
}

// SEAM: becomes a Server Action calling Supabase; signature + validation stay identical.
// Rejects a duplicate subject name, case-insensitive (mirrors the DB unique(school_id, name)).
export async function createSubject(input: SubjectCreateInput): Promise<{ id: string }> {
  const data = subjectCreateSchema.parse(input);
  if (store.subjectNameExists(data.name)) {
    throw new Error("A subject with this name already exists.");
  }
  const id = crypto.randomUUID();
  store.addSubject({ id, name: data.name, code: data.code ?? null });
  return { id };
}

// SEAM: becomes a Server Action calling Supabase; signature + validation stay identical.
export async function updateSubject(
  input: z.infer<typeof subjectUpdateSchema>,
): Promise<{ id: string }> {
  const data = subjectUpdateSchema.parse(input);
  if (data.name !== undefined && store.subjectNameExists(data.name, data.id)) {
    throw new Error("A subject with this name already exists.");
  }
  // NOTE: `code` carries `.nullable().default(null)` on subjectCreateSchema, so under
  // `.partial()` it never parses to `undefined` (see the identical note in updateClass above)
  // — always taken from `data`.
  const patch: Partial<SubjectRecord> = { code: data.code };
  if (data.name !== undefined) patch.name = data.name;
  store.updateSubject(data.id, patch);
  return { id: data.id };
}

// SEAM: becomes a Server Action calling Supabase; signature + validation stay identical.
// staff_no is auto-assigned server-side (never client input) — mirrors nextStaffNo()'s
// max-existing+1 rule. Real path additionally provisions an auth account via Edge Function
// `provision-user`; here it just adds a staff (profiles role='teacher') record.
export async function createStaff(input: StaffCreateInput): Promise<{ id: string }> {
  const data = staffCreateSchema.parse(input);
  const id = crypto.randomUUID();
  const staff_no = store.nextStaffNo(data.role);
  store.addStaff({
    id,
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    role: data.role,
    phone: data.phone ?? null,
    position: data.position ?? null,
    staff_no,
    department: data.department ?? null,
    gender: data.gender ?? null,
    date_of_birth: data.date_of_birth ?? null,
    hire_date: data.hire_date ?? null,
    qualification: data.qualification ?? null,
    is_active: true,
  });
  return { id };
}

// SEAM: becomes a Server Action calling Supabase; signature + validation stay identical.
// staff_no is immutable post-create (not part of staffUpdateSchema).
export async function updateStaff(
  input: z.infer<typeof staffUpdateSchema>,
): Promise<{ id: string }> {
  const data = staffUpdateSchema.parse(input);
  // NOTE: `phone`/`department` carry `.nullable().default(null)` on staffCreateSchema, so under
  // `.partial()` they never parse to `undefined` (see the identical note in updateClass above)
  // — always taken from `data`.
  // `role` + the nullable `.default(null)` fields never parse to `undefined` under `.partial()`
  // (same note as above), so they're always taken from `data` — the form always submits them.
  const patch: Partial<StaffRecord> = {
    role: data.role,
    phone: data.phone,
    position: data.position,
    department: data.department,
    gender: data.gender,
    date_of_birth: data.date_of_birth,
    hire_date: data.hire_date,
    qualification: data.qualification,
  };
  if (data.first_name !== undefined) patch.first_name = data.first_name;
  if (data.last_name !== undefined) patch.last_name = data.last_name;
  if (data.email !== undefined) patch.email = data.email;
  store.updateStaff(data.id, patch);
  return { id: data.id };
}

// SEAM: becomes a Server Action calling Supabase; signature + validation stay identical.
// Rejects a duplicate (class_id, subject_id) pairing (mirrors the DB unique constraint).
export async function assignSubject(input: AssignSubjectInput): Promise<{ id: string }> {
  const data = assignSubjectSchema.parse(input);
  if (!store.classes.some((c) => c.id === data.class_id)) throw new Error("Class not found.");
  if (!store.subjects.some((s) => s.id === data.subject_id)) {
    throw new Error("Subject not found.");
  }
  if (data.teacher_id && !store.staff.some((s) => s.id === data.teacher_id)) {
    throw new Error("Teacher not found.");
  }
  if (store.assignmentExists(data.class_id, data.subject_id)) {
    throw new Error("This subject is already assigned to this class.");
  }
  const id = crypto.randomUUID();
  store.assignSubject({
    id,
    class_id: data.class_id,
    subject_id: data.subject_id,
    teacher_id: data.teacher_id ?? null,
  });
  return { id };
}

// SEAM: becomes a Server Action calling Supabase; signature + validation stay identical.
export async function unassign(input: { id: string }): Promise<{ ok: true }> {
  store.unassign(input.id);
  return { ok: true };
}
