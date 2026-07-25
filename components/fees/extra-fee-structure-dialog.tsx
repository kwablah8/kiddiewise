"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateExtraFeeStructure } from "@/lib/queries/fees";
import {
  EXTRA_FREQUENCY_LABEL,
  extraFeeStructureCreateSchema,
  type ExtraFeeFrequency,
  type ExtraFeeStructureCreateInput,
} from "@/lib/validators/fees";

type FormInput = z.input<typeof extraFeeStructureCreateSchema>;
const FREQUENCIES: ExtraFeeFrequency[] = ["one_time", "termly", "monthly", "annual"];

export function ExtraFeeStructureDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const create = useCreateExtraFeeStructure();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, ExtraFeeStructureCreateInput>({
    resolver: zodResolver(extraFeeStructureCreateSchema),
    defaultValues: { name: "", amount: undefined, frequency: "one_time", description: null },
  });

  async function onSubmit(values: ExtraFeeStructureCreateInput) {
    setSubmitError(null);
    try {
      await create.mutateAsync(values);
      toast.success("Extra fee created", { description: `${values.name} added.` });
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
            <DialogTitle>Create Extra Fee Structure</DialogTitle>
            <DialogDescription>Define an optional extra fee (transport, feeding, etc.).</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ef_name">Name</Label>
              <Input
                id="ef_name"
                placeholder="e.g. School Bus"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              {errors.name && <p className="text-xs text-[var(--danger)]">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ef_amount">Amount (₵)</Label>
                <Input
                  id="ef_amount"
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
                <Label htmlFor="ef_freq">Frequency</Label>
                <Controller
                  control={control}
                  name="frequency"
                  render={({ field }) => (
                    <Select value={field.value ?? "one_time"} onValueChange={(v) => field.onChange(v)}>
                      <SelectTrigger id="ef_freq" className="w-full">
                        <SelectValue>
                          {(v: string) => EXTRA_FREQUENCY_LABEL[v as ExtraFeeFrequency] ?? "One-time"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCIES.map((f) => (
                          <SelectItem key={f} value={f}>
                            {EXTRA_FREQUENCY_LABEL[f]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ef_desc">Description</Label>
              <Input
                id="ef_desc"
                placeholder="Optional"
                {...register("description", { setValueAs: (v) => (v === "" ? null : v) })}
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
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
