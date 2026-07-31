"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { z } from "zod";
import { toast } from "@/lib/toast";
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
import { useUpdateAssessment, useDeleteAssessment } from "@/lib/queries/assessments";
import { useAssessmentTypes } from "@/lib/queries/grading";
import { assessmentUpdateSchema, type AssessmentListItemVM } from "@/lib/validators/assessments";

// The dialog's own contract: the update schema minus `id` (carried by the row, not typed by the
// user), with every editable field required so RHF validates them as a complete form.
const editFormSchema = assessmentUpdateSchema.omit({ id: true }).required({
  title: true,
  assessment_type_id: true,
  max_score: true,
});
type EditFormInput = z.input<typeof editFormSchema>;
type EditFormOutput = z.output<typeof editFormSchema>;

/**
 * Edit + delete controls for one assessment row, shared by the teacher's list and the admin's
 * table. Who may actually write is RLS's decision (asm_teacher_* / asm_admin) — the buttons render
 * for everyone who can see the row, and an unauthorised write comes back as a permission message.
 */
export function AssessmentRowActions({ assessment }: { assessment: AssessmentListItemVM }) {
  const [editOpen, setEditOpen] = useState(false);
  const [editKey, setEditKey] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div
      className="flex items-center justify-end gap-1"
      // Rows navigate to the assessment detail on click; these buttons must not.
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Edit ${assessment.title}`}
        onClick={() => {
          setEditKey((k) => k + 1);
          setEditOpen(true);
        }}
      >
        <Pencil className="size-4" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${assessment.title}`}
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="size-4 text-[var(--danger)]" aria-hidden="true" />
      </Button>

      {editOpen && (
        <AssessmentEditDialog
          key={editKey}
          assessment={assessment}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
      <ConfirmDeleteAssessmentDialog
        assessment={assessment}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}

function AssessmentEditDialog({
  assessment,
  open,
  onOpenChange,
}: {
  assessment: AssessmentListItemVM;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const updateAssessment = useUpdateAssessment();
  const { data: types } = useAssessmentTypes();

  // Scores are stored as fractions of max_score, so once any exist the server refuses to move the
  // total — the field is disabled with the reason rather than letting the save bounce.
  const maxLocked = assessment.result_count > 0;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditFormInput, unknown, EditFormOutput>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      title: assessment.title,
      assessment_type_id: assessment.assessment_type_id,
      max_score: assessment.max_score,
      date: assessment.date ?? "",
    },
  });

  async function onSubmit(values: EditFormOutput) {
    setSubmitError(null);
    try {
      await updateAssessment.mutateAsync({
        id: assessment.id,
        title: values.title,
        assessment_type_id: values.assessment_type_id,
        date: values.date,
        // Not sent when locked: the value is unchanged, and sending it would trip the guard.
        ...(maxLocked ? {} : { max_score: values.max_score }),
      });
      toast.success("Assessment updated", { description: `${values.title} has been saved.` });
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Edit assessment</DialogTitle>
            <DialogDescription>
              {assessment.class_name} · {assessment.subject_name} · {assessment.term_name}. The
              class, subject and term can&apos;t change — recorded scores belong to them.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit_title">Title</Label>
              <Input id="edit_title" aria-invalid={!!errors.title} {...register("title")} />
              {errors.title && <p className="text-xs text-[var(--danger)]">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit_type">Type</Label>
              <Controller
                control={control}
                name="assessment_type_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v ?? field.value)}>
                    <SelectTrigger id="edit_type" className="w-full" aria-invalid={!!errors.assessment_type_id}>
                      <SelectValue>
                        {(v: string) => (types ?? []).find((t) => t.id === v)?.name ?? "Select a type"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(types ?? []).map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.assessment_type_id && (
                <p className="text-xs text-[var(--danger)]">{errors.assessment_type_id.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit_max">Max score</Label>
                <Input
                  id="edit_max"
                  type="number"
                  min={1}
                  disabled={maxLocked}
                  aria-invalid={!!errors.max_score}
                  {...register("max_score")}
                />
                {maxLocked ? (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Locked — scores have been entered against this total.
                  </p>
                ) : (
                  errors.max_score && (
                    <p className="text-xs text-[var(--danger)]">{errors.max_score.message}</p>
                  )
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit_date">Date</Label>
                <Input id="edit_date" type="date" aria-invalid={!!errors.date} {...register("date")} />
                {errors.date && <p className="text-xs text-[var(--danger)]">{errors.date.message}</p>}
              </div>
            </div>

            {submitError && <p className="text-sm text-[var(--danger)]">{submitError}</p>}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDeleteAssessmentDialog({
  assessment,
  open,
  onOpenChange,
}: {
  assessment: AssessmentListItemVM;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const deleteAssessment = useDeleteAssessment();

  async function handleConfirm() {
    try {
      await deleteAssessment.mutateAsync({ id: assessment.id });
      toast.success("Assessment deleted", {
        description: `${assessment.title} has been removed.`,
      });
      onOpenChange(false);
    } catch (err) {
      // The common failure is the submitted-scores guard; its message explains why.
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete assessment?</DialogTitle>
          <DialogDescription>
            <strong className="text-[var(--text)]">{assessment.title}</strong> (
            {assessment.class_name} · {assessment.subject_name}) will be removed
            {assessment.result_count > 0
              ? `, along with its ${assessment.result_count} draft ${
                  assessment.result_count === 1 ? "score" : "scores"
                }`
              : ""}
            . An assessment with submitted scores can&apos;t be deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteAssessment.isPending}
          >
            {deleteAssessment.isPending && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            Delete Assessment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
