/**
 * lesson-note-attachments bucket (migration 0038): the assigned teacher has full access to
 * attachments on notes they own, regardless of draft/submitted status; the admin can only read one
 * once the note itself is submitted, same gate as the note's own content (ln_admin_select).
 */
import { beforeAll, describe, expect, it } from "vitest";
import { admin, seedTwoSchools, signInAs, type Seeded } from "./helpers";

const BUCKET = "lesson-note-attachments";
const FILE = Buffer.from("%PDF-1.4 test content");

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
  const { data, error } = await admin()
    .from("lesson_notes")
    .insert({
      school_id: s.schoolA,
      class_id: classId,
      subject_id: subjectId,
      term_id: termId,
      date: `2026-09-${String(dayCounter).padStart(2, "0")}`,
      topic: "Attachment test",
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

describe("teacher writes to lesson-note-attachments", () => {
  it("uploads to a note for a class-subject they teach", async () => {
    const noteId = await seedNote(s.classA_taught, s.subjectA, "draft");
    const teacher = await signInAs(s.teacherAEmail);
    const { error } = await teacher.storage
      .from(BUCKET)
      .upload(`${s.schoolA}/${noteId}/worksheet.pdf`, FILE, { contentType: "application/pdf" });
    expect(error).toBeNull();
  });

  it("CANNOT upload to a note for a class-subject they do not teach", async () => {
    const noteId = await seedNote(s.classA_untaught, s.subjectA, "draft");
    const teacher = await signInAs(s.teacherAEmail);
    const { error } = await teacher.storage
      .from(BUCKET)
      .upload(`${s.schoolA}/${noteId}/worksheet.pdf`, FILE, { contentType: "application/pdf" });
    expect(error).not.toBeNull();
  });

  it("removes their own attachment", async () => {
    const noteId = await seedNote(s.classA_taught, s.subjectA, "draft");
    const path = `${s.schoolA}/${noteId}/worksheet.pdf`;
    const teacher = await signInAs(s.teacherAEmail);
    await teacher.storage.from(BUCKET).upload(path, FILE, { contentType: "application/pdf" });

    const { error } = await teacher.storage.from(BUCKET).remove([path]);
    expect(error).toBeNull();
    const { data: dl } = await teacher.storage.from(BUCKET).download(path);
    expect(dl).toBeNull();
  });
});

describe("draft privacy on attachments", () => {
  it("admin CANNOT download an attachment while the note is a draft", async () => {
    const noteId = await seedNote(s.classA_taught, s.subjectA, "draft");
    const path = `${s.schoolA}/${noteId}/worksheet.pdf`;
    const teacher = await signInAs(s.teacherAEmail);
    await teacher.storage.from(BUCKET).upload(path, FILE, { contentType: "application/pdf" });

    const adminClient = await signInAs(s.adminAEmail);
    const { data, error } = await adminClient.storage.from(BUCKET).download(path);
    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it("admin CAN download an attachment once the note is submitted", async () => {
    const noteId = await seedNote(s.classA_taught, s.subjectA, "submitted");
    const path = `${s.schoolA}/${noteId}/worksheet.pdf`;
    const teacher = await signInAs(s.teacherAEmail);
    await teacher.storage.from(BUCKET).upload(path, FILE, { contentType: "application/pdf" });

    const adminClient = await signInAs(s.adminAEmail);
    const { data, error } = await adminClient.storage.from(BUCKET).download(path);
    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });
});
