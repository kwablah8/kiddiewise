/**
 * Extra fees as an admin bills with them (migration 0043): which classes a fee is offered to, the
 * billing period of each charge, and deletes that can no longer take money with them.
 *
 * The first block checks the database rules directly. The second runs the REAL Server Actions in
 * lib/actions/fees.ts: the server-side Supabase client and the session are mocked to hand back a
 * signed-in admin, so every write goes through PostgREST under that admin's RLS, exactly as in the
 * app.
 */
import { beforeAll, describe, expect, it, vi } from "vitest";
import { admin, seedTwoSchools, signInAs, type Seeded } from "./helpers";

let adminClient: Awaited<ReturnType<typeof signInAs>>;
let adminProfile: { id: string; school_id: string; role: string };

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => adminClient }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => adminClient }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => admin() }));
vi.mock("@/lib/auth/session", () => ({ requireProfile: async () => adminProfile }));

import {
  assignExtraFee,
  createExtraFeeStructure,
  deleteExtraFeeCharge,
  deleteExtraFeeStructure,
  recordExtraFeePayment,
  updateExtraFeeCharge,
  updateExtraFeeStructure,
} from "@/lib/actions/fees";
import { listExtraFeeAssignments, listExtraFeeStructures } from "@/lib/data/fees";

let s: Seeded;
let yearA: string;
let classB: string;

/** Unwrap an action result, failing the test on an unexpected refusal. */
function ok<T>(res: { ok: true; data: T } | { ok: false; message: string }): T {
  if (!res.ok) throw new Error(`action refused: ${res.message}`);
  return res.data;
}

async function newFee(name: string, frequency: "one_time" | "termly" | "monthly" | "annual", classIds: string[] = []) {
  return ok(
    await createExtraFeeStructure({ name, amount: 100, frequency, description: null, class_ids: classIds }),
  ).id;
}

const chargesFor = async (feeId: string) =>
  (await listExtraFeeAssignments()).filter((c) => c.extra_fee_item_id === feeId);

beforeAll(async () => {
  s = await seedTwoSchools();
  const svc = admin();

  yearA = (
    await svc.from("academic_years").select("id").eq("school_id", s.schoolA).eq("is_active", true).single()
  ).data!.id;
  // Writes read the active year off the school row, which the shared seed leaves unset.
  await svc.from("schools").update({ active_academic_year_id: yearA }).eq("id", s.schoolA);

  classB = (
    await svc.from("classes").insert({ school_id: s.schoolB, name: "B Basic 1", level: "Primary" }).select("id").single()
  ).data!.id;

  adminClient = await signInAs(s.adminAEmail);
  adminProfile = { id: s.adminA, school_id: s.schoolA, role: "school_admin" };
});

