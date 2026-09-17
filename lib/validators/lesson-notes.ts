import { z } from "zod";

/**
 * A teacher's lesson note for one class-subject-day (migration 0037). `status` is the whole
 * submission workflow: 'draft' is private to the author, 'submitted' is what makes it visible to
 * the admin (RLS decides that, not this file). There is no "unsubmit".
 */

export const lessonNoteStatus = z.enum(["draft", "submitted"]);
export type LessonNoteStatus = z.infer<typeof lessonNoteStatus>;

export const LESSON_NOTE_STATUS_LABEL: Record<LessonNoteStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
};

// Empty-string-from-a-textarea becomes null (the column is nullable), same preprocessing as
// assessmentCreateSchema's `date` field.
const noteText = (max = 4000) =>
  z.preprocess(
    (v) => (v === "" || v === undefined ? null : v),
    z.string().trim().max(max, `Keep this under ${max} characters`).nullable(),
  );

// ---- view-models ------------------------------------------------------------

export const lessonNoteListItemVM = z.object({
  id: z.string(),
  class_id: z.string(),
  class_name: z.string(),
  subject_id: z.string(),
  subject_name: z.string(),
  term_id: z.string(),
  term_name: z.string(),
  date: z.string(),
  topic: z.string(),
  status: lessonNoteStatus,
  submitted_at: z.string().nullable(),
  teacher_name: z.string(),
  // Storage object path ("<school_id>/<id>/<filename>", migration 0038) and its original filename.
  // Both null or both set — lesson_notes_attachment_both_or_neither enforces that at the database.
  attachment_path: z.string().nullable(),
  attachment_name: z.string().nullable(),
});
export type LessonNoteListItemVM = z.infer<typeof lessonNoteListItemVM>;

export const lessonNoteDetailVM = lessonNoteListItemVM.extend({
  objectives: z.string().nullable(),
  content: z.string().nullable(),
  homework: z.string().nullable(),
  resources: z.string().nullable(),
});
export type LessonNoteDetailVM = z.infer<typeof lessonNoteDetailVM>;

export interface LessonNoteFilters {
  term_id?: string;
  class_id?: string;
  subject_id?: string;
  teacher_id?: string;
}

// ---- write contracts --------------------------------------------------------

export const lessonNoteCreateSchema = z.object({
  class_id: z.string().min(1, "Select a class"),
  subject_id: z.string().min(1, "Select a subject"),
  term_id: z.string().min(1, "Select a term"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  topic: z.string().trim().min(1, "Required").max(200, "Keep this under 200 characters"),
  objectives: noteText(),
  content: noteText(),
  homework: noteText(),
  resources: noteText(),
});
export type LessonNoteCreateInput = z.infer<typeof lessonNoteCreateSchema>;

// Class, subject, term and date are not editable after creation, the row is keyed on them
// (unique(class_id, subject_id, date)); changing any is really a new lesson note, not an edit.
export const lessonNoteUpdateSchema = lessonNoteCreateSchema
  .omit({ class_id: true, subject_id: true, term_id: true, date: true })
  .extend({ id: z.string().min(1) });
export type LessonNoteUpdateInput = z.infer<typeof lessonNoteUpdateSchema>;

export const lessonNoteSubmitSchema = z.object({ id: z.string().min(1) });
export type LessonNoteSubmitInput = z.infer<typeof lessonNoteSubmitSchema>;

export const lessonNoteDeleteSchema = z.object({ id: z.string().min(1) });
export type LessonNoteDeleteInput = z.infer<typeof lessonNoteDeleteSchema>;

// ---- attachment ---------------------------------------------------------------

/** Documents only, matching the lesson-note-attachments bucket's own allowlist (migration 0038). */
export const LESSON_NOTE_ATTACHMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

/** Accepted by the file input's `accept` attribute — extensions read better than MIME types there. */
export const LESSON_NOTE_ATTACHMENT_ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx";

export const LESSON_NOTE_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024; // matches the bucket's file_size_limit

/**
 * Persists the result of a direct-to-storage upload (lib/storage/lesson-notes.ts). The upload
 * itself runs in the browser against Supabase Storage, not through this Server Action, files
 * don't fit a Server Action's body-size limit; this just records where it landed. `null` on both
 * clears the attachment (RLS on lesson_notes still decides who may call this at all).
 */
export const lessonNoteSetAttachmentSchema = z
  .object({
    id: z.string().min(1),
    attachment_path: z.string().min(1).nullable(),
    attachment_name: z.string().min(1).nullable(),
  })
  .refine((v) => (v.attachment_path === null) === (v.attachment_name === null), {
    message: "attachment_path and attachment_name must both be set or both be null",
  });
export type LessonNoteSetAttachmentInput = z.infer<typeof lessonNoteSetAttachmentSchema>;
