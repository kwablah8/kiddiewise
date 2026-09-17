"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { useSession } from "@/lib/auth/useSession";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AttachmentField } from "@/components/lesson-notes/attachment-field";
import { LessonNoteModePicker, ChangeModeLink, type LessonNoteMode } from "@/components/lesson-notes/note-mode-picker";
import { useAssignmentsForStaff, useActiveContext } from "@/lib/queries/academics";
import { useCreateLessonNote, useSetLessonNoteAttachment } from "@/lib/queries/lesson-notes";
import { lessonNoteCreateSchema } from "@/lib/validators/lesson-notes";
import { applyLessonNoteAttachmentChange, type AttachmentChange } from "@/lib/storage/lesson-notes";
import { textareaClass } from "@/lib/ui";

type FormInput = z.input<typeof lessonNoteCreateSchema>;

interface LessonNoteFormDialogProps {
  teacherId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Create a lesson note. Always starts as a draft — submitting is a separate, explicit action. */
export function LessonNoteFormDialog({ teacherId, open, onOpenChange }: LessonNoteFormDialogProps) {
  const { profile } = useSession();
  const { data: assignments } = useAssignmentsForStaff(teacherId);
  const { data: active } = useActiveContext();
  const createLessonNote = useCreateLessonNote();
  const setAttachment = useSetLessonNoteAttachment();
  const [attachmentChange, setAttachmentChange] = useState<AttachmentChange>(null);
  const [mode, setMode] = useState<LessonNoteMode | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, z.output<typeof lessonNoteCreateSchema>>({
    resolver: zodResolver(lessonNoteCreateSchema),
    defaultValues: {
      class_id: "",
      subject_id: "",
      term_id: active?.active_term?.id ?? "",
      week_ending: "",
      topic: "",
      materials_needed: null,
      objectives: null,
      lesson1_content: null,
      lesson1_assessment: null,
      lesson2_content: null,
      lesson2_assessment: null,
      lesson3_content: null,
      lesson3_assessment: null,
    },
  });

  const classId = useWatch({ control, name: "class_id" });

  // Same shape as AssessmentFormDialog: distinct classes, then (for the chosen class) subjects,
  // both from the teacher's own class_subjects assignments.
  const classes = useMemo(() => {
    const seen = new Map<string, string>();
    for (const a of assignments ?? []) if (!seen.has(a.class_id)) seen.set(a.class_id, a.class_name);
    return [...seen].map(([id, name]) => ({ id, name }));
  }, [assignments]);
  const subjects = useMemo(
    () =>
      (assignments ?? [])
        .filter((a) => a.class_id === classId)
        .map((a) => ({ id: a.subject_id, name: a.subject_name })),
    [assignments, classId],
  );

  async function onSubmit(values: z.output<typeof lessonNoteCreateSchema>) {
    if (mode === null) {
      setError("root", { message: "Choose how you'd like to add this lesson note." });
      return;
    }
    if (mode === "upload" && !(attachmentChange instanceof File)) {
      setError("root", { message: "Attach a document, or switch to the template instead." });
      return;
    }

    try {
      const { id } = await createLessonNote.mutateAsync(values);
      // The row must exist before anything can be uploaded into "<school_id>/<id>/…" — the storage
      // policies join back to this row (migration 0038), so create always comes first.
      if (attachmentChange) {
        await applyLessonNoteAttachmentChange(
          attachmentChange,
          id,
          profile!.school_id!,
          null,
          (input) => setAttachment.mutateAsync(input),
        );
      }
      toast.success("Lesson note saved as draft", { description: values.topic });
      onOpenChange(false);
    } catch (err) {
      setError("root", {
        message: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>New lesson note</DialogTitle>
            <DialogDescription>
              Saved as a draft. Submit it to the admin once you&apos;re ready.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 max-h-[65vh] space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Class</Label>
                <Controller
                  control={control}
                  name="class_id"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v ?? "");
                        setValue("subject_id", "");
                      }}
                    >
                      <SelectTrigger aria-invalid={!!errors.class_id}>
                        <SelectValue placeholder="Select a class">
                          {(v: string) => classes.find((c) => c.id === v)?.name ?? "Select a class"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.class_id && <p className="text-xs text-[var(--danger)]">{errors.class_id.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Controller
                  control={control}
                  name="subject_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "")} disabled={!classId}>
                      <SelectTrigger aria-invalid={!!errors.subject_id}>
                        <SelectValue placeholder={classId ? "Select a subject" : "Pick a class first"}>
                          {(v: string) => subjects.find((s) => s.id === v)?.name ?? "Select a subject"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.subject_id && <p className="text-xs text-[var(--danger)]">{errors.subject_id.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ln-week-ending">Week ending</Label>
                <Input id="ln-week-ending" type="date" aria-invalid={!!errors.week_ending} {...register("week_ending")} />
                {errors.week_ending && <p className="text-xs text-[var(--danger)]">{errors.week_ending.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ln-topic">Topic</Label>
                <Input id="ln-topic" placeholder="e.g. Introduction to fractions" aria-invalid={!!errors.topic} {...register("topic")} />
                {errors.topic && <p className="text-xs text-[var(--danger)]">{errors.topic.message}</p>}
              </div>
            </div>

            {mode === null ? (
              <LessonNoteModePicker value={mode} onChange={setMode} />
            ) : mode === "template" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium tracking-wide text-[var(--label)] uppercase">
                    Lesson note
                  </Label>
                  <ChangeModeLink onClick={() => setMode(null)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ln-materials">Materials needed</Label>
                  <textarea id="ln-materials" rows={2} className={textareaClass} {...register("materials_needed")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ln-objectives">Learning objectives</Label>
                  <textarea id="ln-objectives" rows={2} className={textareaClass} {...register("objectives")} />
                </div>

                <div className="space-y-3 border-t border-[var(--border)] pt-3">
                  <p className="text-xs font-medium tracking-wide text-[var(--label)] uppercase">Lesson 1</p>
                  <div className="space-y-1.5">
                    <Label htmlFor="ln-l1-content">Lesson</Label>
                    <textarea id="ln-l1-content" rows={3} className={textareaClass} {...register("lesson1_content")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ln-l1-assessment">Assessment</Label>
                    <textarea id="ln-l1-assessment" rows={2} className={textareaClass} {...register("lesson1_assessment")} />
                  </div>
                </div>

                <div className="space-y-3 border-t border-[var(--border)] pt-3">
                  <p className="text-xs font-medium tracking-wide text-[var(--label)] uppercase">Lesson 2</p>
                  <div className="space-y-1.5">
                    <Label htmlFor="ln-l2-content">Lesson</Label>
                    <textarea id="ln-l2-content" rows={3} className={textareaClass} {...register("lesson2_content")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ln-l2-assessment">Assessment</Label>
                    <textarea id="ln-l2-assessment" rows={2} className={textareaClass} {...register("lesson2_assessment")} />
                  </div>
                </div>

                <div className="space-y-3 border-t border-[var(--border)] pt-3">
                  <p className="text-xs font-medium tracking-wide text-[var(--label)] uppercase">Lesson 3</p>
                  <div className="space-y-1.5">
                    <Label htmlFor="ln-l3-content">Lesson</Label>
                    <textarea id="ln-l3-content" rows={3} className={textareaClass} {...register("lesson3_content")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ln-l3-assessment">Assessment</Label>
                    <textarea id="ln-l3-assessment" rows={2} className={textareaClass} {...register("lesson3_assessment")} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium tracking-wide text-[var(--label)] uppercase">
                    Document
                  </Label>
                  <ChangeModeLink onClick={() => setMode(null)} />
                </div>
                <AttachmentField
                  existing={null}
                  change={attachmentChange}
                  onChange={setAttachmentChange}
                  onOpenExisting={() => {}}
                />
              </div>
            )}

            {errors.root && <p className="text-sm text-[var(--danger)]">{errors.root.message}</p>}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Save draft
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
