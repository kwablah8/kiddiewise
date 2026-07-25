"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
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
  useCreateGradeBand,
  useUpdateGradeBand,
  useDeleteGradeBand,
} from "@/lib/queries/grading";
import { gradeBandCreateSchema, type GradeBandVM } from "@/lib/validators/grading";

type GradeBandFormInput = z.input<typeof gradeBandCreateSchema>;

interface GradeBandFormDialogProps {
  mode: "create" | "edit";
  band?: GradeBandVM;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GradeBandFormDialog({ mode, band, open, onOpenChange }: GradeBandFormDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const createBand = useCreateGradeBand();
  const updateBand = useUpdateGradeBand();
  const deleteBand = useDeleteGradeBand();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GradeBandFormInput, unknown, z.output<typeof gradeBandCreateSchema>>({
    resolver: zodResolver(gradeBandCreateSchema),
    defaultValues:
      mode === "edit" && band
        ? { min_score: band.min_score, max_score: band.max_score, grade: band.grade, remark: band.remark }
        : { min_score: 0, max_score: 0, grade: "", remark: "" },
  });

  async function onSubmit(values: z.output<typeof gradeBandCreateSchema>) {
    setSubmitError(null);
    try {
      if (mode === "create") {
        await createBand.mutateAsync(values);
        toast.success("Grade band added", { description: `${values.grade} (${values.min_score}–${values.max_score}%).` });
      } else if (band) {
        await updateBand.mutateAsync({ id: band.id, ...values });
        toast.success("Grade band updated");
      }
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  async function onDelete() {
    if (!band) return;
    try {
      await deleteBand.mutateAsync({ id: band.id });
      toast.success("Grade band removed");
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Couldn't delete this band.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "New grade band" : "Edit grade band"}</DialogTitle>
            <DialogDescription>A percentage range that maps to a grade and remark.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="min_score">Min %</Label>
                <Input id="min_score" type="number" inputMode="numeric" aria-invalid={!!errors.min_score} {...register("min_score")} />
                {errors.min_score && <p className="text-xs text-[var(--danger)]">{errors.min_score.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max_score">Max %</Label>
                <Input id="max_score" type="number" inputMode="numeric" aria-invalid={!!errors.max_score} {...register("max_score")} />
                {errors.max_score && <p className="text-xs text-[var(--danger)]">{errors.max_score.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="grade">Grade</Label>
                <Input id="grade" placeholder="A" aria-invalid={!!errors.grade} {...register("grade")} />
                {errors.grade && <p className="text-xs text-[var(--danger)]">{errors.grade.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="remark">Remark</Label>
                <Input id="remark" placeholder="Excellent" aria-invalid={!!errors.remark} {...register("remark")} />
                {errors.remark && <p className="text-xs text-[var(--danger)]">{errors.remark.message}</p>}
              </div>
            </div>
            {submitError && <p className="text-sm text-[var(--danger)]">{submitError}</p>}
          </div>

          <DialogFooter className="mt-6 sm:justify-between">
            {mode === "edit" ? (
              confirmDelete ? (
                <Button type="button" variant="destructive" disabled={deleteBand.isPending} onClick={onDelete}>
                  {deleteBand.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
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
                {mode === "create" ? "Add band" : "Save changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
