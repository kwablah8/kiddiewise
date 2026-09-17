/**
 * lesson_notes (migration 0037): a teacher writes their own class-subject notes, drafts stay
 * private to them, and only a submitted note becomes visible to the school admin. Delete is
 * narrower than the other writes, draft only, PostgREST deletes silently affect zero rows when
 * RLS filters them out, so that case asserts the row SURVIVES rather than expecting an error.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { admin, seedTwoSchools, signInAs, type Seeded } from "./helpers";

let s: Seeded;
let termId: string;
// unique(class_id, subject_id, date): every seed in this file reuses the same class-subject pair,
// so each call needs its own date or the insert collides with an earlier test's row.
let dayCounter = 0;

async function seedNote(
  classId: string,
  subjectId: string,
  status: "draft" | "submitted" = "draft",
): Promise<string> {
  dayCounter += 1;
  const svc = admin();
  const { data, error } = await svc
    .from("lesson_notes")
    .insert({
      school_id: s.schoolA,
      class_id: classId,
      subject_id: subjectId,
      term_id: termId,
      date: `2026-09-${String(dayCounter).padStart(2, "0")}`,
      topic: "Fractions",
      status,
      submitted_at: status === "submitted" ? new Date().toISOString() : null,
      created_by: s.teacherA,
    })
    .select("id")
    .single();
  if (error) throw new Error(`lesson_notes seed: ${error.message}`);
  return data!.id;
}

beforeAll(async () => {
  s = await seedTwoSchools();
  const { data: term, error } = await admin()
    .from("terms")
    .select("id")
    .eq("school_id", s.schoolA)
    .limit(1)
    .single();
  if (error) throw new Error(`term lookup: ${error.message}`);
  termId = term!.id;
});

describe("teacher writes to lesson_notes", () => {
  it("creates a draft note for a class-subject they teach", async () => {
    const teacher = await signInAs(s.teacherAEmail);
    const { error } = await teacher.from("lesson_notes").insert({
      school_id: s.schoolA,
      class_id: s.classA_taught,
      subject_id: s.subjectA,
      term_id: termId,
      date: "2026-09-16",
      topic: "Shapes",
    });
    expect(error).toBeNull();
  });

  it("CANNOT create a note for a class-subject they do not teach", async () => {
    const teacher = await signInAs(s.teacherAEmail);
    const { error } = await teacher.from("lesson_notes").insert({
      school_id: s.schoolA,
      class_id: s.classA_untaught,
      subject_id: s.subjectA,
      term_id: termId,
      date: "2026-09-16",
      topic: "Shapes",
    });
    expect(error).not.toBeNull(); // WITH CHECK rejects the write
  });
});

describe("draft privacy", () => {
  it("admin CANNOT see a draft note", async () => {
    await seedNote(s.classA_taught, s.subjectA, "draft");
    const adminClient = await signInAs(s.adminAEmail);
    const { data, error } = await adminClient.from("lesson_notes").select("id, status");
    expect(error).toBeNull();
    expect(data!.every((r) => r.status === "submitted")).toBe(true);
  });

  it("admin CAN see a submitted note", async () => {
    const id = await seedNote(s.classA_taught, s.subjectA, "submitted");
    const adminClient = await signInAs(s.adminAEmail);
    const { data, error } = await adminClient.from("lesson_notes").select("id").eq("id", id);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("the authoring teacher sees their own draft regardless of status", async () => {
    const id = await seedNote(s.classA_taught, s.subjectA, "draft");
    const teacher = await signInAs(s.teacherAEmail);
    const { data, error } = await teacher.from("lesson_notes").select("id").eq("id", id);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });
});

describe("draft-only deletion", () => {
  it("deletes a draft note for a class-subject they teach", async () => {
    const id = await seedNote(s.classA_taught, s.subjectA, "draft");
    const teacher = await signInAs(s.teacherAEmail);
    const { error } = await teacher.from("lesson_notes").delete().eq("id", id);
    expect(error).toBeNull();

    const { data: gone } = await admin().from("lesson_notes").select("id").eq("id", id);
    expect(gone).toHaveLength(0);
  });

  it("CANNOT delete a submitted note", async () => {
    const id = await seedNote(s.classA_taught, s.subjectA, "submitted");
    const teacher = await signInAs(s.teacherAEmail);
    const { error } = await teacher.from("lesson_notes").delete().eq("id", id);
    expect(error).toBeNull(); // RLS filters silently — no error, no effect

    const { data: survivor } = await admin().from("lesson_notes").select("id").eq("id", id);
    expect(survivor).toHaveLength(1);
  });

  it("CANNOT delete a note for a class-subject they do not teach", async () => {
    // seeded directly against classA_taught then reassigned would be awkward; instead seed a
    // draft against the untaught class-subject pairing via service role, bypassing WITH CHECK.
    const id = await seedNote(s.classA_untaught, s.subjectA, "draft");
    const teacher = await signInAs(s.teacherAEmail);
    const { error } = await teacher.from("lesson_notes").delete().eq("id", id);
    expect(error).toBeNull();

    const { data: survivor } = await admin().from("lesson_notes").select("id").eq("id", id);
    expect(survivor).toHaveLength(1);
  });
});
