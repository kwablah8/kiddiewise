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
import { useBulkAssignFees } from "@/lib/queries/fees";
import {
  FEE_TERM_LABEL,
  SCHOLARSHIP_LABEL,
  bulkAssignFeesSchema,
  type BulkAssignFeesInput,
  type FeeTerm,
  type ScholarshipType,
} from "@/lib/validators/fees";

type FormInput = z.input<typeof bulkAssignFeesSchema>;
const TERMS: FeeTerm[] = ["full_year", "first", "second", "third"];
const SCHOLARSHIPS: ScholarshipType[] = ["none", "partial", "full", "bursary"];

export function BulkAssignDialog({
  classId,
  className,
  open,
  onOpenChange,
}: {
  classId: string;
  className: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const bulkAssign = useBulkAssignFees();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, BulkAssignFeesInput>({
    resolver: zodResolver(bulkAssignFeesSchema),
    defaultValues: {
      class_id: classId,
      amount: undefined,
      term: "full_year",
      due_date: null,
      scholarship_type: "none",
      discount: 0,
    },
  });

  async function onSubmit(values: BulkAssignFeesInput) {
    setSubmitError(null);
    try {
      const { count } = await bulkAssign.mutateAsync(values);
      toast.success("Fees assigned", {
        description: `Assigned to ${count} student${count === 1 ? "" : "s"} in ${className}.`,
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
            <DialogTitle>Bulk Assign Fees</DialogTitle>
            <DialogDescription>Assign a fee to every student in {className}.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Class</Label>
              <p className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm font-medium text-[var(--text)]">
                {className}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ba_amount">Amount (₵)</Label>
                <Input
                  id="ba_amount"
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
              <div className="space-y-1.5">
                <Label htmlFor="ba_term">Term</Label>
                <Controller
                  control={control}
                  name="term"
                  render={({ field }) => (
                    <Select value={field.value ?? "full_year"} onValueChange={(v) => field.onChange(v)}>
                      <SelectTrigger id="ba_term" className="w-full">
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
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ba_due">Due date</Label>
                <Input
                  id="ba_due"
                  type="date"
                  {...register("due_date", { setValueAs: (v) => (v === "" ? null : v) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ba_discount">Discount (%)</Label>
                <Input
                  id="ba_discount"
                  type="number"
                  inputMode="numeric"
                  aria-invalid={!!errors.discount}
                  {...register("discount", { setValueAs: (v) => (v === "" ? 0 : Number(v)) })}
                />
                {errors.discount && (
                  <p className="text-xs text-[var(--danger)]">{errors.discount.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ba_scholarship">Scholarship type</Label>
              <Controller
                control={control}
                name="scholarship_type"
                render={({ field }) => (
                  <Select value={field.value ?? "none"} onValueChange={(v) => field.onChange(v)}>
                    <SelectTrigger id="ba_scholarship" className="w-full">
                      <SelectValue>
                        {(v: string) => SCHOLARSHIP_LABEL[v as ScholarshipType] ?? "No Scholarship"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {SCHOLARSHIPS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {SCHOLARSHIP_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {submitError && <p className="text-sm text-[var(--danger)]">{submitError}</p>}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Assign Fees
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
