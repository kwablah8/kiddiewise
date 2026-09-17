"use server";

import { attempt, UserFacingError, type ActionResult } from "./result";
import { tenant, assertWrite, assertOk, logActivity } from "./_server";
import {
  lessonNoteCreateSchema,
  lessonNoteUpdateSchema,
  lessonNoteSubmitSchema,
  lessonNoteDeleteSchema,
  lessonNoteSetAttachmentSchema,
  type LessonNoteCreateInput,
  type LessonNoteUpdateInput,
  type LessonNoteSubmitInput,
  type LessonNoteDeleteInput,
  type LessonNoteSetAttachmentInput,
} from "@/lib/validators/lesson-notes";

const ATTACHMENT_BUCKET = "lesson-note-attachments";

/**
 * Create a draft lesson plan. RLS (ln_teacher_insert, migration 0037) rejects the insert unless the
 * caller is the assigned teacher for that class-subject pair, so the pairing isn't re-checked here.
 * The unique(class_id, subject_id, week_ending) constraint is what turns a duplicate into a
 * friendly message instead of a raw 23505.
 */
export async function createLessonNote(
  input: LessonNoteCreateInput,
): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = lessonNoteCreateSchema.parse(input);
    const ctx = await tenant();

    const row = assertWrite(
      await ctx.db
        .from("lesson_notes")
        .insert({ ...data, school_id: ctx.schoolId, created_by: ctx.profile.id })
        .select("id")
        .single(),
      "lesson note",
      "You already have a lesson plan for that class, subject and week — edit it instead.",
    );

    const { data: klass } = await ctx.db.from("classes").select("name").eq("id", data.class_id).maybeSingle();
    await logActivity(ctx, `wrote a lesson plan for ${klass?.name ?? "a class"}`, "lesson_note", row.id);

    return { id: row.id };
  });
}

/**
 * Edit a note's content. Allowed regardless of status, editing a submitted note does not pull it
 * back into draft, it simply keeps showing whatever is currently saved, there is no re-submission
 * step to track.
 */
export async function updateLessonNote(
  input: LessonNoteUpdateInput,
): Promise<ActionResult<{ ok: true }>> {
  return attempt(async () => {
    const { id, ...data } = lessonNoteUpdateSchema.parse(input);
    const ctx = await tenant();

    assertOk(
      await ctx.db
        .from("lesson_notes")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id),
      "lesson note",
    );
    return { ok: true };
  });
}

/**
 * Hand a note to the admin. One-way: ln_admin_select (migration 0037) only reveals submitted
 * notes, and there is no path back to draft.
 */
export async function submitLessonNote(
  input: LessonNoteSubmitInput,
): Promise<ActionResult<{ ok: true }>> {
  return attempt(async () => {
    const { id } = lessonNoteSubmitSchema.parse(input);
    const ctx = await tenant();

    assertOk(
      await ctx.db
        .from("lesson_notes")
        .update({ status: "submitted", submitted_at: new Date().toISOString() })
        .eq("id", id),
      "lesson note",
    );

    const { data: note } = await ctx.db
      .from("lesson_notes")
      .select("classes(name)")
      .eq("id", id)
      .maybeSingle();
    await logActivity(ctx, `submitted a lesson note for ${note?.classes?.name ?? "a class"}`, "lesson_note", id);

    return { ok: true };
  });
}

/**
 * Record where an attachment landed after a direct-to-storage upload (lib/storage/lesson-notes.ts
 * does the actual upload; this table write is what the rest of the app reads). `null` on both
 * fields clears it. RLS (ln_teacher_update) is what actually decides who may call this.
 */
export async function setLessonNoteAttachment(
  input: LessonNoteSetAttachmentInput,
): Promise<ActionResult<{ ok: true }>> {
  return attempt(async () => {
    const { id, attachment_path, attachment_name } = lessonNoteSetAttachmentSchema.parse(input);
    const ctx = await tenant();

    assertOk(
      await ctx.db
        .from("lesson_notes")
        .update({ attachment_path, attachment_name, updated_at: new Date().toISOString() })
        .eq("id", id),
      "lesson note",
    );
    return { ok: true };
  });
}

/**
 * Delete a draft. Checked here, not only relied on at the RLS layer (ln_teacher_delete): a delete
 * RLS refuses matches zero rows and returns no error, which would otherwise look like the note
 * survived for no reason rather than reading as the rule it actually is.
 */
export async function deleteLessonNote(
  input: LessonNoteDeleteInput,
): Promise<ActionResult<{ ok: true }>> {
  return attempt(async () => {
    const { id } = lessonNoteDeleteSchema.parse(input);
    const ctx = await tenant();

    const { data: note } = await ctx.db
      .from("lesson_notes")
      .select("status, attachment_path")
      .eq("id", id)
      .maybeSingle();
    if (!note) throw new UserFacingError("This lesson note no longer exists.");
    if (note.status !== "draft") {
      throw new UserFacingError("A submitted lesson note can't be deleted.");
    }

    // Storage objects aren't FK'd to the row, so this must happen first: after the row is gone,
    // ln_teacher_* policies have nothing left to join to and this same delete would be refused.
    // Best-effort — a leftover file is harmless; failing the note's own delete over it is not.
    if (note.attachment_path) {
      const { error } = await ctx.db.storage.from(ATTACHMENT_BUCKET).remove([note.attachment_path]);
      if (error) console.error(`lesson-note-attachments remove (${note.attachment_path}): ${error.message}`);
    }

    assertOk(await ctx.db.from("lesson_notes").delete().eq("id", id), "lesson note");
    return { ok: true };
  });
}
