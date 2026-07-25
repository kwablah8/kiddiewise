/**
 * Demo tenant seed — run with `pnpm seed:demo` after `pnpm db:reset`.
 *
 * Why this is a script and not `supabase/seed.sql`: login requires rows in `auth.users`, and
 * inserting those directly in SQL means hand-writing a dozen internal columns that shift between
 * Supabase versions — a `db:reset` that breaks on upgrade. The Admin API does it properly.
 *
 * Idempotent: it clears the demo tenant's rows (and its auth users) before re-inserting, so it can
 * be re-run without a full `db:reset`.
 *
 * It deliberately does NOT bypass the schema's rules — it writes through the service role, which
 * skips RLS but still honours every constraint, so a seed that succeeds proves the shape is sound.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import type { Database, TablesInsert } from "../lib/supabase/types";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SERVICE) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
}

const db = createClient<Database>(URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Fixed IDs shared with supabase/seed.sql so the two never fight over the same tenant.
const SCHOOL_ID = "00000000-0000-0000-0000-00000000501a";
const YEAR_ID = "00000000-0000-0000-0000-00000000601a";
const TERM_ID = "00000000-0000-0000-0000-00000000701a";
const PREV_YEAR_ID = "00000000-0000-0000-0000-00000000601b";

export const DEMO_PASSWORD = "Password123!";

// ---------------------------------------------------------------------------
// Dates. Everything is computed relative to today so the seeded term is always
// IN PROGRESS — a term that starts next month has no attendance history, which
// would leave the dashboard and teacher portal looking broken rather than empty.
// ---------------------------------------------------------------------------
const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const shift = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d;
};

const TERM_START = iso(shift(-60));
const TERM_END = iso(shift(60));
const YEAR_START = iso(shift(-90));
const YEAR_END = iso(shift(275));

/** The last `count` weekdays up to and including today — school doesn't sit on weekends. */
function recentSchoolDays(count: number): string[] {
  const out: string[] = [];
  for (let i = 0; out.length < count; i++) {
    const d = shift(-i);
    const day = d.getDay();
    if (day !== 0 && day !== 6) out.push(iso(d));
  }
  return out.reverse();
}

// Deterministic pseudo-random so re-seeding produces the same demo school and screenshots or
// bug reports stay comparable. Math.random() would make every run a different school.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}
const rand = rng(20260725);
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]!;

