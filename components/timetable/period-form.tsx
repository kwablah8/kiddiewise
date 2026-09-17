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
import { useCreatePeriod, useUpdatePeriod, useDeletePeriod } from "@/lib/queries/timetable";
import { periodCreateSchema, type PeriodVM } from "@/lib/validators/timetable";

type PeriodFormInput = z.input<typeof periodCreateSchema>;

interface PeriodFormDialogProps {
  mode: "create" | "edit";
  period?: PeriodVM;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PeriodFormDialog({ mode, period, open, onOpenChange }: PeriodFormDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const createPeriod = useCreatePeriod();
  const updatePeriod = useUpdatePeriod();
  const deletePeriod = useDeletePeriod();

  const {
    register, handleSubmit, control,
    formState: { errors, isSubmitting },
  } = useForm<PeriodFormInput, unknown, z.output<typeof periodCreateSchema>>({
    resolver: zodResolver(periodCreateSchema),
    defaultValues:
      mode === "edit" && period
        ? {
            name: period.name,
            start_time: period.start_time.slice(0, 5),
            end_time: period.end_time.slice(0, 5),
            ordinal: period.ordinal,
            is_break: period.is_break,
          }
        : { name: "", start_time: "", end_time: "", ordinal: 1, is_break: false },
  });

  async function onSubmit(values: z.output<typeof periodCreateSchema>) {
    setSubmitError(null);
    try {
      if (mode === "create") {
        await createPeriod.mutateAsync(values);
        toast.success("Period added", { description: values.name });
      } else if (period) {
        await updatePeriod.mutateAsync({ id: period.id, ...values });
        toast.success("Period updated");
      }
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  async function onDelete() {
    if (!period) return;
    try {
      await deletePeriod.mutateAsync({ id: period.id });
      toast.success("Period removed");
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Couldn't delete this period.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "New period" : "Edit period"}</DialogTitle>
            <DialogDescription>
              A time slot shared by every class&apos;s timetable, deleting one clears it from every
              class&apos;s grid too.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="period_name">Name</Label>
              <Input id="period_name" placeholder="Period 1" aria-invalid={!!errors.name} {...register("name")} />
              {errors.name && <p className="text-xs text-[var(--danger)]">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="period_start">Start time</Label>
                <Input id="period_start" type="time" aria-invalid={!!errors.start_time} {...register("start_time")} />
                {errors.start_time && <p className="text-xs text-[var(--danger)]">{errors.start_time.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="period_end">End time</Label>
                <Input id="period_end" type="time" aria-invalid={!!errors.end_time} {...register("end_time")} />
                {errors.end_time && <p className="text-xs text-[var(--danger)]">{errors.end_time.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="period_ordinal">Order</Label>
              <Input id="period_ordinal" type="number" min={1} inputMode="numeric"
                aria-invalid={!!errors.ordinal} {...register("ordinal")} />
              {errors.ordinal && <p className="text-xs text-[var(--danger)]">{errors.ordinal.message}</p>}
            </div>
            <Controller
              control={control}
              name="is_break"
              render={({ field }) => (
                <label className="flex items-start gap-2 text-sm text-[var(--text)]">
                  <Checkbox
                    checked={field.value ?? false}
                    onCheckedChange={(v) => field.onChange(v === true)}
                    className="mt-0.5"
                  />
                  <span>
                    Break / lunch
                    <span className="block text-xs text-[var(--muted-foreground)]">
                      Shown on every class&apos;s grid, but never assignable to a subject.
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
                <Button type="button" variant="destructive" disabled={deletePeriod.isPending} onClick={onDelete}>
                  {deletePeriod.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
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
                {mode === "create" ? "Add period" : "Save changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
