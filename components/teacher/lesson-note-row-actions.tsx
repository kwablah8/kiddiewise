"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Pencil, Send, Trash2 } from "lucide-react";
import { z } from "zod";
import { toast } from "@/lib/toast";
import { useSession } from "@/lib/auth/useSession";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AttachmentField } from "@/components/lesson-notes/attachment-field";
import { LessonNoteModePicker, ChangeModeLink, type LessonNoteMode } from "@/components/lesson-notes/note-mode-picker";
import {
  useUpdateLessonNote,
  useSubmitLessonNote,
  useDeleteLessonNote,
  useLessonNote,
  useSetLessonNoteAttachment,
} from "@/lib/queries/lesson-notes";
import { lessonNoteUpdateSchema, type LessonNoteListItemVM } from "@/lib/validators/lesson-notes";
import {
  applyLessonNoteAttachmentChange,
  getLessonNoteAttachmentUrl,
  type AttachmentChange,
} from "@/lib/storage/lesson-notes";
import { textareaClass } from "@/lib/ui";

const editFormSchema = lessonNoteUpdateSchema.omit({ id: true });
type EditFormInput = z.input<typeof editFormSchema>;
type EditFormOutput = z.output<typeof editFormSchema>;

/**
 * Edit, submit and delete controls for one lesson note row. Who may actually do each is RLS's
 * decision (ln_teacher_*, migration 0037); these render for the row's owner and an unauthorised
 * write comes back as a permission message. Submit and delete only make sense while a note is
 * still a draft, so those two buttons don't render once it's submitted.
 */