describe("database rules", () => {
  it("keeps one school's class links out of another's reach", async () => {
    const svc = admin();
    const itemB = (
      await svc.from("extra_fee_items").insert({ school_id: s.schoolB, name: "B Bus", amount: 50 }).select("id").single()
    ).data!.id;
    await svc.from("extra_fee_item_classes").insert({ school_id: s.schoolB, extra_fee_item_id: itemB, class_id: classB });

    const { data } = await adminClient.from("extra_fee_item_classes").select("class_id").eq("extra_fee_item_id", itemB);
    expect(data).toHaveLength(0);
  });

  it("does not let a teacher change which classes a fee is offered to", async () => {
    const feeId = await newFee("Teacher-proof", "one_time");
    const teacher = await signInAs(s.teacherAEmail);
    const { error } = await teacher
      .from("extra_fee_item_classes")
      .insert({ school_id: s.schoolA, extra_fee_item_id: feeId, class_id: s.classA_taught });
    expect(error).not.toBeNull();
  });

  it("refuses to offer a fee to another school's class, leaving its classes unchanged", async () => {
    const feeId = await newFee("Foreign class", "one_time", [s.classA_taught]);
    const { error } = await adminClient.rpc("set_extra_fee_item_classes", {
      p_item_id: feeId,
      p_class_ids: [classB],
    });
    expect(error).not.toBeNull();

    const { data } = await admin().from("extra_fee_item_classes").select("class_id").eq("extra_fee_item_id", feeId);
    expect(data!.map((r) => r.class_id)).toEqual([s.classA_taught]);
  });

  it("rejects a second charge for the same student, fee and period", async () => {
    const svc = admin();
    const feeId = await newFee("Once per period", "annual");
    const row = { school_id: s.schoolA, extra_fee_item_id: feeId, student_id: s.studentA1, academic_year_id: yearA, amount: 100 };
    expect((await svc.from("extra_fee_assignments").insert(row)).error).toBeNull();
    expect((await svc.from("extra_fee_assignments").insert(row)).error?.code).toBe("23505");
  });

  it("still deletes a student's charges and their payments with the student", async () => {
    const svc = admin();
    const student = (
      await svc
        .from("students")
        .insert({
          school_id: s.schoolA,
          admission_no: `EF-${Date.now()}`,
          first_name: "Esi",
          last_name: "Leaving",
          date_of_birth: "2016-01-01",
          gender: "female",
        })
        .select("id")
        .single()
    ).data!.id;
    const feeId = await newFee("Cascade check", "one_time");
    const charge = (
      await svc
        .from("extra_fee_assignments")
        .insert({ school_id: s.schoolA, extra_fee_item_id: feeId, student_id: student, academic_year_id: yearA, amount: 100 })
        .select("id")
        .single()
    ).data!.id;
    await svc.from("payments").insert({
      school_id: s.schoolA,
      extra_fee_assignment_id: charge,
      student_id: student,
      amount: 40,
      method: "cash",
      recorded_by: s.adminA,
    });

    expect((await adminClient.from("students").delete().eq("id", student)).error).toBeNull();
    expect((await svc.from("extra_fee_assignments").select("id").eq("id", charge)).data).toHaveLength(0);
    expect((await svc.from("payments").select("id").eq("extra_fee_assignment_id", charge)).data).toHaveLength(0);
  });
});

describe("assigning extra fees", () => {
  it("charges every student in the classes a fee is offered to, and tops up rather than doubling", async () => {
    // studentA1 is in classA_taught, studentA2 in classA_untaught.
    const feeId = await newFee("Basic 1 trip", "one_time", [s.classA_taught]);

    const first = ok(
      await assignExtraFee({ extra_fee_item_id: feeId, target: { kind: "all" }, fee_term: "full_year", billing_month: null, amount: 100 }),
    );
    expect(first).toEqual({ charged: 1, alreadyCharged: 0 });
    expect((await chargesFor(feeId)).map((c) => c.student_id)).toEqual([s.studentA1]);

    const again = ok(
      await assignExtraFee({ extra_fee_item_id: feeId, target: { kind: "all" }, fee_term: "full_year", billing_month: null, amount: 100 }),
    );
    expect(again).toEqual({ charged: 0, alreadyCharged: 1 });
  });

  it("charges chosen classes and chosen students, at an overridden amount", async () => {
    const feeId = await newFee("Feeding", "annual");

    ok(
      await assignExtraFee({
        extra_fee_item_id: feeId,
        target: { kind: "classes", class_ids: [s.classA_untaught] },
        fee_term: "full_year",
        billing_month: null,
        amount: 100,
      }),
    );
    ok(
      await assignExtraFee({
        extra_fee_item_id: feeId,
        target: { kind: "students", student_ids: [s.studentA1] },
        fee_term: "full_year",
        billing_month: null,
        amount: 75,
      }),
    );

    const charges = await chargesFor(feeId);
    expect(charges.find((c) => c.student_id === s.studentA2)?.amount).toBe(100);
    expect(charges.find((c) => c.student_id === s.studentA1)?.amount).toBe(75);
  });

  it("refuses classes or students the fee isn't offered to", async () => {
    const feeId = await newFee("Basic 1 only", "one_time", [s.classA_taught]);
    const base = { extra_fee_item_id: feeId, fee_term: "full_year" as const, billing_month: null, amount: 100 };

    expect((await assignExtraFee({ ...base, target: { kind: "classes", class_ids: [s.classA_untaught] } })).ok).toBe(false);
    expect((await assignExtraFee({ ...base, target: { kind: "students", student_ids: [s.studentA2] } })).ok).toBe(false);
    expect(await chargesFor(feeId)).toHaveLength(0);
  });

  it("bills a termly fee once per term", async () => {
    const feeId = await newFee("School Bus", "termly");
    const base = { extra_fee_item_id: feeId, target: { kind: "students" as const, student_ids: [s.studentA1] }, billing_month: null, amount: 100 };

    expect((await assignExtraFee({ ...base, fee_term: "full_year" })).ok).toBe(false);
    ok(await assignExtraFee({ ...base, fee_term: "first" }));
    ok(await assignExtraFee({ ...base, fee_term: "second" }));

    expect((await chargesFor(feeId)).map((c) => c.fee_term).sort()).toEqual(["first", "second"]);
  });

  it("bills a monthly fee once per month inside the active year", async () => {
    const feeId = await newFee("Monthly feeding", "monthly");
    const base = { extra_fee_item_id: feeId, target: { kind: "students" as const, student_ids: [s.studentA1] }, fee_term: "full_year" as const, amount: 100 };

    ok(await assignExtraFee({ ...base, billing_month: "2026-10" }));
    ok(await assignExtraFee({ ...base, billing_month: "2026-11" }));
    // The seeded year runs 2026-09-01 to 2027-07-31.
    expect((await assignExtraFee({ ...base, billing_month: "2027-09" })).ok).toBe(false);

    expect((await chargesFor(feeId)).map((c) => c.billing_month).sort()).toEqual(["2026-10-01", "2026-11-01"]);
  });
});

