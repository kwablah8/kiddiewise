import { store } from "@/lib/mock/store";
import {
  studentCreateSchema,
  studentUpdateSchema,
  parentCreateSchema,
  linkGuardianSchema,
  type StudentCreateInput,
  type StudentUpdateInput,
  type ParentCreateInput,
  type LinkGuardianInput,
} from "@/lib/validators/people";

type StudentRecord = (typeof store)["students"][number];

// SEAM: becomes a Server Action calling Supabase; signature + validation stay identical.
export async function createStudent(input: StudentCreateInput): Promise<{ id: string }> {
  const data = studentCreateSchema.parse(input);
  if (store.admissionExists(data.admission_no)) {
    throw new Error("A student with this admission number already exists.");
  }
  const id = crypto.randomUUID();
  const cls = data.class_id ? store.classes.find((c) => c.id === data.class_id) : null;
  // SEAM: guardian_ids is validated above but not auto-linked here — the real
  // student_guardians join needs relationship/is_primary per guardian, which a bare id list
  // doesn't carry. The UI links each selected parent via linkGuardian after creation succeeds.
  store.addStudent({
    id,
    admission_no: data.admission_no,
    first_name: data.first_name,
    last_name: data.last_name,
    date_of_birth: data.date_of_birth,
    gender: data.gender,
    photo_url: data.photo_url,
    enrollment_status: data.enrollment_status,
    class_id: data.class_id,
    class_name: cls?.name ?? null,
    guardians: [],
  });
  return { id };
}

// SEAM: becomes a Server Action calling Supabase; signature + validation stay identical.
export async function updateStudent(input: StudentUpdateInput): Promise<{ id: string }> {
  const data = studentUpdateSchema.parse(input);
  if (data.admission_no !== undefined && store.admissionExists(data.admission_no, data.id)) {
    throw new Error("A student with this admission number already exists.");
  }

  // Build the patch from only the fields actually present in `data` — spreading a raw partial
  // (with explicit `undefined`s for untouched fields) into the store record would clobber
  // existing values, since `{...record, ...patch}` overwrites on any own key, undefined or not.
  const patch: Partial<StudentRecord> = {};
  if (data.first_name !== undefined) patch.first_name = data.first_name;
  if (data.last_name !== undefined) patch.last_name = data.last_name;
  if (data.date_of_birth !== undefined) patch.date_of_birth = data.date_of_birth;
  if (data.gender !== undefined) patch.gender = data.gender;
  if (data.admission_no !== undefined) patch.admission_no = data.admission_no;
  if (data.photo_url !== undefined) patch.photo_url = data.photo_url;
  if (data.enrollment_status !== undefined) patch.enrollment_status = data.enrollment_status;
  if (data.class_id !== undefined) {
    // Assigning a class here models "assigning a class creates the enrollment" (05-FLOWS §2).
    patch.class_id = data.class_id;
    const cls = data.class_id ? store.classes.find((c) => c.id === data.class_id) : null;
    patch.class_name = cls?.name ?? null;
  }
  // SEAM: guardian_ids, same as createStudent — guardian links are mutated via linkGuardian.

  store.updateStudent(data.id, patch);
  return { id: data.id };
}

// SEAM: becomes a Server Action calling Supabase; signature + validation stay identical.
export async function createParent(input: ParentCreateInput): Promise<{ id: string }> {
  const data = parentCreateSchema.parse(input);
  const id = crypto.randomUUID();
  // SEAM: real path provisions an auth account via Edge Function `provision-user`; here it just
  // adds a parent record.
  store.addParent({
    id,
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    phone: data.phone,
    children_names: [],
  });
  return { id };
}

// SEAM: becomes a Server Action calling Supabase; signature + validation stay identical.
export async function linkGuardian(input: LinkGuardianInput): Promise<{ ok: true }> {
  const data = linkGuardianSchema.parse(input);
  const student = store.students.find((s) => s.id === data.student_id);
  if (!student) throw new Error("Student not found.");
  const parent = store.parents.find((p) => p.id === data.parent_profile_id);
  if (!parent) throw new Error("Parent not found.");

  store.linkGuardian(data.student_id, {
    parent_profile_id: parent.id,
    name: `${parent.first_name} ${parent.last_name}`,
    email: parent.email,
    relationship: data.relationship,
    is_primary: data.is_primary,
  });
  return { ok: true };
}
