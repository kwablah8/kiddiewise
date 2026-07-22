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
});
