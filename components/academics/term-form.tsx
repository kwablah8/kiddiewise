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
import { useCreateTerm } from "@/lib/queries/academics";
import { termCreateSchema, type TermCreateInput } from "@/lib/validators/academics";

const ORDINAL_OPTIONS = [
  { value: "1", label: "First Term" },
  { value: "2", label: "Second Term" },
  { value: "3", label: "Third Term" },
] as const;

function nameForOrdinal(ordinal: number): string {
  return ORDINAL_OPTIONS.find((o) => Number(o.value) === ordinal)?.label ?? `Term ${ordinal}`;
}

// `termCreateSchema` uses `z.coerce.number()` for `ordinal`, whose input type is effectively
// `unknown` (Zod's coerce schemas accept any raw value and coerce it) — so its input type
// differs from its output type the same way a `.default()` field does elsewhere in this file
// set (see `class-form.tsx` / `student-form.tsx`). RHF needs both: defaultValues satisfy the
// input shape, `onSubmit` receives the resolver's parsed *output*.
type TermFormInput = z.input<typeof termCreateSchema>;

interface TermFormDialogProps {
  academicYearId: string;
  yearName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * "New Term" dialog, scoped to one academic year (create-only). The term's `name` is derived
 * from the chosen ordinal (First/Second/Third Term) rather than free-typed — Ghanaian terms are
 * always one of those three, so exposing a separate text field would only invite typos/duplicates
 * of the same fixed vocabulary. Submitted as a hidden field, same pattern as `student_id` in
 * `LinkGuardianDialog`.
 */
export function TermFormDialog({
  academicYearId,
  yearName,
  open,
  onOpenChange,
}: TermFormDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createTerm = useCreateTerm();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TermFormInput, unknown, TermCreateInput>({
    resolver: zodResolver(termCreateSchema),
    defaultValues: {
      academic_year_id: academicYearId,
      name: nameForOrdinal(1),
      ordinal: 1,
      start_date: "",
      end_date: "",
    },
  });

  async function onSubmit(values: TermCreateInput) {
    setSubmitError(null);
    try {
      await createTerm.mutateAsync(values);
      toast.success("Term created", {
        description: `${values.name} has been added to ${yearName}.`,
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
            <DialogTitle>New term</DialogTitle>
            <DialogDescription>Add a term to {yearName}.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="term_ordinal">Term</Label>
              <Controller
                control={control}
                name="ordinal"
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => {
                      const ordinal = Number(v);
                      field.onChange(ordinal);
                      setValue("name", nameForOrdinal(ordinal));
                    }}
                  >
                    <SelectTrigger id="term_ordinal" className="w-full" aria-invalid={!!errors.ordinal}>
                      <SelectValue placeholder="Select term">
                        {(v: string) => ORDINAL_OPTIONS.find((o) => o.value === v)?.label ?? v}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ORDINAL_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.ordinal && (
                <p className="text-xs text-[var(--danger)]">{errors.ordinal.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="term_start">Start date</Label>
                <Input
                  id="term_start"
                  type="date"
                  aria-invalid={!!errors.start_date}
                  {...register("start_date")}
                />
                {errors.start_date && (
                  <p className="text-xs text-[var(--danger)]">{errors.start_date.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="term_end">End date</Label>
                <Input
                  id="term_end"
                  type="date"
                  aria-invalid={!!errors.end_date}
                  {...register("end_date")}
                />
                {errors.end_date && (
                  <p className="text-xs text-[var(--danger)]">{errors.end_date.message}</p>
                )}
              </div>
            </div>
            {submitError && <p className="text-sm text-[var(--danger)]">{submitError}</p>}
            <input type="hidden" {...register("academic_year_id")} />
            <input type="hidden" {...register("name")} />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Create Term
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
