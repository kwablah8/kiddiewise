import { beforeAll, describe, expect, it } from "vitest";
import { admin, seedTwoSchools, signInAs, type Seeded } from "./helpers";

let s: Seeded;
beforeAll(async () => {
  s = await seedTwoSchools();
});

describe("teacher is confined to assigned classes", () => {
  const row = (studentId: string, classId: string, termId: string) => ({
    school_id: s.schoolA,
    student_id: studentId,
    class_id: classId,
    term_id: termId,
    date: "2026-09-10",
    status: "present",
    marked_by: s.teacherA,
  });

  it("CANNOT insert attendance as a subject teacher of the class", async () => {
    const c = await signInAs(s.teacherAEmail);
    const { error } = await c.from("attendance").insert(row(s.studentA1, s.classA_taught, await termId(c)));
    expect(error).not.toBeNull(); // teacher_is_class_teacher() is false → rejected
  });

  it("can insert and amend attendance as the class teacher", async () => {
    await admin().from("classes").update({ class_teacher_id: s.teacherA }).eq("id", s.classA_taught);
    const c = await signInAs(s.teacherAEmail);
    const term = await termId(c);
    const insert = await c.from("attendance").insert(row(s.studentA1, s.classA_taught, term));
    expect(insert.error).toBeNull();
    const update = await c
      .from("attendance")
      .update({ status: "late" })
      .eq("student_id", s.studentA1)
      .eq("date", "2026-09-10")
      .select("status");
    expect(update.error).toBeNull();
    expect(update.data).toEqual([{ status: "late" }]);
  });

  it("CANNOT insert attendance for a class they do not teach", async () => {
    const c = await signInAs(s.teacherAEmail);
    const { error } = await c.from("attendance").insert(row(s.studentA2, s.classA_untaught, await termId(c)));
    expect(error).not.toBeNull();
  });

  it("can still read the register of a class they teach a subject in", async () => {
    await admin().from("classes").update({ class_teacher_id: null }).eq("id", s.classA_taught);
    const c = await signInAs(s.teacherAEmail);
    const { error } = await c.from("attendance").select("id").eq("class_id", s.classA_taught);
    expect(error).toBeNull();
  });
});

async function termId(c: Awaited<ReturnType<typeof signInAs>>) {
  const { data } = await c.from("terms").select("id").eq("is_active", true).single();
  return data!.id as string;
}
