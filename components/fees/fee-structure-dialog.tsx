"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAcademicYears, useClasses } from "@/lib/queries/academics";
import { useCreateFeeStructure } from "@/lib/queries/fees";
import {
  FEE_TERM_LABEL,
  feeStructureCreateSchema,
  type FeeStructureCreateInput,
  type FeeTerm,
} from "@/lib/validators/fees";

type FeeStructureFormInput = z.input<typeof feeStructureCreateSchema>;

const TERMS: FeeTerm[] = ["full_year", "first", "second", "third"];

export function FeeStructureDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data: classes } = useClasses();
  const { data: years } = useAcademicYears();
  const createFeeStructure = useCreateFeeStructure();
  const classOptions = classes ?? [];
  const yearOptions = years ?? [];

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FeeStructureFormInput, unknown, FeeStructureCreateInput>({
    resolver: zodResolver(feeStructureCreateSchema),
    defaultValues: {
      class_id: "",
      academic_year_id: "",
      term: "full_year",
      amount: undefined,
      due_date: null,
      late_fee: null,
      description: null,
      is_mandatory: true,
    },
  });

  async function onSubmit(values: FeeStructureCreateInput) {
    setSubmitError(null);
    try {
      await createFeeStructure.mutateAsync(values);
      toast.success("Fee structure created", {
        description: `${FEE_TERM_LABEL[values.term]} fee added.`,
      });
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
            <DialogTitle>Create Fee Structure</DialogTitle>
            <DialogDescription>Define a fee for a class, year and term.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 max-h-[62vh] space-y-4 overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label htmlFor="fs_class">Class</Label>
              <Controller
                control={control}
                name="class_id"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={(v) => field.onChange(v ?? "")}>
                    <SelectTrigger id="fs_class" className="w-full" aria-invalid={!!errors.class_id}>
                      <SelectValue placeholder="Select class">
                        {(v: string) => classOptions.find((c) => c.id === v)?.name ?? "Select class"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {classOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.class_id && (
                <p className="text-xs text-[var(--danger)]">{errors.class_id.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fs_year">Academic year</Label>
              <Controller
                control={control}
                name="academic_year_id"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={(v) => field.onChange(v ?? "")}>
                    <SelectTrigger id="fs_year" className="w-full" aria-invalid={!!errors.academic_year_id}>
                      <SelectValue placeholder="Select year">
                        {(v: string) => yearOptions.find((y) => y.id === v)?.name ?? "Select year"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((y) => (
                        <SelectItem key={y.id} value={y.id}>
                          {y.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.academic_year_id && (
                <p className="text-xs text-[var(--danger)]">{errors.academic_year_id.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fs_term">Term</Label>
                <Controller
                  control={control}
                  name="term"
                  render={({ field }) => (
                    <Select value={field.value ?? "full_year"} onValueChange={(v) => field.onChange(v)}>
                      <SelectTrigger id="fs_term" className="w-full">
                        <SelectValue>{(v: string) => FEE_TERM_LABEL[v as FeeTerm] ?? "Full Year"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {TERMS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {FEE_TERM_LABEL[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fs_amount">Amount (₵)</Label>
                <Input
                  id="fs_amount"
                  type="number"
                  inputMode="numeric"
                  placeholder="Enter amount"
                  aria-invalid={!!errors.amount}
                  {...register("amount", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
                />
                {errors.amount && (
                  <p className="text-xs text-[var(--danger)]">{errors.amount.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fs_due">Due date</Label>
                <Input
                  id="fs_due"
                  type="date"
                  {...register("due_date", { setValueAs: (v) => (v === "" ? null : v) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fs_late">Late fee (₵)</Label>
                <Input
                  id="fs_late"
                  type="number"
                  inputMode="numeric"
                  placeholder="Optional"
                  {...register("late_fee", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fs_desc">Description</Label>
              <Input
                id="fs_desc"
                placeholder="Optional"
                {...register("description", { setValueAs: (v) => (v === "" ? null : v) })}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-[var(--text)]">
              <input
                type="checkbox"
                className="size-4 rounded border-[var(--border)] accent-[var(--primary)]"
                {...register("is_mandatory")}
              />
              Mandatory fee
            </label>

            {submitError && <p className="text-sm text-[var(--danger)]">{submitError}</p>}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
