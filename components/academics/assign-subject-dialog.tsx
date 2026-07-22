"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssignSubject, useStaff, useSubjects } from "@/lib/queries/academics";
import { assignSubjectSchema, type AssignSubjectInput } from "@/lib/validators/academics";

// Sentinel for the Select's "Unassigned" row — the field itself stores `null`, but the Select
// needs a concrete string value to compare against (same pattern as `class-form.tsx`).
const NONE_VALUE = "__unassigned__";

// `assignSubjectSchema` has a `.default(null)` on `teacher_id`, so its input type (what the form
// collects) differs from its output type (what `assignSubject` requires) — same pattern as
// `class-form.tsx` / `student-form.tsx`.
type AssignSubjectFormInput = z.input<typeof assignSubjectSchema>;

interface AssignSubjectDialogProps {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Assign-a-subject-(and-optionally-a-teacher)-to-a-class dialog, opened from the class detail
 * Assignments panel (06-UI §6/§7 "Forms"). A duplicate `(class_id, subject_id)` pairing surfaces
 * as an inline error on the subject field — the action throws that exact message. Form state
 * isn't reset on close; the caller remounts this component with a fresh `key` each time it
 * opens (mirrors `LinkGuardianDialog`).
 */
export function AssignSubjectDialog({ classId, open, onOpenChange }: AssignSubjectDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const { data: staff, isLoading: staffLoading } = useStaff();
  const assignSubject = useAssignSubject();

  const teacherOptions = (staff ?? []).filter((s) => s.is_active);

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AssignSubjectFormInput, unknown, AssignSubjectInput>({
    resolver: zodResolver(assignSubjectSchema),
    defaultValues: { class_id: classId, subject_id: "", teacher_id: null },
  });

  // `assignSubjectSchema` accepts any non-empty string for `subject_id` — it's the final Server
  // Action contract, not a form-only rule — so an unselected subject is guarded here by
  // disabling submit rather than by a resolver error (same pattern as `LinkGuardianDialog`).
  const selectedSubjectId = useWatch({ control, name: "subject_id" });

  async function onSubmit(values: AssignSubjectInput) {
    setSubmitError(null);
    try {
      await assignSubject.mutateAsync(values);
      const subject = (subjects ?? []).find((s) => s.id === values.subject_id);
      toast.success("Subject assigned", {
        description: subject
          ? `${subject.name} has been assigned to this class.`
          : "The subject has been assigned to this class.",
      });
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      // The action throws this exact message for a duplicate (class_id, subject_id) pairing —
      // surface it as an inline field error instead of a generic banner (input is preserved
      // either way since we never call `reset()` here).
      if (message.toLowerCase().includes("already assigned")) {
        setError("subject_id", { type: "manual", message });
      } else {
        setSubmitError(message);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Assign subject</DialogTitle>
            <DialogDescription>
              Assign a subject — and, optionally, a teacher — to this class.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="assign_subject_id">Subject</Label>
              {!subjectsLoading && (subjects ?? []).length === 0 ? (
                <p className="rounded-lg border border-dashed border-[var(--border)] px-3 py-3 text-sm text-[var(--muted-foreground)]">
                  No subjects yet. Add one from the Subjects page first.
                </p>
              ) : (
                <Controller
                  control={control}
                  name="subject_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={subjectsLoading}>
                      <SelectTrigger
                        id="assign_subject_id"
                        className="w-full"
                        aria-invalid={!!errors.subject_id}
                      >
                        <SelectValue placeholder={subjectsLoading ? "Loading subjects…" : "Select a subject"}>
                          {(v: string) => {
                            if (subjectsLoading) return "Loading subjects…";
                            const s = (subjects ?? []).find((x) => x.id === v);
                            return s ? s.name : "Select a subject";
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(subjects ?? []).map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {errors.subject_id && (
                <p className="text-xs text-[var(--danger)]">{errors.subject_id.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assign_teacher_id">Teacher</Label>
              <Controller
                control={control}
                name="teacher_id"
                render={({ field }) => (
                  <Select
                    value={field.value ?? NONE_VALUE}
                    onValueChange={(v) => field.onChange(v === NONE_VALUE ? null : v)}
                    disabled={staffLoading}
                  >
                    <SelectTrigger
                      id="assign_teacher_id"
                      className="w-full"
                      aria-invalid={!!errors.teacher_id}
                    >
                      <SelectValue placeholder={staffLoading ? "Loading staff…" : undefined}>
                        {(v: string) => {
                          if (staffLoading) return "Loading staff…";
                          if (v === NONE_VALUE) return "Unassigned";
                          const t = teacherOptions.find((s) => s.id === v);
                          return t ? `${t.first_name} ${t.last_name}` : "Unassigned";
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Unassigned</SelectItem>
                      {teacherOptions.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.first_name} {s.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.teacher_id && (
                <p className="text-xs text-[var(--danger)]">{errors.teacher_id.message}</p>
              )}
            </div>

            {submitError && <p className="text-sm text-[var(--danger)]">{submitError}</p>}
            <input type="hidden" {...register("class_id")} />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || subjectsLoading || (subjects ?? []).length === 0 || !selectedSubjectId}
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Assign Subject
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
