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
  const admission_no = data.admission_no.trim() || store.nextAdmissionNo();
  if (store.admissionExists(admission_no)) {
    throw new Error("A student with this admission number already exists.");
  }
  const id = crypto.randomUUID();
  const cls = data.class_id ? store.classes.find((c) => c.id === data.class_id) : null;
  // SEAM: guardian_ids is validated above but not auto-linked here — the real
  // student_guardians join needs relationship/is_primary per guardian, which a bare id list
  // doesn't carry. The UI links each selected parent via linkGuardian after creation succeeds.
  store.addStudent({
    id,
    admission_no,
    first_name: data.first_name,
    last_name: data.last_name,
    other_names: data.other_names,
    date_of_birth: data.date_of_birth,
    gender: data.gender,
    blood_group: data.blood_group,
    enrollment_date: data.enrollment_date,
    photo_url: data.photo_url,
    enrollment_status: data.enrollment_status,
    class_id: data.class_id,
    class_name: cls?.name ?? null,
    medical_conditions: data.medical_conditions,
    allergies: data.allergies,
    prev_school_name: data.prev_school_name,
    prev_class_ended: data.prev_class_ended,
    prev_average_score: data.prev_average_score,
    prev_year_attended: data.prev_year_attended,
    email: data.email,
    phone: data.phone,
    address: data.address,
    city: data.city,
    town: data.town,
    initial_academic_year_id: data.initial_academic_year_id,
    initial_term_id: data.initial_term_id,
    guardians: [],
  });
  // Inline new guardian: create a parent + link as primary, only if it's filled enough to be real.
  const g = data.new_guardian;
  if (g && g.first_name && g.last_name && g.email && /.+@.+\..+/.test(g.email)) {
    const { id: parentId } = await createParent({
      first_name: g.first_name,
      last_name: g.last_name,
      email: g.email,
      phone: g.phone || null,
      occupation: g.occupation || null,
    });
    await linkGuardian({
      student_id: id,
      parent_profile_id: parentId,
      relationship: g.relationship ?? "guardian",
      is_primary: true,
    });
  }
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
  // Nullable fields resolve to `null` (never `undefined`) under `.partial()`'s
  // `.nullable().default(null)`, so assign them directly (mirrors updateClass/updateStaff).
  patch.other_names = data.other_names;
  patch.blood_group = data.blood_group;
  patch.enrollment_date = data.enrollment_date;
  patch.medical_conditions = data.medical_conditions;
  patch.allergies = data.allergies;
  patch.prev_school_name = data.prev_school_name;
  patch.prev_class_ended = data.prev_class_ended;
  patch.prev_average_score = data.prev_average_score;
  patch.prev_year_attended = data.prev_year_attended;
  patch.email = data.email;
  patch.phone = data.phone;
  patch.address = data.address;
  patch.city = data.city;
  patch.town = data.town;
  patch.initial_academic_year_id = data.initial_academic_year_id;
  patch.initial_term_id = data.initial_term_id;
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
    occupation: data.occupation,
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
    occupation: parent.occupation,
    relationship: data.relationship,
    is_primary: data.is_primary,
  });
  return { ok: true };
}