export function LessonNoteRowActions({ note }: { note: LessonNoteListItemVM }) {
  const [editOpen, setEditOpen] = useState(false);
  const [editKey, setEditKey] = useState(0);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isDraft = note.status === "draft";

  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Edit ${note.topic}`}
        onClick={() => {
          setEditKey((k) => k + 1);
          setEditOpen(true);
        }}
      >
        <Pencil className="size-4" aria-hidden="true" />
      </Button>
      {isDraft && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Submit ${note.topic} to the admin`}
          onClick={() => setSubmitOpen(true)}
        >
          <Send className="size-4" aria-hidden="true" />
        </Button>
      )}
      {isDraft && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete ${note.topic}`}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="size-4 text-[var(--danger)]" aria-hidden="true" />
        </Button>
      )}

      {editOpen && <LessonNoteEditDialog key={editKey} note={note} open={editOpen} onOpenChange={setEditOpen} />}
      {isDraft && <ConfirmSubmitDialog note={note} open={submitOpen} onOpenChange={setSubmitOpen} />}
      {isDraft && <ConfirmDeleteDialog note={note} open={deleteOpen} onOpenChange={setDeleteOpen} />}
    </div>
  );
}

function LessonNoteEditDialog({
  note,
  open,
  onOpenChange,
}: {
  note: LessonNoteListItemVM;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { profile } = useSession();
  const updateLessonNote = useUpdateLessonNote();
  const setAttachment = useSetLessonNoteAttachment();
  // The row list doesn't carry the long-text fields (or the attachment); load them fresh for editing.
  const { data: detail, isLoading } = useLessonNote(note.id);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attachmentChange, setAttachmentChange] = useState<AttachmentChange>(null);
  const existingAttachment =
    detail?.attachment_path && detail?.attachment_name
      ? { path: detail.attachment_path, name: detail.attachment_name }
      : null;

  // Which section to show: whatever the teacher has manually picked this session, or else
  // inferred from what the note already has once `detail` arrives. `undefined` means "no manual
  // choice yet" — derived at render time rather than synced in an effect, so switching sections
  // (or a later refetch of `detail`) never fights a state update against itself.
  const [manualMode, setManualMode] = useState<LessonNoteMode | null | undefined>(undefined);
  const hasTemplateContent = Boolean(
    detail && (detail.objectives || detail.content || detail.homework || detail.resources),
  );
  const inferredMode: LessonNoteMode | null = existingAttachment ? "upload" : hasTemplateContent ? "template" : null;
  const mode = manualMode === undefined ? inferredMode : manualMode;

  const willHaveAttachment = attachmentChange instanceof File || (existingAttachment !== null && attachmentChange !== "remove");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditFormInput, unknown, EditFormOutput>({
    resolver: zodResolver(editFormSchema),
    values: detail
      ? {
          topic: detail.topic,
          objectives: detail.objectives,
          content: detail.content,
          homework: detail.homework,
          resources: detail.resources,
        }
      : undefined,
  });

  async function onSubmit(values: EditFormOutput) {
    setSubmitError(null);
    if (mode === null) {
      setSubmitError("Choose how you'd like to add this lesson note.");
      return;
    }
    if (mode === "upload" && !willHaveAttachment) {
      setSubmitError("Attach a document, or switch to the template instead.");
      return;
    }
    try {
      await updateLessonNote.mutateAsync({ id: note.id, ...values });
      if (attachmentChange) {
        await applyLessonNoteAttachmentChange(
          attachmentChange,
          note.id,
          profile!.school_id!,
          detail?.attachment_path ?? null,
          (input) => setAttachment.mutateAsync(input),
        );
      }
      toast.success("Lesson note updated", { description: values.topic });
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  async function handleOpenExisting() {
    if (!existingAttachment) return;
    try {
      const url = await getLessonNoteAttachmentUrl(existingAttachment.path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't open that file.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Edit lesson note</DialogTitle>
            <DialogDescription>
              {note.class_name} · {note.subject_name} · {note.date}. The class, subject and date
              can&apos;t change, that would make it a different note.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="mt-4 text-sm text-[var(--muted-foreground)]">Loading…</div>
          ) : (
            <div className="mt-4 max-h-[65vh] space-y-4 overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <Label htmlFor="edit_topic">Topic</Label>
                <Input id="edit_topic" aria-invalid={!!errors.topic} {...register("topic")} />
                {errors.topic && <p className="text-xs text-[var(--danger)]">{errors.topic.message}</p>}
              </div>
              {mode === null ? (
                <LessonNoteModePicker value={mode} onChange={setManualMode} />
              ) : mode === "template" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium tracking-wide text-[var(--label)] uppercase">
                      Lesson note
                    </Label>
                    <ChangeModeLink onClick={() => setManualMode(null)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_objectives">Objectives</Label>
                    <textarea id="edit_objectives" rows={2} className={textareaClass} {...register("objectives")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_content">Content / activities</Label>
                    <textarea id="edit_content" rows={3} className={textareaClass} {...register("content")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_homework">Homework</Label>
                    <textarea id="edit_homework" rows={2} className={textareaClass} {...register("homework")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_resources">Resources</Label>
                    <textarea id="edit_resources" rows={2} className={textareaClass} {...register("resources")} />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium tracking-wide text-[var(--label)] uppercase">
                      Document
                    </Label>
                    <ChangeModeLink onClick={() => setManualMode(null)} />
                  </div>
                  <AttachmentField
                    existing={existingAttachment}
                    change={attachmentChange}
                    onChange={setAttachmentChange}
                    onOpenExisting={handleOpenExisting}
                  />
                </div>
              )}
              {submitError && <p className="text-sm text-[var(--danger)]">{submitError}</p>}
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmSubmitDialog({
  note,
  open,
  onOpenChange,
}: {
  note: LessonNoteListItemVM;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const submitLessonNote = useSubmitLessonNote();

  async function handleConfirm() {
    try {
      await submitLessonNote.mutateAsync({ id: note.id });
      toast.success("Lesson note submitted", { description: "The admin can now see it." });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit to the admin?</DialogTitle>
          <DialogDescription>
            <strong className="text-[var(--text)]">{note.topic}</strong> ({note.class_name} ·{" "}
            {note.subject_name}) becomes visible to the school admin. There&apos;s no way to
            unsubmit, though you can still edit it afterwards.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={submitLessonNote.isPending}>
            {submitLessonNote.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDeleteDialog({
  note,
  open,
  onOpenChange,
}: {
  note: LessonNoteListItemVM;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const deleteLessonNote = useDeleteLessonNote();

  async function handleConfirm() {
    try {
      await deleteLessonNote.mutateAsync({ id: note.id });
      toast.success("Lesson note deleted", { description: `${note.topic} has been removed.` });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete lesson note?</DialogTitle>
          <DialogDescription>
            <strong className="text-[var(--text)]">{note.topic}</strong> ({note.class_name} ·{" "}
            {note.subject_name}) will be removed. Only a draft can be deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={deleteLessonNote.isPending}>
            {deleteLessonNote.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
