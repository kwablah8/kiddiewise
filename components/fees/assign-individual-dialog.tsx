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
import { useStudents } from "@/lib/queries/people";
import { useAssignIndividualFee } from "@/lib/queries/fees";
import {
  FEE_TERM_LABEL,
  SCHOLARSHIP_LABEL,
  assignIndividualFeeSchema,
  type AssignIndividualFeeInput,
  type FeeTerm,
  type ScholarshipType,
} from "@/lib/validators/fees";

type FormInput = z.input<typeof assignIndividualFeeSchema>;
const TERMS: FeeTerm[] = ["full_year", "first", "second", "third"];
const SCHOLARSHIPS: ScholarshipType[] = ["none", "partial", "full", "bursary"];

export function AssignIndividualDialog({
  classId,
  open,
  onOpenChange,
}: {
  classId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const assign = useAssignIndividualFee();
  const { data: students } = useStudents(classId ? { class_id: classId } : {});
  const studentOptions = students ?? [];

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, AssignIndividualFeeInput>({
    resolver: zodResolver(assignIndividualFeeSchema),
    defaultValues: {
      student_id: "",
      amount: undefined,
      term: "full_year",
      due_date: null,
      scholarship_type: "none",
      discount: 0,
    },
  });

  async function onSubmit(values: AssignIndividualFeeInput) {
    setSubmitError(null);
    try {
      await assign.mutateAsync(values);
      const student = studentOptions.find((s) => s.id === values.student_id);
      toast.success("Fee assigned", {
        description: student
          ? `Assigned to ${student.first_name} ${student.last_name}.`
          : "Fee assigned to the student.",
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
            <DialogTitle>Assign Fee to a Student</DialogTitle>
            <DialogDescription>Assign an individual fee to one student.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ai_student">Student</Label>
              <Controller
                control={control}
                name="student_id"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={(v) => field.onChange(v ?? "")}>
                    <SelectTrigger id="ai_student" className="w-full" aria-invalid={!!errors.student_id}>
                      <SelectValue placeholder="Select student">
                        {(v: string) => {
                          const s = studentOptions.find((x) => x.id === v);
                          return s ? `${s.first_name} ${s.last_name}` : "Select student";
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {studentOptions.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.first_name} {s.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.student_id && (
                <p className="text-xs text-[var(--danger)]">{errors.student_id.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ai_amount">Amount (₵)</Label>
                <Input
                  id="ai_amount"
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
                <Label htmlFor="ai_term">Term</Label>
                <Controller
                  control={control}
                  name="term"
                  render={({ field }) => (
                    <Select value={field.value ?? "full_year"} onValueChange={(v) => field.onChange(v)}>
                      <SelectTrigger id="ai_term" className="w-full">
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
                <Label htmlFor="ai_due">Due date</Label>
                <Input
                  id="ai_due"
                  type="date"
                  {...register("due_date", { setValueAs: (v) => (v === "" ? null : v) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ai_discount">Discount (%)</Label>
                <Input
                  id="ai_discount"
                  type="number"
                  inputMode="numeric"
                  {...register("discount", { setValueAs: (v) => (v === "" ? 0 : Number(v)) })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ai_scholarship">Scholarship type</Label>
              <Controller
                control={control}
                name="scholarship_type"
                render={({ field }) => (
                  <Select value={field.value ?? "none"} onValueChange={(v) => field.onChange(v)}>
                    <SelectTrigger id="ai_scholarship" className="w-full">
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
              Assign Fee
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
