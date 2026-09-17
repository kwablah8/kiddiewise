import { createClient } from "@/lib/supabase/client";

/**
 * Direct-to-storage upload/remove/download for a lesson note's one attachment (migration 0038).
 *
 * Runs in the browser against Supabase Storage rather than through a Server Action, same reasoning
 * as every other read in lib/data/*: RLS (lesson_note_attachments_teacher_all /
 * _admin_select) is the actual security boundary, and a Server Action would hit Next's body-size
 * limit long before the bucket's own 10MB cap. `lib/actions/lesson-notes.ts#setLessonNoteAttachment`
 * only ever records the path this settles on; it does not move the bytes.
 */

const BUCKET = "lesson-note-attachments";

/** Keeps the object key readable in Studio and safe in a URL; the original name is kept separately. */
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-]+/g, "_").slice(-100);
}

/** "<school_id>/<lesson_note_id>/<sanitized filename>" — the two segments the RLS policies check. */
function attachmentPath(schoolId: string, lessonNoteId: string, filename: string): string {
  return `${schoolId}/${lessonNoteId}/${sanitizeFilename(filename)}`;
}

export interface UploadedAttachment {
  path: string;
  name: string;
}

/**
 * Uploads (or replaces) the note's attachment. `previousPath` is removed first when it differs
 * from the new one, a re-upload under a new filename would otherwise leave the old object behind,
 * the two are unrelated as far as storage is concerned, nothing else references it by row.
 */
export async function uploadLessonNoteAttachment(
  schoolId: string,
  lessonNoteId: string,
  file: File,
  previousPath?: string | null,
): Promise<UploadedAttachment> {
  const path = attachmentPath(schoolId, lessonNoteId, file.name);
  const client = createClient();

  if (previousPath && previousPath !== path) {
    await client.storage.from(BUCKET).remove([previousPath]); // best-effort, see removeLessonNoteAttachment
  }

  const { error } = await client.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw new Error(`Couldn't upload the attachment: ${error.message}`);

  return { path, name: file.name };
}

/** Best-effort: a leftover object with nothing pointing at it is harmless, unlike a failed save. */
export async function removeLessonNoteAttachment(path: string): Promise<void> {
  const { error } = await createClient().storage.from(BUCKET).remove([path]);
  if (error) console.error(`lesson-note-attachments remove (${path}): ${error.message}`);
}

/** A short-lived link to open or download the file — the bucket is private, there is no public URL. */
export async function getLessonNoteAttachmentUrl(path: string): Promise<string> {
  const { data, error } = await createClient().storage.from(BUCKET).createSignedUrl(path, 60);
  if (error || !data) throw new Error(`Couldn't open that file: ${error?.message ?? "unknown error"}`);
  return data.signedUrl;
}

/** A newly-picked file, a request to clear the existing one, or no change since the dialog opened. */
export type AttachmentChange = File | "remove" | null;

/**
 * Applies a pending `AttachmentChange` and records the result, shared by the create and edit
 * dialogs so the upload/remove/save sequence exists in exactly one place. `setAttachment` is the
 * caller's `useSetLessonNoteAttachment().mutateAsync`, passed in rather than called from here so
 * this stays a plain function, not a hook.
 */
export async function applyLessonNoteAttachmentChange(
  change: AttachmentChange,
  noteId: string,
  schoolId: string,
  existingPath: string | null,
  setAttachment: (input: { id: string; attachment_path: string | null; attachment_name: string | null }) => Promise<unknown>,
): Promise<void> {
  if (change === null) return; // unchanged
  if (change === "remove") {
    if (existingPath) await removeLessonNoteAttachment(existingPath);
    await setAttachment({ id: noteId, attachment_path: null, attachment_name: null });
    return;
  }
  const uploaded = await uploadLessonNoteAttachment(schoolId, noteId, change, existingPath);
  await setAttachment({ id: noteId, attachment_path: uploaded.path, attachment_name: uploaded.name });
}
