import { beforeAll, describe, expect, it } from "vitest";
import { admin, signInAs, seedTwoSchools, type Seeded } from "./helpers";

/**
 * The parent portal's Fees tab (components/parent/child-fees.tsx) reads the SAME functions the
 * admin Fees screens use, narrowed to one student id. Nothing in that narrowing is a security
 * boundary — a `student_id` filter is a hint a hostile client can simply drop. What actually keeps
 * one family's ledger out of another's is RLS: `inv_parent_read`, `pay_parent_read` and
 * `efa_parent_read` (migrations 0011 and 0017), reached through the `security_invoker` views in
 * 0018/0032.
 *
 * So these tests never pass a student filter. They ask for EVERYTHING each table will give the
 * signed-in parent and assert that what comes back is their own child and nothing else — which is
 * the query a hostile client would send.
 */

let s: Seeded;
let invoiceA1: string;
let invoiceA2: string;

beforeAll(async () => {
  s = await seedTwoSchools();
  const db = admin();

  const year = (
    await db.from("academic_years").select("id").eq("school_id", s.schoolA).single()
  ).data!.id;

  // A full-year invoice for each of the two students: A1 is parentA's child, A2 is not.
  // Both rows spell out `arrears`: a multi-row PostgREST insert sends ONE column list, so a column
  // supplied by only some rows arrives as an explicit NULL for the others and trips its NOT NULL
  // constraint instead of falling back to the default.
  const invoicesRes = (
    await db
      .from("invoices")
      .insert([
        {
          school_id: s.schoolA,
          student_id: s.studentA1,
          academic_year_id: year,
          fee_term: "full_year",
          total_amount: 1000,
          arrears: 200,
        },
        {
          school_id: s.schoolA,
          student_id: s.studentA2,
          academic_year_id: year,
          fee_term: "full_year",
          total_amount: 1000,
          arrears: 0,
        },
      ])
      .select("id, student_id")
  );
  if (invoicesRes.error) throw new Error(`seed invoices: ${invoicesRes.error.message}`);
  const invoices = invoicesRes.data!;
  invoiceA1 = invoices.find((i) => i.student_id === s.studentA1)!.id;
  invoiceA2 = invoices.find((i) => i.student_id === s.studentA2)!.id;

  // A part payment against each, recorded by the admin.
  await db.from("payments").insert([
    {
      school_id: s.schoolA,
      invoice_id: invoiceA1,
      student_id: s.studentA1,
      amount: 400,
      method: "mobile_money",
      reference: "MP-A1",
      recorded_by: s.adminA,
    },
    {
      school_id: s.schoolA,
      invoice_id: invoiceA2,
      student_id: s.studentA2,
      amount: 750,
      method: "cash",
      reference: "CASH-A2",
      recorded_by: s.adminA,
    },
  ]);

  // An extra fee (uniform) assigned to both students.
  const item = (
    await db
      .from("extra_fee_items")
      .insert({ school_id: s.schoolA, name: "Uniform", amount: 300 })
      .select("id")
      .single()
  ).data!.id;
  await db.from("extra_fee_assignments").insert([
    { school_id: s.schoolA, extra_fee_item_id: item, student_id: s.studentA1, amount: 300 },
    { school_id: s.schoolA, extra_fee_item_id: item, student_id: s.studentA2, amount: 300 },
  ]);
});

