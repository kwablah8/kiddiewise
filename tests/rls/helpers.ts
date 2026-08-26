import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Service-role client, bypasses RLS. Seeding/teardown only. */
export const admin = (): SupabaseClient => createClient(URL, SERVICE);

/** Anonymous (unauthenticated) client, subject to `anon` policies. */
export const anon = (): SupabaseClient => createClient(URL, ANON);

/** A client authenticated as a real user, every query runs under RLS. */
export async function signInAs(email: string, password = "Password123!") {
  const c = createClient(URL, ANON);
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return c;
}

export interface Seeded {
  schoolA: string;
  schoolB: string;
  adminA: string;
  teacherA: string;
  parentA: string;
  adminAEmail: string;
  teacherAEmail: string;
  parentAEmail: string;
  studentA1: string; // enrolled in classA, teacherA teaches it, parentA is guardian
  studentA2: string; // enrolled in a class teacherA does NOT teach
  classA_taught: string;
  classA_untaught: string;
  subjectA: string;
}

async function makeUser(db: SupabaseClient, email: string) {
  const { data, error } = await db.auth.admin.createUser({
    email,
    password: "Password123!",
    email_confirm: true,
  });
  if (error) throw error;
  return data.user!.id;
}

// Each call to seedTwoSchools() must mint identities (auth emails, school slugs) that are
// unique across the whole `pnpm test:rls` run, not just within one test file, every test
// file's `beforeAll` calls seedTwoSchools() against the same, un-reset database. A monotonic
// counter guarantees uniqueness within a single module instance/process; a random suffix
// guarantees uniqueness across the separate module instances Vitest spins up per test file
// (test files do not share module-level state with each other).
let seedCounter = 0;

function uniqueToken(): string {
  seedCounter += 1;
  return `${Date.now()}-${seedCounter}-${crypto.randomUUID().slice(0, 8)}`;
}

/** Build two fully isolated schools with all roles + academic data. Safe to call once per
 *  test file (each call mints fresh, unique identities) against a single `db:reset` database
 *  shared by the whole `pnpm test:rls` run. */
export async function seedTwoSchools(): Promise<Seeded> {
  const db = admin();
  const token = uniqueToken();
  const adminAEmail = `rls-admin-${token}@test.dev`;
  const teacherAEmail = `rls-teacher-${token}@test.dev`;
  const parentAEmail = `rls-parent-${token}@test.dev`;

  const uid = { adminA: "", teacherA: "", parentA: "" };
  uid.adminA = await makeUser(db, adminAEmail);
  uid.teacherA = await makeUser(db, teacherAEmail);
  uid.parentA = await makeUser(db, parentAEmail);

  const ins = async <T>(table: string, row: Record<string, unknown>): Promise<T> => {
    const { data, error } = await db.from(table).insert(row).select().single();
    if (error) throw new Error(`${table}: ${error.message}`);
    return data as T;
  };

  const schoolA = (
    await ins<{ id: string }>("schools", { name: "School A", slug: `a-${token}` })
  ).id;
  const schoolB = (
    await ins<{ id: string }>("schools", { name: "School B", slug: `b-${token}` })
  ).id;

  await db.from("profiles").insert([
    {
      id: uid.adminA,
      school_id: schoolA,
      role: "school_admin",
      first_name: "Ad",
      last_name: "A",
      email: adminAEmail,
    },
    {
      id: uid.teacherA,
      school_id: schoolA,
      role: "teacher",
      first_name: "Te",
      last_name: "A",
      email: teacherAEmail,
    },
    {
      id: uid.parentA,
      school_id: schoolA,
      role: "parent",
      first_name: "Pa",
      last_name: "A",
      email: parentAEmail,
    },
  ]);

  const year = (
    await ins<{ id: string }>("academic_years", {
      school_id: schoolA,
      name: "2026/2027",
      start_date: "2026-09-01",
      end_date: "2027-07-31",
      is_active: true,
    })
  ).id;
  // term id isn't needed by the seed itself, tests look up the active term for their own
  // school via `.eq("is_active", true)` once signed in.
  await ins<{ id: string }>("terms", {
    school_id: schoolA,
    academic_year_id: year,
    name: "First Term",
    ordinal: 1,
    start_date: "2026-09-01",
    end_date: "2026-12-20",
    is_active: true,
  });

  const subjectA = (
    await ins<{ id: string }>("subjects", { school_id: schoolA, name: "Mathematics" })
  ).id;
  const classTaught = (
    await ins<{ id: string }>("classes", { school_id: schoolA, name: "Basic 1", level: "Primary" })
  ).id;
  const classUntaught = (
    await ins<{ id: string }>("classes", { school_id: schoolA, name: "Basic 2", level: "Primary" })
  ).id;
  // teacherA teaches Maths in classTaught only
  await db.from("class_subjects").insert({
    school_id: schoolA,
    class_id: classTaught,
    subject_id: subjectA,
    teacher_id: uid.teacherA,
  });

  const s1 = (
    await ins<{ id: string }>("students", {
      school_id: schoolA,
      admission_no: "A-1",
      first_name: "Kofi",
      last_name: "One",
      date_of_birth: "2015-01-01",
      gender: "male",
    })
  ).id;
  const s2 = (
    await ins<{ id: string }>("students", {
      school_id: schoolA,
      admission_no: "A-2",
      first_name: "Akua",
      last_name: "Two",
      date_of_birth: "2015-02-02",
      gender: "female",
    })
  ).id;
  await db.from("enrollments").insert([
    { school_id: schoolA, student_id: s1, class_id: classTaught, academic_year_id: year },
    { school_id: schoolA, student_id: s2, class_id: classUntaught, academic_year_id: year },
  ]);
  // parentA is guardian of s1 only
  await db.from("student_guardians").insert({
    school_id: schoolA,
    student_id: s1,
    parent_profile_id: uid.parentA,
    relationship: "mother",
  });

  return {
    schoolA,
    schoolB,
    adminA: uid.adminA,
    teacherA: uid.teacherA,
    parentA: uid.parentA,
    adminAEmail,
    teacherAEmail,
    parentAEmail,
    studentA1: s1,
    studentA2: s2,
    classA_taught: classTaught,
    classA_untaught: classUntaught,
    subjectA,
  };
}
