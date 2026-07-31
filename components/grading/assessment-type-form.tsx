"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useCreateAssessmentType, useUpdateAssessmentType, useDeleteAssessmentType,
} from "@/lib/queries/grading";
import { assessmentTypeCreateSchema, type AssessmentTypeVM } from "@/lib/validators/grading";

type TypeFormInput = z.input<typeof assessmentTypeCreateSchema>;

interface AssessmentTypeFormDialogProps {
  mode: "create" | "edit";
  type?: AssessmentTypeVM;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssessmentTypeFormDialog({ mode, type, open, onOpenChange }: AssessmentTypeFormDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const createType = useCreateAssessmentType();
  const updateType = useUpdateAssessmentType();
  const deleteType = useDeleteAssessmentType();

  const {
    register, handleSubmit, setError, control,
    formState: { errors, isSubmitting },
  } = useForm<TypeFormInput, unknown, z.output<typeof assessmentTypeCreateSchema>>({
    resolver: zodResolver(assessmentTypeCreateSchema),
    defaultValues:
      mode === "edit" && type
        ? { name: type.name, weight: type.weight, is_exam: type.is_exam }
        : { name: "", weight: 0, is_exam: false },
  });

  async function onSubmit(values: z.output<typeof assessmentTypeCreateSchema>) {
    setSubmitError(null);
    try {
      if (mode === "create") {
        await createType.mutateAsync(values);
        toast.success("Assessment type added", { description: `${values.name} (${values.weight}%).` });
      } else if (type) {
        await updateType.mutateAsync({ id: type.id, ...values });
        toast.success("Assessment type updated");
      }
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      if (message.toLowerCase().includes("already exists")) setError("name", { type: "manual", message });
      else setSubmitError(message);
    }
  }

  async function onDelete() {
    if (!type) return;
    try {
      await deleteType.mutateAsync({ id: type.id });
      toast.success("Assessment type removed");
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Couldn't delete this type.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "New assessment type" : "Edit assessment type"}</DialogTitle>
            <DialogDescription>A category of assessment and its weight toward the term total.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="type_name">Name</Label>
              <Input id="type_name" placeholder="Class Test" aria-invalid={!!errors.name} {...register("name")} />
              {errors.name && <p className="text-xs text-[var(--danger)]">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type_weight">Weight %</Label>
              <Input id="type_weight" type="number" inputMode="numeric" aria-invalid={!!errors.weight} {...register("weight")} />
              {errors.weight && <p className="text-xs text-[var(--danger)]">{errors.weight.message}</p>}
            </div>
            <Controller
              control={control}
              name="is_exam"
              render={({ field }) => (
                <label className="flex items-start gap-2 text-sm text-[var(--text)]">
                  <Checkbox
                    checked={field.value ?? false}
                    onCheckedChange={(v) => field.onChange(v === true)}
                    className="mt-0.5"
                  />
                  <span>
                    Counts as exam
                    <span className="block text-xs text-[var(--muted-foreground)]">
                      Feeds the report card&apos;s Exams Score column; everything else is continuous
                      assessment (Class Score).
                    </span>
                  </span>
                </label>
              )}
            />
            {submitError && <p className="text-sm text-[var(--danger)]">{submitError}</p>}
          </div>

          <DialogFooter className="mt-6 sm:justify-between">
            {mode === "edit" ? (
              confirmDelete ? (
                <Button type="button" variant="destructive" disabled={deleteType.isPending} onClick={onDelete}>
                  {deleteType.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  Confirm delete
                </Button>
              ) : (
                <Button type="button" variant="ghost" className="text-[var(--danger)]" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="size-4" aria-hidden="true" /> Delete
                </Button>
              )
            ) : (
              <span />
            )}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {mode === "create" ? "Add type" : "Save changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
