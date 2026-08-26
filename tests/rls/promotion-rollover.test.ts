/**
 * End-of-year rollover: promotion writes NEXT year's enrollments and never rewrites history
 * (docs/05-USER-FLOWS.md §7), so a promoted student carries one enrollment row per year. Every
 * "current class" read must therefore disambiguate by the active academic year, without that
 * scoping, the students page and the class rosters keep resolving to the old year's placement
 * after the school rolls over, which is the bug this file pins down.
 *
 * Unlike the other files in this suite, these tests call the REAL `lib/data` readers: the app's
 * browser-client module is mocked to hand them a signed-in test client, so the exact production
 * query shapes run under RLS.
 */
import { beforeAll, describe, expect, it, vi } from "vitest";
import { admin, seedTwoSchools, signInAs, type Seeded } from "./helpers";

// Assigned in beforeAll; the factory's `createClient` reads it lazily on every db() call, long
// after sign-in has completed.
let adminClient: Awaited<ReturnType<typeof signInAs>>;

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => adminClient,
}));

import { listStudents } from "@/lib/data/people";
import { getRoster } from "@/lib/data/attendance";
import { listClasses } from "@/lib/data/academics";
import { getFeesOverview, listExtraFeeAssignments } from "@/lib/data/fees";

let s: Seeded;
let extraAssignmentId: string;

beforeAll(async () => {
  s = await seedTwoSchools();
  const svc = admin();

  // The year the school is rolling into.
  const { data: year2, error: yearErr } = await svc
    .from("academic_years")
    .insert({
      school_id: s.schoolA,
      name: "2027/2028",
      start_date: "2027-09-01",
      end_date: "2028-07-31",
      is_active: false,
    })
    .select("id")
    .single();
  if (yearErr) throw new Error(`year2: ${yearErr.message}`);

  adminClient = await signInAs(s.adminAEmail);

  // An extra fee assigned to the student who is about to be promoted. Extra fees carry no academic
  // year of their own, so `extra_fee_positions` must pick one enrollment to name the student's
  // class, migration 0032 scopes that join to the active year. Without it, a promoted student (who
  // holds one active enrollment per year) yields one row PER YEAR: the fee renders twice and every
  // extra-fee total doubles. Seeded before the rollover below so the student ends up holding both.
  const { data: item, error: itemErr } = await svc
    .from("extra_fee_items")
    .insert({ school_id: s.schoolA, name: "Feeding", amount: 600 })
    .select("id")
    .single();
  if (itemErr) throw new Error(`extra_fee_items: ${itemErr.message}`);

  const { data: assignment, error: assignErr } = await svc
    .from("extra_fee_assignments")
    .insert({
      school_id: s.schoolA,
      extra_fee_item_id: item!.id,
      student_id: s.studentA1,
      amount: 600,
    })
    .select("id")
    .single();
  if (assignErr) throw new Error(`extra_fee_assignments: ${assignErr.message}`);
  extraAssignmentId = assignment!.id;

  // The promotion write, exactly as lib/actions/promotion.ts performs it: studentA1 moves from
  // Basic 1 (classA_taught) into Basic 2 (classA_untaught) for the new year. studentA2 gets no
  // decision; they must stay behind in the old year until an admin decides.
  const { error: promoteErr } = await adminClient.from("enrollments").upsert(
    {
      school_id: s.schoolA,
      student_id: s.studentA1,
      class_id: s.classA_untaught,
      academic_year_id: year2!.id,
      status: "active",
    },
    { onConflict: "student_id,academic_year_id" },
  );
  if (promoteErr) throw new Error(`promotion upsert: ${promoteErr.message}`);

  // The admin "changes the active year to the next upcoming one".
  const { error: offErr } = await svc
    .from("academic_years")
    .update({ is_active: false })
    .eq("school_id", s.schoolA)
    .eq("is_active", true);
  if (offErr) throw new Error(`deactivate year1: ${offErr.message}`);
  const { error: onErr } = await svc
    .from("academic_years")
    .update({ is_active: true })
    .eq("id", year2!.id);
  if (onErr) throw new Error(`activate year2: ${onErr.message}`);
});

describe("after promotion and a year switch, reads follow the active year", () => {
  it("students list shows the promoted student's NEW class", async () => {
    const students = await listStudents();
    const promoted = students.find((st) => st.id === s.studentA1);
    expect(promoted?.class_name).toBe("Basic 2");
  });

  it("students list shows no class for a student with no decision yet", async () => {
    const students = await listStudents();
    const undecided = students.find((st) => st.id === s.studentA2);
    expect(undecided?.class_name).toBeNull();
  });

  it("the old class's register no longer lists the promoted student", async () => {
    const roster = await getRoster(s.classA_taught, "2027-09-10");
    expect(roster.entries).toHaveLength(0);
  });

  it("the new class's register lists exactly the students placed there this year", async () => {
    const roster = await getRoster(s.classA_untaught, "2027-09-10");
    expect(roster.entries.map((e) => e.student_id)).toEqual([s.studentA1]);
  });

  it("class student counts follow the active year", async () => {
    const classes = await listClasses();
    const basic1 = classes.find((c) => c.id === s.classA_taught);
    const basic2 = classes.find((c) => c.id === s.classA_untaught);
    expect(basic1?.student_count).toBe(0);
    expect(basic2?.student_count).toBe(1);
  });

  // Migration 0032's guarantee, which had no test until a duplicate-key crash on the parent portal's
  // Fees tab exposed it. Both portals read extra fees through these two functions, so pinning it
  // here covers the admin Extra Fees tab and the parent's "Other fees" table at once.
  it("an extra fee on a promoted student is ONE row, at their new class", async () => {
    const rows = await listExtraFeeAssignments();
    const mine = rows.filter((r) => r.id === extraAssignmentId);
    expect(mine).toHaveLength(1);
    expect(mine[0]!.class_name).toBe("Basic 2");
  });

  it("does not double a promoted student's extra-fee total", async () => {
    // The money consequence of the row above, asserted separately: a duplicated row inflates what
    // the school thinks it is owed and what the parent is told they owe.
    const overview = await getFeesOverview();
    expect(overview.extra_records).toBe(1);
    expect(overview.extra_total).toBe(600);
  });
});
