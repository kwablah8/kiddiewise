import { beforeAll, describe, expect, it } from "vitest";
import { anon, seedTwoSchools, type Seeded } from "./helpers";

let s: Seeded;
beforeAll(async () => {
  s = await seedTwoSchools();
});

describe("anonymous admissions inquiry path", () => {
  it("anon can INSERT an inquiry for a school", async () => {
    const { error } = await anon().from("admissions_inquiries").insert({
      school_id: s.schoolA,
      applicant_name: "New Kid",
      parent_name: "Guardian",
      parent_email: "g@test.dev",
    });
    expect(error).toBeNull();
  });

  it("anon CANNOT read inquiries", async () => {
    const { data, error } = await anon().from("admissions_inquiries").select("id");
    // No SELECT policy/grant exists for anon on this table, so the boundary can be proven
    // either way PostgREST reports it: a privilege/RLS error, or a permitted-but-empty read.
    expect(error !== null || data!.length === 0).toBe(true);
  });

  it("anon INSERT ... RETURNING is rejected, because RETURNING needs SELECT", async () => {
    // This combination is the gap that let a real bug ship: the two cases above pass individually,
    // so `submitInquiry` looked fine while calling `.insert().select("id")`, which appends a
    // RETURNING clause, needs the SELECT privilege anon does not have, and failed every public
    // enquiry with 42501 "permission denied".
    //
    // The fix is not to grant SELECT to anon (Postgres even suggests that in its error hint), that
    // would let any visitor read every inquiry ever submitted, exposing the name, email and phone of
    // every family who has enquired. The fix is for the action not to ask for the row back. This test
    // pins that constraint so nobody "helpfully" adds a .select() to the public write again.
    const { error } = await anon()
      .from("admissions_inquiries")
      .insert({
        school_id: s.schoolA,
        applicant_name: "Returning Kid",
        parent_name: "Guardian",
        parent_email: "returning@test.dev",
      })
      .select("id");

    expect(error).not.toBeNull();
    expect(error!.code).toBe("42501");
  });
});