describe("paying, correcting and removing charges", () => {
  it("records a payment, refuses overpayment, and protects a paid charge", async () => {
    const feeId = await newFee("Uniform", "one_time");
    ok(
      await assignExtraFee({
        extra_fee_item_id: feeId,
        target: { kind: "students", student_ids: [s.studentA1] },
        fee_term: "full_year",
        billing_month: null,
        amount: 200,
      }),
    );
    const [charge] = await chargesFor(feeId);
    const pay = { extra_fee_assignment_id: charge!.id, method: "cash" as const, reference: null, paid_at: "2026-10-01" };

    expect((await recordExtraFeePayment({ ...pay, amount: 250 })).ok).toBe(false);
    ok(await recordExtraFeePayment({ ...pay, amount: 150 }));

    const [after] = await chargesFor(feeId);
    expect(after).toMatchObject({ paid: 150, balance: 50, status: "partial" });

    expect((await updateExtraFeeCharge({ id: charge!.id, amount: 100 })).ok).toBe(false);
    ok(await updateExtraFeeCharge({ id: charge!.id, amount: 150 }));
    expect((await chargesFor(feeId))[0]).toMatchObject({ amount: 150, status: "paid" });

    expect((await deleteExtraFeeCharge({ id: charge!.id })).ok).toBe(false);
    expect((await deleteExtraFeeStructure({ id: feeId })).ok).toBe(false);
  });

  it("removes an unpaid charge, then lets the uncharged fee be deleted", async () => {
    const feeId = await newFee("Mistake", "one_time");
    ok(
      await assignExtraFee({
        extra_fee_item_id: feeId,
        target: { kind: "students", student_ids: [s.studentA2] },
        fee_term: "full_year",
        billing_month: null,
        amount: 100,
      }),
    );
    const [charge] = await chargesFor(feeId);

    ok(await deleteExtraFeeCharge({ id: charge!.id }));
    ok(await deleteExtraFeeStructure({ id: feeId }));
    expect((await listExtraFeeStructures()).find((f) => f.id === feeId)).toBeUndefined();
  });

  it("fixes a fee's frequency once it has been charged, but still lets its price and classes change", async () => {
    const feeId = await newFee("ICT Lab", "annual");
    ok(
      await assignExtraFee({
        extra_fee_item_id: feeId,
        target: { kind: "students", student_ids: [s.studentA1] },
        fee_term: "full_year",
        billing_month: null,
        amount: 100,
      }),
    );
    const edit = { id: feeId, name: "ICT Lab", description: null, amount: 120, class_ids: [s.classA_taught] };

    expect((await updateExtraFeeStructure({ ...edit, frequency: "termly" })).ok).toBe(false);
    ok(await updateExtraFeeStructure({ ...edit, frequency: "annual" }));

    const fee = (await listExtraFeeStructures()).find((f) => f.id === feeId);
    expect(fee).toMatchObject({ amount: 120, class_ids: [s.classA_taught], charge_count: 1 });
    // The existing charge keeps the price it was raised at.
    expect((await chargesFor(feeId))[0]?.amount).toBe(100);
  });
});
