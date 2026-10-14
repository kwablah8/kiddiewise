/**
 * Non-teaching staff (migration 0048) hold a profile and a gate number but no portal. Every policy
 * names the roles it admits, so the role must match none of them: this is the check that adding the
 * enum value did not quietly open anything. The account is also banned at creation, so it cannot
 * sign in at all; the second group reaches the data with a live session on purpose, to prove RLS
 * would hold even if that ban were lifted.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { admin, anon, seedTwoSchools, signInAs, type Seeded } from "./helpers";

let s: Seeded;
let openEmail: string;
let bannedEmail: string;

async function makeNonTeaching(email: string, banned: boolean) {
  const db = admin();
  const { data, error } = await db.auth.admin.createUser({
    email,
    password: "Password123!",
    email_confirm: true,
    ...(banned ? { ban_duration: "876000h" } : {}),
  });
  if (error) throw error;
  const { error: pErr } = await db.from("profiles").insert({
    id: data.user!.id,
    school_id: s.schoolA,
    role: "non_teaching",
    first_name: "Non",
    last_name: "Teaching",
    email,
    staff_no: `NTS-${crypto.randomUUID().slice(0, 6)}`,
  });
  if (pErr) throw pErr;
}

beforeAll(async () => {
  s = await seedTwoSchools();
  const token = crypto.randomUUID().slice(0, 8);
  openEmail = `rls-nts-open-${token}@test.dev`;
  bannedEmail = `rls-nts-banned-${token}@test.dev`;
  await makeNonTeaching(openEmail, false);
  await makeNonTeaching(bannedEmail, true);
});

describe("non-teaching staff", () => {
  it("cannot sign in once banned at creation", async () => {
    const { error } = await anon().auth.signInWithPassword({
      email: bannedEmail,
      password: "Password123!",
    });
    expect(error).not.toBeNull();
  });

  // Class names are school-wide reference data any signed-in member can read (parents too), so they
  // are not in this list.
  it("reads no school data even with a live session", async () => {
    const nts = await signInAs(openEmail);
    for (const table of ["students", "attendance", "results", "invoices", "payments", "device_people", "device_scans"]) {
      const { data } = await nts.from(table).select("*").limit(5);
      expect(data ?? [], table).toHaveLength(0);
    }
  });

  it("cannot mark a register or add a student", async () => {
    const nts = await signInAs(openEmail);
    const mark = await nts.from("attendance").insert({
      school_id: s.schoolA,
      student_id: s.studentA1,
      class_id: s.classA_taught,
      date: "2026-09-15",
      status: "present",
    });
    expect(mark.error).not.toBeNull();

    const student = await nts.from("students").insert({
      school_id: s.schoolA,
      first_name: "X",
      last_name: "Y",
    });
    expect(student.error).not.toBeNull();
  });
});
