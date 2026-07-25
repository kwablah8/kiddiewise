import { beforeAll, describe, expect, it } from "vitest";
import { admin, seedTwoSchools, signInAs, type Seeded } from "./helpers";

let s: Seeded;
beforeAll(async () => {
  s = await seedTwoSchools();
  const db = admin();
  // an assessment + submitted results for both students
  const term = (await db.from("terms").select("id").eq("school_id", s.schoolA).single()).data!.id;
  const at = (
    await db.from("assessment_types").insert({ school_id: s.schoolA, name: "Exam", weight: 100 }).select().single()
  ).data!.id;
  const asm = (
    await db
      .from("assessments")
      .insert({
        school_id: s.schoolA,
        class_id: s.classA_taught,
        subject_id: s.subjectA,
        term_id: term,
        assessment_type_id: at,
        title: "End of Term",
        max_score: 100,
      })
      .select()
      .single()
  ).data!.id;
  await db.from("results").insert([
    { school_id: s.schoolA, assessment_id: asm, student_id: s.studentA1, score: 88, is_submitted: true },
    { school_id: s.schoolA, assessment_id: asm, student_id: s.studentA2, score: 72, is_submitted: true },
  ]);
});

describe("parent sees only linked children", () => {
  it("reads results for their linked child", async () => {
    const c = await signInAs(s.parentAEmail);
    const { data } = await c.from("results").select("student_id, score");
    expect(data!.length).toBe(1);
    expect(data![0]!.student_id).toBe(s.studentA1);
  });

  it("CANNOT read an unlinked child's student record", async () => {
    const c = await signInAs(s.parentAEmail);
    const { data } = await c.from("students").select("id").eq("id", s.studentA2);
    expect(data!.length).toBe(0); // studentA2 is not linked to parentA
  });

  it("can read the ASSESSMENTS behind their child's results", async () => {
    // Regression: 0008 gave `assessments` admin and teacher policies only. Parents could read
    // `results` but not `assessments`, and because the portal joins them with an INNER join, the
    // results page rendered "No results published yet" no matter what teachers submitted. Asserting
    // the two tables separately passed — the bug lived in the join, so the join is asserted here.
    const c = await signInAs(s.parentAEmail);
    const { data, error } = await c
      .from("results")
      .select("score, assessments!inner(max_score, term_id, subjects(name))");
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