describe("a parent reads their own child's fees", () => {
  it("sees the invoice raised for their child, with its arrears", async () => {
    const c = await signInAs(s.parentAEmail);
    const { data, error } = await c.from("invoices").select("student_id, total_amount, arrears");
    expect(error).toBeNull();
    expect(data!.length).toBe(1);
    expect(data![0]!.student_id).toBe(s.studentA1);
    expect(Number(data![0]!.arrears)).toBe(200);
  });

  it("reads the derived position — paid, balance and status it never has to compute", async () => {
    // The view is `security_invoker = true`, so the parent's own policies decide its rows. If that
    // flag were ever dropped the view would run as its owner and hand over the whole school's
    // ledger, which is precisely what this assertion would catch.
    const c = await signInAs(s.parentAEmail);
    const { data, error } = await c
      .from("student_fee_positions")
      .select("student_id, expected, arrears, paid, balance, status");
    expect(error).toBeNull();
    expect(data!.length).toBe(1);
    const row = data![0]!;
    expect(row.student_id).toBe(s.studentA1);
    expect(Number(row.paid)).toBe(400);
    expect(Number(row.balance)).toBe(800); // 1000 + 200 arrears - 400 paid
    expect(row.status).toBe("partial");
  });

  it("reads their child's extra-fee position", async () => {
    const c = await signInAs(s.parentAEmail);
    const { data, error } = await c
      .from("extra_fee_positions")
      .select("student_id, fee_name, amount, balance, status");
    expect(error).toBeNull();
    expect(data!.length).toBe(1);
    expect(data![0]!.student_id).toBe(s.studentA1);
    expect(data![0]!.fee_name).toBe("Uniform");
    expect(data![0]!.status).toBe("pending");
  });

  it("reads their child's payments, and the officer who received them", async () => {
    // The receipt's "Received by" line comes from this embed (lib/data/fees.ts#listPayments). A
    // parent may read STAFF profiles (migration 0030) — without that, every receipt a parent
    // downloaded would print "the school office" instead of the officer's name.
    const c = await signInAs(s.parentAEmail);
    const { data, error } = await c
      .from("payments")
      .select("student_id, amount, reference, recorder:profiles!payments_recorded_by_fkey(first_name, last_name)");
    expect(error).toBeNull();
    expect(data!.length).toBe(1);
    expect(data![0]!.student_id).toBe(s.studentA1);
    expect(data![0]!.reference).toBe("MP-A1");
    expect(data![0]!.recorder).toMatchObject({ first_name: "Ad", last_name: "A" });
  });
});

describe("a parent cannot reach another family's money", () => {
  it("gets nothing when asking for an unlinked classmate's invoice by id", async () => {
    const c = await signInAs(s.parentAEmail);
    const { data } = await c.from("invoices").select("id").eq("id", invoiceA2);
    expect(data!.length).toBe(0);
  });

  it("gets nothing when asking for an unlinked classmate's payments by student id", async () => {
    // Same school, same class list, a name the parent can plausibly guess — and still zero rows.
    const c = await signInAs(s.parentAEmail);
    const { data } = await c.from("payments").select("id").eq("student_id", s.studentA2);
    expect(data!.length).toBe(0);
  });

  it("cannot see an unlinked classmate through either fee-position view", async () => {
    const c = await signInAs(s.parentAEmail);
    const [positions, extras] = await Promise.all([
      c.from("student_fee_positions").select("id").eq("student_id", s.studentA2),
      c.from("extra_fee_positions").select("id").eq("student_id", s.studentA2),
    ]);
    expect(positions.data!.length).toBe(0);
    expect(extras.data!.length).toBe(0);
  });

  it("cannot record, alter or delete a payment — the portal is read-only by policy", async () => {
    // No "pay now" button exists, but the API is public (golden rule 2), so the absence of a write
    // path in the UI proves nothing. A parent inventing a payment against their own child's
    // invoice is the attractive attack: it would settle a real balance on the school's own screens.
    const c = await signInAs(s.parentAEmail);
    const insert = await c
      .from("payments")
      .insert({
        school_id: s.schoolA,
        invoice_id: invoiceA1,
        student_id: s.studentA1,
        amount: 600,
        method: "cash",
      });
    expect(insert.error).not.toBeNull();

    const update = await c.from("invoices").update({ arrears: 0 }).eq("id", invoiceA1).select();
    expect(update.data ?? []).toEqual([]);

    const del = await c.from("payments").delete().eq("student_id", s.studentA1).select();
    expect(del.data ?? []).toEqual([]);

    // And the ledger is untouched.
    const { data } = await admin().from("payments").select("amount").eq("invoice_id", invoiceA1);
    expect(data!.map((p) => Number(p.amount))).toEqual([400]);
  });
});
