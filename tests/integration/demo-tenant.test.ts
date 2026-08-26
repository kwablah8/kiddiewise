/**
 * Integration checks against the seeded demo tenant.
 *
 * Unlike tests/rls (which mints throwaway schools to prove isolation in the abstract), these run
 * against the same data a developer clicks through, the tenant `pnpm seed:demo` builds. They are
 * the guard against a whole class of bug the RLS suite cannot see: a policy that is technically
 * correct but leaves a real portal with nothing to render.
 *
 * Requires: `pnpm db:seed` (or `pnpm db:reset && pnpm seed:demo`) first.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const ADMIN_EMAIL = "admin@slis.test";
const TEACHER_EMAIL = "teacher@slis.test";
const PARENT_EMAIL = "parent@slis.test";
const PASSWORD = "Password123!";

type Client = SupabaseClient<Database>;

async function signIn(email: string): Promise<Client> {
  const c = createClient<Database>(URL, ANON);
  const { error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) {
    throw new Error(
      `sign-in failed for ${email}: ${error.message}. Has \`pnpm seed:demo\` been run?`,
    );
  }
  return c;
}

// Views get a separate `.from()` overload from tables in the generated types, so this covers tables
// only; the two view assertions below query them directly.
type TableName = "students" | "classes" | "attendance" | "results" | "payments" | "invoices" | "terminal_reports";

const count = async (c: Client, table: TableName) => {
  const { count: n, error } = await c.from(table).select("id", { count: "exact", head: true });
  expect(error, `${table} read failed`).toBeNull();
  return n ?? 0;
};

let admin: Client;
let teacher: Client;
let parent: Client;

beforeAll(async () => {
  [admin, teacher, parent] = await Promise.all([
    signIn(ADMIN_EMAIL),
    signIn(TEACHER_EMAIL),
    signIn(PARENT_EMAIL),
  ]);
});

describe("admin sees the whole school", () => {
  it("reads the full roster and ledger", async () => {
    expect(await count(admin, "students")).toBe(26);
    expect(await count(admin, "classes")).toBe(6);
    expect(await count(admin, "invoices")).toBe(24);
    // 24 class-fee invoices minus the 1-in-5 left unpaid, plus the extra-fee payments.
    expect(await count(admin, "payments")).toBeGreaterThan(20);
  });

  it("dashboard_stats returns populated figures", async () => {
    const { data, error } = await admin.rpc("dashboard_stats");
    expect(error).toBeNull();
    const row = data![0]!;
    expect(row.total_students).toBe(24); // active only
    expect(row.total_staff).toBeGreaterThan(0);
    expect(Number(row.total_revenue)).toBeGreaterThan(0);
    // Attendance is seeded at roughly 96% present-or-late; assert a band, not an exact figure.
    expect(Number(row.attendance_rate)).toBeGreaterThan(80);
    expect(Number(row.attendance_rate)).toBeLessThanOrEqual(100);
  });

  it("dashboard_trends returns a row without dividing by zero", async () => {
    const { data, error } = await admin.rpc("dashboard_trends");
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    for (const v of Object.values(data![0]!)) {
      expect(Number.isFinite(Number(v))).toBe(true);
    }
  });

  it("sidebar_counts matches the seeded tenant", async () => {
    const { data, error } = await admin.rpc("sidebar_counts");
    expect(error).toBeNull();
    const row = data![0]!;
    expect(row.students).toBe(24);
    expect(row.new_inquiries).toBe(3);
  });

  it("fee positions derive paid/balance/status from payments", async () => {
    const { data, error } = await admin
      .from("student_fee_positions")
      .select("expected, arrears, paid, balance, status");
    expect(error).toBeNull();
    expect(data!.length).toBe(24);

    for (const r of data!) {
      const due = Number(r.expected) + Number(r.arrears);
      const paid = Number(r.paid);
      expect(Number(r.balance)).toBe(Math.max(0, due - paid));
      expect(r.status).toBe(paid >= due ? "paid" : paid <= 0 ? "pending" : "partial");
    }
    // The seed deliberately produces all three states so the UI's status filter has something
    // to filter. A run where every invoice landed in one bucket is a broken seed, not a pass.
    const states = new Set(data!.map((r) => r.status));
    expect(states).toEqual(new Set(["paid", "partial", "pending"]));
  });
});

describe("the school identifies itself from the database", () => {
  it("admin can read their own school's name", async () => {
    // The credentials message and the invite emails name the school. Nothing may hardcode it, a
    // literal school name is wrong for every tenant but one, and stays wrong after a rebrand.
    const { data, error } = await admin.from("schools").select("name, slug").single();
    expect(error).toBeNull();
    expect(data!.name).toBe("SNAB Learners International School");
    expect(data!.slug).toBe("slis");
  });

  it("the slug matches the SCHOOL_SLUG public enquiries resolve against", async () => {
    // publicSchoolId() falls back to "slis"; a mismatch would route every public enquiry submitted
    // from the marketing site into the wrong tenant's inbox, or fail outright.
    const { data } = await admin.from("schools").select("slug").single();
    expect(data!.slug).toBe(process.env.SCHOOL_SLUG ?? "slis");
  });
});

describe("teacher is scoped to their own classes", () => {
  it("sees fewer students than the admin, but not zero", async () => {
    const mine = await count(teacher, "students");
    expect(mine).toBeGreaterThan(0);
    expect(mine).toBeLessThan(26);
  });

  it("can read the register for classes they teach", async () => {
    expect(await count(teacher, "attendance")).toBeGreaterThan(0);
  });

  it("cannot read the school's fee ledger", async () => {
    // No teacher policy on payments → RLS yields an empty set rather than an error.
    expect(await count(teacher, "payments")).toBe(0);
  });
});

describe("parent is scoped to their own children", () => {
  it("sees exactly their two linked children", async () => {
    expect(await count(parent, "students")).toBe(2);
  });

  it("sees attendance and results only for those children", async () => {
    const { data: kids } = await parent.from("students").select("id");
    const ids = new Set((kids ?? []).map((k) => k.id));

    const { data: att } = await parent.from("attendance").select("student_id");
    expect(att!.length).toBeGreaterThan(0);
    expect(att!.every((a) => ids.has(a.student_id))).toBe(true);

    const { data: res } = await parent.from("results").select("student_id");
    expect(res!.every((r) => ids.has(r.student_id))).toBe(true);
  });

  it("sees submitted results THROUGH the assessment join the portal actually uses", async () => {
    // The portal reads results with `assessments!inner(...)`, because a score is meaningless without
    // the subject and the max it is out of. Before 0021 parents had no SELECT policy on `assessments`,
    // so this inner join returned zero rows and the results page was permanently empty, while a plain
    // `results` read passed. This asserts the real query shape against real seeded marks.
    const { data, error } = await parent
      .from("results")
      .select("score, assessments!inner(max_score, term_id, subjects(name))")
      .eq("is_submitted", true);

    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThan(0);
    expect(data!.every((r) => r.assessments?.subjects?.name)).toBe(true);
  });

  it("sees a published terminal report for their children", async () => {
    const { data, error } = await parent
      .from("terminal_reports")
      .select("is_published, class_teacher_comment");
    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThan(0);
    expect(data!.every((r) => r.is_published)).toBe(true);
  });

  it("sees their own fee balance and nobody else's", async () => {
    const { data, error } = await parent.from("student_fee_positions").select("student_id");
    expect(error).toBeNull();
    expect(data!.length).toBe(2);
  });

  it("sees the payment ledger the Fees tab renders, receipt officer and all", async () => {
    // The exact select `lib/data/fees.ts#listPayments` issues, the function the parent portal now
    // reuses. Asserted as one query rather than table by table, because the failure mode this file
    // exists for is a join that returns nothing while each table on its own reads fine (see the
    // results/assessments case above). The recorder embed is the fragile part: `profiles_select`
    // (migration 0030) narrows a parent to STAFF profiles, so if that ever tightened further, every
    // receipt a parent downloaded would quietly print "the school office" instead of the officer.
    const { data, error } = await parent
      .from("payments")
      .select(
        `id, student_id, amount, method, reference, paid_at,
         students(first_name, last_name, enrollments(status, class_id, classes(name))),
         invoices(fee_term),
         extra_fee_assignments(extra_fee_items(name)),
         recorder:profiles!payments_recorded_by_fkey(first_name, last_name)`,
      )
      .order("paid_at", { ascending: false });

    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThan(0);

    const { data: kids } = await parent.from("students").select("id");
    const ids = new Set((kids ?? []).map((k) => k.id));
    expect(data!.every((p) => ids.has(p.student_id))).toBe(true);
    // Every row can name the student and the officer, which is what the receipt prints.
    expect(data!.every((p) => p.students !== null)).toBe(true);
    expect(data!.every((p) => p.recorder !== null)).toBe(true);
  });

  it("sees only its own children in the extra-fee positions view", async () => {
    // The demo seed assigns extra fees to the first ten active students, which may or may not
    // include this parent's two, so the assertion is about scoping, not about a count.
    const { data, error } = await parent.from("extra_fee_positions").select("student_id");
    expect(error).toBeNull();
    const { data: kids } = await parent.from("students").select("id");
    const ids = new Set((kids ?? []).map((k) => k.id));
    expect((data ?? []).every((r) => r.student_id !== null && ids.has(r.student_id))).toBe(true);
  });

  it("cannot write attendance", async () => {
    const { data: kid } = await parent.from("students").select("id").limit(1).single();
    const { data: cls } = await parent.from("enrollments").select("class_id").limit(1).single();
    const { data: term } = await parent.from("terms").select("id").eq("is_active", true).single();

    const { error } = await parent.from("attendance").insert({
      school_id: "00000000-0000-0000-0000-00000000501a",
      student_id: kid!.id,
      class_id: cls!.class_id,
      term_id: term!.id,
      date: "2026-06-01",
      status: "present",
    });
    expect(error).not.toBeNull();
  });
});
