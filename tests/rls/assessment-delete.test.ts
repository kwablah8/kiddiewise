/**
 * asm_teacher_delete (migrations 0025, 0050): a teacher may delete assessments only for the
 * class-subject pairs they teach, and only while none of its results is submitted. An admin may delete
 * any assessment in their school. PostgREST deletes silently affect zero rows when RLS filters them out, so the
 * negative case asserts the row SURVIVES rather than expecting an error. The app-level guard
 * (submitted results block deletion) lives in the Server Action and is exercised on-screen; what
 * belongs here is the database boundary itself, including the results cascade.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { admin, seedTwoSchools, signInAs, type Seeded } from "./helpers";

let s: Seeded;
let typeId: string;
let termId: string;

async function seedAssessment(classId: string): Promise<string> {
  const svc = admin();
  const { data, error } = await svc
    .from("assessments")
    .insert({
      school_id: s.schoolA,
      class_id: classId,
      subject_id: s.subjectA,
      term_id: termId,
      assessment_type_id: typeId,
      title: "Deletable quiz",
      max_score: 20,
      created_by: s.teacherA,
    })
    .select("id")
    .single();
  if (error) throw new Error(`assessment seed: ${error.message}`);
  return data!.id;
}

beforeAll(async () => {
  s = await seedTwoSchools();
  const svc = admin();

  const { data: type, error: typeErr } = await svc
    .from("assessment_types")
    .insert({ school_id: s.schoolA, name: "Class Test" })
    .select("id")
    .single();
  if (typeErr) throw new Error(`assessment_types seed: ${typeErr.message}`);
  typeId = type!.id;

  const { data: term, error: termErr } = await svc
    .from("terms")
    .select("id")
    .eq("school_id", s.schoolA)
    .limit(1)
    .single();
  if (termErr) throw new Error(`term lookup: ${termErr.message}`);
  termId = term!.id;
});

describe("teacher deletion of assessments", () => {
  it("deletes an assessment for a class-subject they teach, cascading draft results", async () => {
    const assessmentId = await seedAssessment(s.classA_taught);
    const svc = admin();
    const { error: resultErr } = await svc.from("results").insert({
      school_id: s.schoolA,
      assessment_id: assessmentId,
      student_id: s.studentA1,
      score: 12,
      is_submitted: false,
      entered_by: s.teacherA,
    });
    if (resultErr) throw new Error(`result seed: ${resultErr.message}`);

    const teacher = await signInAs(s.teacherAEmail);
    const { error } = await teacher.from("assessments").delete().eq("id", assessmentId);
    expect(error).toBeNull();

    const { data: gone } = await svc.from("assessments").select("id").eq("id", assessmentId);
    expect(gone).toHaveLength(0);
    const { data: orphans } = await svc.from("results").select("id").eq("assessment_id", assessmentId);
    expect(orphans).toHaveLength(0);
  });

  it("CANNOT delete an assessment for a class they do not teach", async () => {
    const assessmentId = await seedAssessment(s.classA_untaught);

    const teacher = await signInAs(s.teacherAEmail);
    const { error } = await teacher.from("assessments").delete().eq("id", assessmentId);
    expect(error).toBeNull(); // RLS filters silently — no error, no effect

    const { data: survivor } = await admin()
      .from("assessments")
      .select("id")
      .eq("id", assessmentId);
    expect(survivor).toHaveLength(1);
  });
});

describe("submitted assessments", () => {
  async function seedSubmitted(): Promise<string> {
    const assessmentId = await seedAssessment(s.classA_taught);
    const { error } = await admin().from("results").insert({
      school_id: s.schoolA,
      assessment_id: assessmentId,
      student_id: s.studentA1,
      score: 15,
      is_submitted: true,
      entered_by: s.teacherA,
    });
    if (error) throw new Error(`result seed: ${error.message}`);
    return assessmentId;
  }

  it("a teacher CANNOT delete once a score is submitted", async () => {
    const assessmentId = await seedSubmitted();
    const teacher = await signInAs(s.teacherAEmail);
    const { error } = await teacher.from("assessments").delete().eq("id", assessmentId);
    expect(error).toBeNull(); // RLS filters silently

    const { data: survivor } = await admin().from("assessments").select("id").eq("id", assessmentId);
    expect(survivor).toHaveLength(1);
    const { data: kept } = await admin().from("results").select("id").eq("assessment_id", assessmentId);
    expect(kept).toHaveLength(1);
  });

  it("an admin can delete it, and its results go with it", async () => {
    const assessmentId = await seedSubmitted();
    const adminA = await signInAs(s.adminAEmail);
    const { error } = await adminA.from("assessments").delete().eq("id", assessmentId);
    expect(error).toBeNull();

    const { data: gone } = await admin().from("assessments").select("id").eq("id", assessmentId);
    expect(gone).toHaveLength(0);
    const { data: orphans } = await admin().from("results").select("id").eq("assessment_id", assessmentId);
    expect(orphans).toHaveLength(0);
  });
});