async function insert<T extends keyof Database["public"]["Tables"]>(
  table: T,
  rows: TablesInsert<T>[],
): Promise<void> {
  if (rows.length === 0) return;
  // Chunked: a few thousand attendance rows in one request exceeds the default body limit.
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from(table).insert(rows.slice(i, i + 500) as never);
    if (error) throw new Error(`insert ${String(table)}: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// People definitions
// ---------------------------------------------------------------------------
interface StaffDef {
  key: string;
  first: string;
  last: string;
  email: string;
  phone: string;
  staffNo: string;
  role: "teacher" | "school_admin";
  department: string | null;
  active: boolean;
  position: string;
  gender: Database["public"]["Enums"]["gender"];
  dob: string;
  hired: string;
  qualification: string;
}

// admin@ / teacher@ / parent@ are the memorable demo logins; the rest read as a real roster.
const STAFF: StaffDef[] = [
  { key: "adm", first: "Ama", last: "Mensah", email: "admin@slis.test", phone: "+233 24 555 0110", staffNo: "ADM-1", role: "school_admin", department: null, active: true, position: "School Administrator", gender: "female", dob: "1985-02-11", hired: "2018-01-08", qualification: "MBA Educational Management" },
  { key: "t1", first: "Efua", last: "Owusu", email: "teacher@slis.test", phone: "+233 24 100 1001", staffNo: "TCH-1", role: "teacher", department: "Mathematics", active: true, position: "Head Teacher", gender: "female", dob: "1982-05-14", hired: "2016-09-01", qualification: "M.Ed Mathematics" },
  { key: "t2", first: "Kwabena", last: "Adjei", email: "kwabena.adjei@slis.test", phone: "+233 24 100 1002", staffNo: "TCH-2", role: "teacher", department: "Languages", active: true, position: "Class Teacher", gender: "male", dob: "1988-11-03", hired: "2019-09-01", qualification: "B.Ed English" },
  { key: "t3", first: "Abena", last: "Sarpong", email: "abena.sarpong@slis.test", phone: "+233 24 100 1003", staffNo: "TCH-3", role: "teacher", department: "Science", active: true, position: "Class Teacher", gender: "female", dob: "1990-07-22", hired: "2020-01-13", qualification: "BSc Biology, PGDE" },
  { key: "t4", first: "Kojo", last: "Boateng", email: "kojo.boateng@slis.test", phone: "+233 24 100 1004", staffNo: "TCH-4", role: "teacher", department: "Social Studies", active: true, position: "Class Teacher", gender: "male", dob: "1986-03-30", hired: "2017-09-04", qualification: "B.A Social Studies" },
  { key: "t5", first: "Akosua", last: "Danso", email: "akosua.danso@slis.test", phone: "+233 24 100 1005", staffNo: "TCH-5", role: "teacher", department: "Creative Arts", active: true, position: "Subject Teacher", gender: "female", dob: "1993-09-17", hired: "2022-09-05", qualification: "Diploma in Basic Education" },
  // Inactive on purpose: staff screens must handle a teacher who teaches nothing.
  { key: "t6", first: "Yaw", last: "Nkrumah", email: "yaw.nkrumah@slis.test", phone: "+233 24 100 1006", staffNo: "TCH-6", role: "teacher", department: "No Department", active: false, position: "Subject Teacher", gender: "male", dob: "1979-12-01", hired: "2015-09-01", qualification: "Cert. A Education" },
];

interface ParentDef {
  key: string;
  first: string;
  last: string;
  email: string;
  phone: string;
  occupation: string;
}

const PARENTS: ParentDef[] = [
  { key: "p1", first: "Yaw", last: "Mensah", email: "parent@slis.test", phone: "+233 24 111 2222", occupation: "Accountant" },
  { key: "p2", first: "Adwoa", last: "Asante", email: "adwoa.asante@example.com", phone: "+233 24 111 2223", occupation: "Trader" },
  { key: "p3", first: "Kofi", last: "Boateng", email: "kofi.boateng@example.com", phone: "+233 24 111 2224", occupation: "Civil Engineer" },
  { key: "p4", first: "Esi", last: "Owusu", email: "esi.owusu@example.com", phone: "+233 24 111 2225", occupation: "Nurse" },
  { key: "p5", first: "Kwesi", last: "Darko", email: "kwesi.darko@example.com", phone: "+233 24 111 2226", occupation: "Teacher" },
  { key: "p6", first: "Afia", last: "Frimpong", email: "afia.frimpong@example.com", phone: "+233 24 111 2227", occupation: "Seamstress" },
  { key: "p7", first: "Nana", last: "Antwi", email: "nana.antwi@example.com", phone: "+233 24 111 2228", occupation: "Driver" },
  { key: "p8", first: "Akua", last: "Kusi", email: "akua.kusi@example.com", phone: "+233 24 111 2229", occupation: "Pharmacist" },
];

const SUBJECTS = [
  { key: "math", name: "Mathematics", code: "MATH" },
  { key: "eng", name: "English Language", code: "ENG" },
  { key: "sci", name: "Integrated Science", code: "SCI" },
  { key: "soc", name: "Social Studies", code: "SOC" },
  { key: "fre", name: "French", code: null },
  { key: "rme", name: "Religious and Moral Education", code: "RME" },
  { key: "ict", name: "Information and Communication Technology", code: "ICT" },
  { key: "art", name: "Creative Arts", code: null },
];

const CLASSES = [
  { key: "b1", name: "Basic 1", level: "Primary", capacity: 30, teacher: "t1" },
  { key: "b2", name: "Basic 2", level: "Primary", capacity: 30, teacher: "t2" },
  { key: "b3", name: "Basic 3", level: "Primary", capacity: 32, teacher: "t3" },
  { key: "j1", name: "JHS 1", level: "JHS", capacity: 35, teacher: "t4" },
  { key: "j2", name: "JHS 2", level: "JHS", capacity: null, teacher: null },
  { key: "j3", name: "JHS 3", level: "JHS", capacity: 35, teacher: "t5" },
];

const FIRST_NAMES_M = ["Kwame", "Kofi", "Yaw", "Kwesi", "Kojo", "Nana", "Fiifi", "Ato"];
const FIRST_NAMES_F = ["Ama", "Akosua", "Adwoa", "Efua", "Abena", "Akua", "Esi", "Afia"];
const LAST_NAMES = ["Asante", "Boateng", "Owusu", "Mensah", "Darko", "Frimpong", "Antwi", "Kusi", "Adjei", "Sarpong", "Danso", "Appiah"];
const BLOOD: Database["public"]["Enums"]["blood_group"][] = ["A+", "A-", "B+", "O+", "O-", "AB+"];
const CITIES = ["Accra", "Tema", "Kumasi", "Koforidua"];
const TOWNS = ["Oyarifa", "Adenta", "Madina", "Ashaley Botwe"];

// ---------------------------------------------------------------------------
// Teardown — clear the demo tenant so the script is re-runnable
// ---------------------------------------------------------------------------
async function wipe(): Promise<void> {
  // Child-to-parent order. Most FKs cascade from students/schools, but being explicit keeps the
  // script working if a future migration changes a cascade to a restrict.
  const tables = [
    "payments", "invoice_items", "invoices", "extra_fee_assignments", "extra_fee_items",
    "fee_items", "terminal_reports", "results", "assessments", "attendance",
    "student_guardians", "enrollments", "students", "class_subjects", "classes", "subjects",
    "grade_bands", "assessment_types", "activity_log", "announcements", "events",
    "admissions_inquiries",
  ] as const;

  for (const t of tables) {
    const { error } = await db.from(t).delete().eq("school_id", SCHOOL_ID);
    if (error) throw new Error(`wipe ${t}: ${error.message}`);
  }

  // The school points at its active year/term, so clear those references before deleting terms.
  await db.from("schools").update({ active_academic_year_id: null, active_term_id: null }).eq("id", SCHOOL_ID);
  await db.from("terms").delete().eq("school_id", SCHOOL_ID);
  await db.from("academic_years").delete().eq("school_id", SCHOOL_ID);

  // Collect this tenant's user ids BEFORE deleting the profiles that identify them.
  const { data: tenantProfiles } = await db.from("profiles").select("id").eq("school_id", SCHOOL_ID);
  const tenantUserIds = new Set((tenantProfiles ?? []).map((p) => p.id));

  await db.from("profiles").delete().eq("school_id", SCHOOL_ID);

  // Auth users are matched TWO ways, because each alone leaves cruft behind:
  //   - by id, from the profiles above: catches accounts whose email has since been changed, or
  //     renamed in this script (the @kiddiewise.test → @slis.test switch would otherwise orphan
  //     every old account, and `seed:demo` without a full reset would then not clean them up).
  //   - by email, from the current lists: catches a run that failed between createUser and the
  //     profiles insert, leaving an auth user no profile points at. Without this the next run dies
  //     on "already registered".
  const demoEmails = new Set([...STAFF.map((s) => s.email), ...PARENTS.map((p) => p.email)]);
  const { data: users, error } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(`listUsers: ${error.message}`);
  for (const u of users.users) {
    if (tenantUserIds.has(u.id) || (u.email && demoEmails.has(u.email))) {
      await db.auth.admin.deleteUser(u.id);
    }
  }
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log("Clearing demo tenant…");
  await wipe();

  // --- school -------------------------------------------------------------
  const { error: schoolErr } = await db.from("schools").upsert({
    id: SCHOOL_ID,
    name: "SNAB Learners International School",
    slug: "slis",
    email: "snab.learner@gmail.com",
    phone: "+233 30 250 1234",
    address: "Oyarifa, near the Ghana Flag, Behind Rehoboth Estate, Accra, Ghana",
  });
  if (schoolErr) throw new Error(`schools: ${schoolErr.message}`);

  // --- academic years + terms --------------------------------------------
  await insert("academic_years", [
    { id: PREV_YEAR_ID, school_id: SCHOOL_ID, name: "2024/2025", start_date: iso(shift(-455)), end_date: iso(shift(-100)), is_active: false },
    { id: YEAR_ID, school_id: SCHOOL_ID, name: "2025/2026", start_date: YEAR_START, end_date: YEAR_END, is_active: true },
  ]);

  // Three terms; only the middle one brackets today, matching the single-active-term index.
  const TERM_2_ID = "00000000-0000-0000-0000-00000000701b";
  const TERM_3_ID = "00000000-0000-0000-0000-00000000701c";
  await insert("terms", [
    { id: TERM_ID, school_id: SCHOOL_ID, academic_year_id: YEAR_ID, name: "First Term", ordinal: 1, start_date: TERM_START, end_date: TERM_END, is_active: true },
    { id: TERM_2_ID, school_id: SCHOOL_ID, academic_year_id: YEAR_ID, name: "Second Term", ordinal: 2, start_date: iso(shift(75)), end_date: iso(shift(165)), is_active: false },
    { id: TERM_3_ID, school_id: SCHOOL_ID, academic_year_id: YEAR_ID, name: "Third Term", ordinal: 3, start_date: iso(shift(180)), end_date: YEAR_END, is_active: false },
  ]);

  await db.from("schools")
    .update({ active_academic_year_id: YEAR_ID, active_term_id: TERM_ID })
    .eq("id", SCHOOL_ID);

  // --- auth users + profiles ---------------------------------------------
  console.log("Creating auth users…");
  const staffId: Record<string, string> = {};
  const parentId: Record<string, string> = {};

  async function makeUser(email: string): Promise<string> {
    const { data, error } = await db.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
    if (error) throw new Error(`createUser ${email}: ${error.message}`);
    return data.user!.id;
  }

  for (const s of STAFF) staffId[s.key] = await makeUser(s.email);
  for (const p of PARENTS) parentId[p.key] = await makeUser(p.email);

  // Every row carries the SAME key set. In a bulk insert PostgREST unifies the columns across all
  // rows and sends NULL wherever a row omitted one — it does not fall back to the column default.
  // So a staff row without `occupation` and a parent row without `is_active` would both write NULL,
  // and the not-null default on is_active would fail rather than apply.
  await insert("profiles", [
    ...STAFF.map((s): TablesInsert<"profiles"> => ({
      id: staffId[s.key]!,
      school_id: SCHOOL_ID,
      role: s.role,
      first_name: s.first,
      last_name: s.last,
      email: s.email,
      phone: s.phone,
      staff_no: s.staffNo,
      department: s.department,
      occupation: null,
      avatar_url: null,
      is_active: s.active,
      position: s.position,
      gender: s.gender,
      date_of_birth: s.dob,
      hire_date: s.hired,
      qualification: s.qualification,
    })),
    ...PARENTS.map((p): TablesInsert<"profiles"> => ({
      id: parentId[p.key]!,
      school_id: SCHOOL_ID,
      role: "parent",
      first_name: p.first,
      last_name: p.last,
      email: p.email,
      phone: p.phone,
      staff_no: null,
      department: null,
      occupation: p.occupation,
      avatar_url: null,
      is_active: true,
      position: null,
      gender: null,
      date_of_birth: null,
      hire_date: null,
      qualification: null,
    })),
  ]);

  // Seeded accounts are given a real, working password directly (DEMO_PASSWORD), so they are already
  // the holder's own — not admin-issued temporary credentials awaiting a first sign-in. Stamping
  // password_changed_at says so, which is what the Parents screen reads to show "Active".
  await db
    .from("profiles")
    .update({ must_change_password: false, password_changed_at: new Date().toISOString() })
    .eq("school_id", SCHOOL_ID);

  // --- subjects, classes, assignments ------------------------------------
  const subjectId: Record<string, string> = {};
  for (const s of SUBJECTS) {
    const { data, error } = await db.from("subjects")
      .insert({ school_id: SCHOOL_ID, name: s.name, code: s.code })
      .select("id").single();
    if (error) throw new Error(`subjects: ${error.message}`);
    subjectId[s.key] = data.id;
  }

  const classId: Record<string, string> = {};
  for (const c of CLASSES) {
    const { data, error } = await db.from("classes")
      .insert({
        school_id: SCHOOL_ID,
        name: c.name,
        level: c.level,
        capacity: c.capacity,
        class_teacher_id: c.teacher ? staffId[c.teacher]! : null,
      })
      .select("id").single();
    if (error) throw new Error(`classes: ${error.message}`);
    classId[c.key] = data.id;
  }

  // Every class gets the four core subjects. Basic 1 is deliberately loaded onto teacher@ so the
  // teacher portal has classes, subjects, a register and assessments the moment you log in.
  const CORE = ["math", "eng", "sci", "soc"] as const;
  const TEACHER_BY_SUBJECT: Record<string, string> = {
    math: "t1", eng: "t2", sci: "t3", soc: "t4", fre: "t5", rme: "t5", ict: "t3", art: "t5",
  };
  const assignments: TablesInsert<"class_subjects">[] = [];
  for (const c of CLASSES) {
    for (const sub of CORE) {
      assignments.push({
        school_id: SCHOOL_ID,
        class_id: classId[c.key]!,
        subject_id: subjectId[sub]!,
        // teacher@ (t1) takes Maths everywhere plus English in Basic 1.
        teacher_id: staffId[sub === "eng" && c.key === "b1" ? "t1" : TEACHER_BY_SUBJECT[sub]!]!,
      });
    }
    // JHS classes carry ICT and French on top of the core four.
    if (c.level === "JHS") {
      for (const sub of ["ict", "fre"] as const) {
        assignments.push({
          school_id: SCHOOL_ID,
          class_id: classId[c.key]!,
          subject_id: subjectId[sub]!,
          teacher_id: staffId[TEACHER_BY_SUBJECT[sub]!]!,
        });
      }
    }
  }
  await insert("class_subjects", assignments);

  // --- grading -----------------------------------------------------------
  await insert("grade_bands", [
    { school_id: SCHOOL_ID, min_score: 80, max_score: 100, grade: "A", remark: "Excellent" },
    { school_id: SCHOOL_ID, min_score: 70, max_score: 79, grade: "B", remark: "Very Good" },
    { school_id: SCHOOL_ID, min_score: 60, max_score: 69, grade: "C", remark: "Good" },
    { school_id: SCHOOL_ID, min_score: 50, max_score: 59, grade: "D", remark: "Credit" },
    { school_id: SCHOOL_ID, min_score: 40, max_score: 49, grade: "E", remark: "Pass" },
    { school_id: SCHOOL_ID, min_score: 0, max_score: 39, grade: "F", remark: "Fail" },
  ]);

  const typeIds: Record<string, string> = {};
  for (const t of [
    { name: "Class Test", weight: 20 },
    { name: "Mid-Term Exam", weight: 30 },
    { name: "End-of-Term Exam", weight: 50 },
  ]) {
    const { data, error } = await db.from("assessment_types")
      .insert({ school_id: SCHOOL_ID, name: t.name, weight: t.weight })
      .select("id").single();
    if (error) throw new Error(`assessment_types: ${error.message}`);
    typeIds[t.name] = data.id;
  }

  // --- students, enrollments, guardians ----------------------------------
  console.log("Creating students…");
  const classKeys = CLASSES.map((c) => c.key);
  interface Student { id: string; classKey: string; name: string }
  const students: Student[] = [];

  for (let i = 0; i < 26; i++) {
    const isMale = i % 2 === 0;
    const first = isMale ? FIRST_NAMES_M[i % FIRST_NAMES_M.length]! : FIRST_NAMES_F[i % FIRST_NAMES_F.length]!;
    const last = LAST_NAMES[i % LAST_NAMES.length]!;
    // 24 active, 1 withdrawn, 1 transferred — so status filters and stat cards have real variety.
    const status: Database["public"]["Enums"]["enrollment_status"] =
      i === 24 ? "withdrawn" : i === 25 ? "transferred" : "active";
    const classKey = classKeys[i % classKeys.length]!;

    const { data, error } = await db.from("students").insert({
      school_id: SCHOOL_ID,
      admission_no: `KID-${String(i + 1).padStart(4, "0")}`,
      first_name: first,
      last_name: last,
      date_of_birth: iso(shift(-Math.round((6 + (i % 9)) * 365.25))),
      gender: isMale ? "male" : "female",
      enrollment_status: status,
      other_names: i % 3 === 0 ? pick(FIRST_NAMES_M) : null,
      blood_group: pick(BLOOD),
      enrollment_date: iso(shift(-(400 + i * 9))),
      medical_conditions: i % 8 === 0 ? "Mild asthma" : null,
      allergies: i % 6 === 0 ? "Peanuts" : null,
      prev_school_name: i % 4 === 0 ? "Little Angels Preparatory" : null,
      prev_class_ended: i % 4 === 0 ? "KG 2" : null,
      prev_average_score: i % 4 === 0 ? `${65 + (i % 20)}%` : null,
      prev_year_attended: i % 4 === 0 ? "2023/2024" : null,
      phone: `+233 20 ${300 + i} ${1000 + i}`,
      address: `House ${i + 12}, Ridge Road`,
      city: pick(CITIES),
      town: pick(TOWNS),
      initial_academic_year_id: YEAR_ID,
      initial_term_id: TERM_ID,
    }).select("id").single();
    if (error) throw new Error(`students: ${error.message}`);

    students.push({ id: data.id, classKey, name: `${first} ${last}` });
  }

  const activeStudents = students.filter((_, i) => i < 24);

  await insert("enrollments", activeStudents.map((s): TablesInsert<"enrollments"> => ({
    school_id: SCHOOL_ID,
    student_id: s.id,
    class_id: classId[s.classKey]!,
    academic_year_id: YEAR_ID,
    status: "active",
  })));

  // parent@ (p1) guardians EXACTLY the first two students, so the parent portal opens on a
  // multi-child account with a predictable child count. The rest round-robin over p2… only —
  // including p1 in that rotation would silently hand it extra children as the roster grows.
  const otherParents = PARENTS.filter((p) => p.key !== "p1");
  const links: TablesInsert<"student_guardians">[] = [];
  students.forEach((s, i) => {
    const pkey = i < 2 ? "p1" : otherParents[i % otherParents.length]!.key;
    links.push({
      school_id: SCHOOL_ID,
      student_id: s.id,
      parent_profile_id: parentId[pkey]!,
      relationship: pick(["mother", "father", "guardian"] as const),
      is_primary: true,
    });
  });
  await insert("student_guardians", links);

  // --- assessments + results ---------------------------------------------
  console.log("Creating assessments and results…");
  const assessmentRows: { id: string; classKey: string }[] = [];
  for (const c of CLASSES) {
    for (const sub of ["math", "eng"] as const) {
      for (const [title, type, offset] of [
        ["Week 4 Class Test", "Class Test", -40],
        ["Mid-Term Examination", "Mid-Term Exam", -18],
      ] as const) {
        const { data, error } = await db.from("assessments").insert({
          school_id: SCHOOL_ID,
          class_id: classId[c.key]!,
          subject_id: subjectId[sub]!,
          term_id: TERM_ID,
          assessment_type_id: typeIds[type]!,
          title: `${title} — ${SUBJECTS.find((s) => s.key === sub)!.name}`,
          max_score: 100,
          date: iso(shift(offset)),
          created_by: staffId[sub === "math" ? "t1" : c.key === "b1" ? "t1" : "t2"]!,
        }).select("id").single();
        if (error) throw new Error(`assessments: ${error.message}`);
        assessmentRows.push({ id: data.id, classKey: c.key });
      }
    }
  }

  const BANDS = [
    { min: 80, grade: "A", remark: "Excellent" }, { min: 70, grade: "B", remark: "Very Good" },
    { min: 60, grade: "C", remark: "Good" }, { min: 50, grade: "D", remark: "Credit" },
    { min: 40, grade: "E", remark: "Pass" }, { min: 0, grade: "F", remark: "Fail" },
  ];
  const gradeFor = (score: number) => BANDS.find((b) => score >= b.min)!;

  const results: TablesInsert<"results">[] = [];
  for (const a of assessmentRows) {
    for (const s of activeStudents.filter((s) => s.classKey === a.classKey)) {
      const score = Math.round(45 + rand() * 50);
      const band = gradeFor(score);
      results.push({
        school_id: SCHOOL_ID,
        assessment_id: a.id,
        student_id: s.id,
        score,
        grade: band.grade,
        // `remark` is the grading scale's band remark; `teacher_comment` is the subject teacher's
        // own note. Two different authors, two columns (see 0019).
        remark: band.remark,
        teacher_comment:
          score >= 75 ? "Excellent grasp of the material." :
          score >= 55 ? "Good effort — revise the topics we covered in class." :
          "Needs consistent practice at home.",
        entered_by: staffId["t1"]!,
        is_submitted: true,
      });
    }
  }
  await insert("results", results);

  // --- attendance ---------------------------------------------------------
  console.log("Creating attendance…");
  const days = recentSchoolDays(30);
  const attendance: TablesInsert<"attendance">[] = [];
  for (const day of days) {
    for (const s of activeStudents) {
      const r = rand();
      // ~92% present, 4% late, 4% absent — a believable Ghanaian day school.
      const status: Database["public"]["Enums"]["attendance_status"] =
        r < 0.92 ? "present" : r < 0.96 ? "late" : "absent";
      attendance.push({
        school_id: SCHOOL_ID,
        student_id: s.id,
        class_id: classId[s.classKey]!,
        term_id: TERM_ID,
        date: day,
        status,
        marked_by: staffId["t1"]!,
      });
    }
  }
  await insert("attendance", attendance);

  // --- terminal reports ---------------------------------------------------
  // Published for Basic 1 only, so the parent portal shows a real report for parent@'s children
  // while other classes legitimately show "not published yet".
  const b1 = activeStudents.filter((s) => s.classKey === "b1");
  await insert("terminal_reports", b1.map((s): TablesInsert<"terminal_reports"> => {
    const avg = Math.round(60 + rand() * 30);
    return {
      school_id: SCHOOL_ID,
      student_id: s.id,
      class_id: classId["b1"]!,
      term_id: TERM_ID,
      academic_year_id: YEAR_ID,
      average_score: avg,
      total_score: avg * 4,
      attendance_present: 28,
      attendance_total: 30,
      class_teacher_comment: avg >= 75
        ? "A consistently strong term. Keep up the excellent work."
        : "Steady progress this term. More attention to homework will help.",
      head_teacher_comment: "Promoted to the next class.",
      is_published: true,
    };
  }));

  // --- fees ---------------------------------------------------------------
  console.log("Creating fees…");
  await insert("fee_items", CLASSES.map((c, i): TablesInsert<"fee_items"> => ({
    school_id: SCHOOL_ID,
    name: `${c.name} annual school fees`,
    amount: 1500 + i * 250,
    class_id: classId[c.key]!,
    academic_year_id: YEAR_ID,
    fee_term: "full_year",
    due_date: iso(shift(-45)),
    late_fee: 50,
    description: `Tuition and levies for ${c.name}`,
    is_mandatory: true,
  })));

  const invoiceRows: { id: string; due: number; studentId: string }[] = [];
  for (const [i, s] of activeStudents.entries()) {
    const classIndex = CLASSES.findIndex((c) => c.key === s.classKey);
    const gross = 1500 + classIndex * 250;
    // Every 7th student is on a partial scholarship; every 4th carries arrears forward.
    const scholarship = i % 7 === 0;
    const discount = scholarship ? Math.round(gross * 0.25) : 0;
    const arrears = i % 4 === 0 ? 300 : 0;
    const expected = gross - discount;

    const { data, error } = await db.from("invoices").insert({
      school_id: SCHOOL_ID,
      student_id: s.id,
      academic_year_id: YEAR_ID,
      fee_term: "full_year",
      total_amount: expected,
      discount,
      arrears,
      scholarship_type: scholarship ? "partial" : "none",
      due_date: iso(shift(-45)),
    }).select("id").single();
    if (error) throw new Error(`invoices: ${error.message}`);
    invoiceRows.push({ id: data.id, due: expected + arrears, studentId: s.id });
  }

  const METHODS: Database["public"]["Enums"]["payment_method"][] = ["cash", "bank_transfer", "mobile_money", "cheque"];
  const payments: TablesInsert<"payments">[] = [];
  invoiceRows.forEach((inv, i) => {
    const mod = i % 5; // 0,1 → paid in full · 2,3 → part payment · 4 → nothing yet
    if (mod === 4) return;
    const amount = mod <= 1 ? inv.due : Math.round(inv.due * 0.5);
    payments.push({
      school_id: SCHOOL_ID,
      invoice_id: inv.id,
      student_id: inv.studentId,
      amount,
      method: METHODS[i % METHODS.length]!,
      reference: i % 3 === 0 ? `RCT-${1000 + i}` : null,
      paid_at: new Date(shift(-(5 + (i % 50))).setHours(10, 0, 0, 0)).toISOString(),
      recorded_by: staffId["adm"]!,
    });
  });
  await insert("payments", payments);

  // Extra fees — one school-wide set, assigned to a subset of students.
  const extraDefs = [
    { name: "School Bus", description: "Return daily transport", amount: 500, frequency: "termly" as const, classKey: null },
    { name: "Feeding", description: "Hot lunch programme", amount: 600, frequency: "termly" as const, classKey: null },
    { name: "Uniform", description: "Full set (2 pairs)", amount: 200, frequency: "one_time" as const, classKey: null },
    { name: "Excursion", description: "End-of-term educational trip", amount: 400, frequency: "one_time" as const, classKey: "j1" },
    { name: "ICT Lab", description: "Computer lab maintenance", amount: 150, frequency: "annual" as const, classKey: null },
  ];
  const extraItemId: Record<string, string> = {};
  for (const e of extraDefs) {
    const { data, error } = await db.from("extra_fee_items").insert({
      school_id: SCHOOL_ID,
      name: e.name,
      description: e.description,
      amount: e.amount,
      frequency: e.frequency,
      class_id: e.classKey ? classId[e.classKey]! : null,
    }).select("id").single();
    if (error) throw new Error(`extra_fee_items: ${error.message}`);
    extraItemId[e.name] = data.id;
  }

  const extraPayments: TablesInsert<"payments">[] = [];
  for (const [i, s] of activeStudents.slice(0, 10).entries()) {
    const def = extraDefs[i % 3]!; // bus / feeding / uniform
    const { data, error } = await db.from("extra_fee_assignments").insert({
      school_id: SCHOOL_ID,
      extra_fee_item_id: extraItemId[def.name]!,
      student_id: s.id,
      amount: def.amount,
    }).select("id").single();
    if (error) throw new Error(`extra_fee_assignments: ${error.message}`);

    const mod = i % 3; // 0 → settled · 1 → half · 2 → unpaid
    if (mod === 2) continue;
    extraPayments.push({
      school_id: SCHOOL_ID,
      extra_fee_assignment_id: data.id,
      student_id: s.id,
      amount: mod === 0 ? def.amount : Math.round(def.amount / 2),
      method: METHODS[i % METHODS.length]!,
      reference: null,
      paid_at: new Date(shift(-(3 + i)).setHours(11, 0, 0, 0)).toISOString(),
      recorded_by: staffId["adm"]!,
    });
  }
  await insert("payments", extraPayments);

  // --- communication ------------------------------------------------------
  await insert("announcements", [
    { school_id: SCHOOL_ID, title: "Mid-Term Break", body: "School closes Friday and resumes the following Wednesday. Buses will run as usual on both days.", audience: "everyone", is_published: true, published_at: new Date(shift(-6)).toISOString(), created_by: staffId["adm"]! },
    { school_id: SCHOOL_ID, title: "Mid-Term Reports Released", body: "Mid-term results are now available in the parent portal. Please review them with your child.", audience: "parents", is_published: true, published_at: new Date(shift(-3)).toISOString(), created_by: staffId["adm"]! },
    { school_id: SCHOOL_ID, title: "Staff Briefing — Monday 7:30am", body: "All teaching staff to meet in the staff room before assembly.", audience: "teachers", is_published: true, published_at: new Date(shift(-1)).toISOString(), created_by: staffId["adm"]! },
    { school_id: SCHOOL_ID, title: "Speech and Prize-Giving Day", body: "Draft programme circulating for review — not yet published to parents.", audience: "everyone", is_published: false, published_at: null, created_by: staffId["adm"]! },
  ]);

  await insert("events", [
    { school_id: SCHOOL_ID, title: "PTA General Meeting", description: "Termly parent-teacher association meeting.", start_at: new Date(shift(5)).toISOString(), location: "School Hall", created_by: staffId["adm"]! },
    { school_id: SCHOOL_ID, title: "Inter-House Sports", description: "Annual athletics competition.", start_at: new Date(shift(12)).toISOString(), location: "Sports Field", created_by: staffId["adm"]! },
    { school_id: SCHOOL_ID, title: "End-of-Term Examinations Begin", description: null, start_at: new Date(shift(40)).toISOString(), location: null, created_by: staffId["adm"]! },
    { school_id: SCHOOL_ID, title: "Speech and Prize-Giving Day", description: "Closing ceremony and prize presentation.", start_at: new Date(shift(55)).toISOString(), location: "School Hall", created_by: staffId["adm"]! },
  ]);

  await insert("activity_log", [
    { school_id: SCHOOL_ID, actor_id: staffId["adm"]!, action: "recorded a fee payment", entity_type: "payment" },
    { school_id: SCHOOL_ID, actor_id: staffId["t1"]!, action: "submitted mid-term results for Basic 1", entity_type: "result" },
    { school_id: SCHOOL_ID, actor_id: staffId["t1"]!, action: "marked attendance for Basic 1", entity_type: "attendance" },
    { school_id: SCHOOL_ID, actor_id: staffId["adm"]!, action: "admitted a new student", entity_type: "student" },
    { school_id: SCHOOL_ID, actor_id: staffId["adm"]!, action: "published mid-term reports", entity_type: "terminal_report" },
    { school_id: SCHOOL_ID, actor_id: staffId["t2"]!, action: "created an assessment for Basic 2", entity_type: "assessment" },
  ]);

  await insert("admissions_inquiries", [
    { school_id: SCHOOL_ID, applicant_name: "Kwabena Osei", parent_name: "Grace Osei", parent_email: "grace.osei@example.com", parent_phone: "+233 24 777 8801", desired_class: "Basic 1", message: "Looking for a place for my son in September.", status: "new" },
    { school_id: SCHOOL_ID, applicant_name: "Naa Adjeley", parent_name: "Isaac Tetteh", parent_email: "isaac.tetteh@example.com", parent_phone: "+233 24 777 8802", desired_class: "KG 2", message: "Please send me your fee structure.", status: "new" },
    { school_id: SCHOOL_ID, applicant_name: "Selorm Agbo", parent_name: "Mawuli Agbo", parent_email: "mawuli.agbo@example.com", parent_phone: "+233 24 777 8803", desired_class: "JHS 1", message: "Relocating from Ho — is there space in JHS 1?", status: "reviewing" },
    { school_id: SCHOOL_ID, applicant_name: "Ewuresi Cudjoe", parent_name: "Patience Cudjoe", parent_email: "patience.cudjoe@example.com", parent_phone: "+233 24 777 8804", desired_class: "Basic 3", message: null, status: "accepted" },
    { school_id: SCHOOL_ID, applicant_name: "Kelvin Amoah", parent_name: "Doris Amoah", parent_email: "doris.amoah@example.com", parent_phone: null, desired_class: "Basic 2", message: "Do you offer a sibling discount?", status: "new" },
    { school_id: SCHOOL_ID, applicant_name: "Afua Nyarko", parent_name: "Samuel Nyarko", parent_email: "samuel.nyarko@example.com", parent_phone: "+233 24 777 8806", desired_class: "JHS 2", message: "Enquiring about boarding facilities.", status: "rejected" },
  ]);

  console.log(`
Demo tenant seeded: SNAB Learners International School

  Admin    admin@slis.test
  Teacher  teacher@slis.test    (Efua Owusu — class teacher, Basic 1)
  Parent   parent@slis.test     (Yaw Mensah — 2 children)

  Password for all accounts: ${DEMO_PASSWORD}

  ${STAFF.length} staff · ${PARENTS.length} parents · ${students.length} students · ${CLASSES.length} classes
  ${assessmentRows.length} assessments · ${results.length} results · ${attendance.length} attendance records
  ${invoiceRows.length} invoices · ${payments.length + extraPayments.length} payments
  Active term: First Term (${TERM_START} → ${TERM_END})
`);
}

main().catch((err) => {
  console.error(`\nSeed failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
