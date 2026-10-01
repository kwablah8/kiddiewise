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
import { ChoicePills, ToggleChips } from "@/components/daily-reports/choice-pills";
import { useClasses } from "@/lib/queries/academics";
import { useCreateExtraFeeStructure, useUpdateExtraFeeStructure } from "@/lib/queries/fees";
import {
  EXTRA_FREQUENCY_LABEL,
  extraFeeStructureCreateSchema,
  type ExtraFeeFrequency,
  type ExtraFeeStructureCreateInput,
  type ExtraFeeStructureVM,
} from "@/lib/validators/fees";

type FormInput = z.input<typeof extraFeeStructureCreateSchema>;
type Scope = "all" | "some";
const FREQUENCIES: ExtraFeeFrequency[] = ["one_time", "termly", "monthly", "annual"];

/** Create an extra fee, or edit one when `structure` is given. */
export function ExtraFeeStructureDialog({
  structure,
  open,
  onOpenChange,
}: {
  structure?: ExtraFeeStructureVM;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = !!structure;
  const charged = (structure?.charge_count ?? 0) > 0;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>(structure && structure.class_ids.length > 0 ? "some" : "all");
  const create = useCreateExtraFeeStructure();
  const update = useUpdateExtraFeeStructure();
  const { data: classes } = useClasses();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, ExtraFeeStructureCreateInput>({
    resolver: zodResolver(extraFeeStructureCreateSchema),
    defaultValues: {
      name: structure?.name ?? "",
      amount: structure?.amount,
      frequency: structure?.frequency ?? "one_time",
      description: structure?.description ?? null,
      class_ids: structure?.class_ids ?? [],
    },
  });

  async function onSubmit(values: ExtraFeeStructureCreateInput) {
    setSubmitError(null);
    const classIds = scope === "all" ? [] : values.class_ids;
    if (scope === "some" && classIds.length === 0) {
      setError("class_ids", { message: "Select at least one class" });
      return;
    }
    try {
      if (structure) {
        await update.mutateAsync({ ...values, class_ids: classIds, id: structure.id });
        toast.success("Extra fee updated", { description: `${values.name} saved.` });
      } else {
        await create.mutateAsync({ ...values, class_ids: classIds });
        toast.success("Extra fee created", { description: `${values.name} added.` });
      }
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
            <DialogTitle>{isEdit ? "Edit Extra Fee" : "Create Extra Fee"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Changes apply to charges raised from now on. Existing charges keep their amount."
                : "Define an optional extra fee (transport, feeding, etc.)."}
            </DialogDescription>
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
                  inputMode="decimal"
                  step="0.01"
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
                    <Select
                      value={field.value ?? "one_time"}
                      onValueChange={(v) => field.onChange(v)}
                      disabled={charged}
                    >
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
                {charged && (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Fixed, because this fee has already been charged.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Offered to</Label>
              <ChoicePills<Scope>
                ariaLabel="Offered to"
                value={scope}
                onChange={(v) => v && setScope(v)}
                options={[
                  { value: "all", label: "All classes" },
                  { value: "some", label: "Specific classes" },
                ]}
              />
              {scope === "some" && (
                <Controller
                  control={control}
                  name="class_ids"
                  render={({ field }) => (
                    <ToggleChips
                      ariaLabel="Classes"
                      values={field.value ?? []}
                      onChange={field.onChange}
                      options={(classes ?? []).map((c) => ({ value: c.id, label: c.name }))}
                    />
                  )}
                />
              )}
              {errors.class_ids && (
                <p className="text-xs text-[var(--danger)]">{errors.class_ids.message}</p>
              )}
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
              {isEdit ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
