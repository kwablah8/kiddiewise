import { beforeAll, describe, expect, it } from "vitest";
import { seedTwoSchools, signInAs, type Seeded } from "./helpers";

let s: Seeded;
beforeAll(async () => {
  s = await seedTwoSchools();
});

describe("teacher is confined to assigned classes", () => {
  it("can insert attendance for a class they teach", async () => {
    const c = await signInAs(s.teacherAEmail);
    const { error } = await c.from("attendance").insert({
      school_id: s.schoolA,
      student_id: s.studentA1,
      class_id: s.classA_taught,
      term_id: await termId(c),
      date: "2026-09-10",
      status: "present",
      marked_by: s.teacherA,
    });
    expect(error).toBeNull();
  });

  it("CANNOT insert attendance for a class they do not teach", async () => {
    const c = await signInAs(s.teacherAEmail);
    const { error } = await c.from("attendance").insert({
      school_id: s.schoolA,
      student_id: s.studentA2,
      class_id: s.classA_untaught,
      term_id: await termId(c),
      date: "2026-09-10",
      status: "present",
      marked_by: s.teacherA,
    });
    expect(error).not.toBeNull(); // teacher_teaches_class() is false → rejected
  });
});

async function termId(c: Awaited<ReturnType<typeof signInAs>>) {
  const { data } = await c.from("terms").select("id").eq("is_active", true).single();
  return data!.id as string;
}
