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
import { useRecordPayment } from "@/lib/queries/fees";
import {
  PAYMENT_METHOD_LABEL,
  recordPaymentSchema,
  type PaymentMethod,
  type RecordPaymentInput,
  type StudentFeeVM,
} from "@/lib/validators/fees";
import { formatGHS } from "@/lib/format";

type FormInput = z.input<typeof recordPaymentSchema>;
const METHODS: PaymentMethod[] = ["cash", "bank_transfer", "mobile_money", "cheque", "other"];

/** Record a payment against one student's fees. `paid` is derived from payments, so saving here
 *  updates the student's balance/status, the Overview, and Payment History together. */
export function RecordPaymentDialog({
  target,
  onClose,
}: {
  target: StudentFeeVM;
  onClose: () => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const record = useRecordPayment();
  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, RecordPaymentInput>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      student_id: target.student_id,
      amount: target.balance > 0 ? target.balance : undefined,
      method: "cash",
      reference: null,
      paid_at: today,
      fee_label: "School fees",
    },
  });

  async function onSubmit(values: RecordPaymentInput) {
    setSubmitError(null);
    try {
      await record.mutateAsync(values);
      toast.success("Payment recorded", {
        description: `${formatGHS(values.amount)} for ${target.student_name}.`,
      });
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>{target.student_name}</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-[var(--bg)] px-3 py-2 text-sm">
              <span className="text-[var(--muted-foreground)]">Outstanding balance</span>
              <span className="font-semibold text-[var(--text)]">{formatGHS(target.balance)}</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="rp_amount">Amount (₵)</Label>
                <Input
                  id="rp_amount"
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
                <Label htmlFor="rp_date">Date</Label>
                <Input
                  id="rp_date"
                  type="date"
                  aria-invalid={!!errors.paid_at}
                  {...register("paid_at")}
                />
                {errors.paid_at && (
                  <p className="text-xs text-[var(--danger)]">{errors.paid_at.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rp_method">Method</Label>
              <Controller
                control={control}
                name="method"
                render={({ field }) => (
                  <Select value={field.value ?? "cash"} onValueChange={(v) => field.onChange(v)}>
                    <SelectTrigger id="rp_method" className="w-full">
                      <SelectValue>
                        {(v: string) => PAYMENT_METHOD_LABEL[v as PaymentMethod] ?? "Cash"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {PAYMENT_METHOD_LABEL[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rp_ref">Reference</Label>
              <Input
                id="rp_ref"
                placeholder="Optional (receipt / transaction no.)"
                {...register("reference", { setValueAs: (v) => (v === "" ? null : v) })}
              />
            </div>

            {submitError && <p className="text-sm text-[var(--danger)]">{submitError}</p>}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
