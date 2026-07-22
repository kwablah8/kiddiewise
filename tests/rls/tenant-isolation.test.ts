import { beforeAll, describe, expect, it } from "vitest";
import { admin, seedTwoSchools, signInAs, type Seeded } from "./helpers";

let s: Seeded;
beforeAll(async () => {
  s = await seedTwoSchools();
});

describe("cross-school isolation", () => {
  it("School A admin sees only School A students", async () => {
    // seed a student in School B directly (service role)
    await admin()
      .from("students")
      .insert({
        school_id: s.schoolB,
        admission_no: "B-1",
        first_name: "Bee",
        last_name: "Bee",
        date_of_birth: "2015-03-03",
        gender: "male",
      });
    const c = await signInAs(s.adminAEmail);
    const { data, error } = await c.from("students").select("id, school_id");
    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThan(0);
    expect(data!.every((r) => r.school_id === s.schoolA)).toBe(true);
  });

  it("School A admin CANNOT insert a student into School B (WITH CHECK blocks spoofed school_id)", async () => {
    const c = await signInAs(s.adminAEmail);
    const { error } = await c.from("students").insert({
      school_id: s.schoolB,
      admission_no: "SPOOF",
      first_name: "No",
      last_name: "No",
      date_of_birth: "2015-01-01",
      gender: "male",
    });
    expect(error).not.toBeNull(); // RLS rejects the write
  });
});
