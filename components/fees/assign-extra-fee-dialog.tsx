"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchField } from "@/components/data/search-field";
import { ChoicePills, ToggleChips } from "@/components/daily-reports/choice-pills";
import { useActiveContext, useClasses } from "@/lib/queries/academics";
import { useStudents } from "@/lib/queries/people";
import { useAssignExtraFee } from "@/lib/queries/fees";
import { defaultChargePeriod } from "@/lib/fees/extra";
import { matchesQuery } from "@/lib/search";
import { formatGHS } from "@/lib/format";
import {
  EXTRA_FREQUENCY_LABEL,
  FEE_TERM_LABEL,
  assignExtraFeeSchema,
  type ExtraFeeStructureVM,
  type ExtraFeeTarget,
  type FeeTerm,
} from "@/lib/validators/fees";

type Mode = ExtraFeeTarget["kind"];
const TERMS: FeeTerm[] = ["first", "second", "third"];
type FieldErrors = Partial<Record<"fee" | "target" | "period" | "amount", string>>;

/**
 * Charge an extra fee for one period of the active year, to every student, to chosen classes or to
 * chosen students. Given `student`, the target is fixed to that one student (the student profile).
 *
 * Plain state rather than react-hook-form: the target is a union whose fields come and go with the
 * mode, and the whole thing is checked once against assignExtraFeeSchema on submit.
 */
export function AssignExtraFeeDialog({
  fees,
  initialFeeId,
  student,
  open,
  onOpenChange,
}: {
  fees: ExtraFeeStructureVM[];
  initialFeeId?: string;
  student?: { id: string; name: string; class_id: string | null };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const assign = useAssignExtraFee();
  const { data: active } = useActiveContext();
  const { data: classes } = useClasses();
  const { data: students } = useStudents();
  const activeYear = active?.active_year ?? null;
  const activeTermOrdinal = active?.active_term?.ordinal ?? null;

  // Only the fees this student's class is offered, when charging one student.
  const feeOptions = student
    ? fees.filter((f) => f.class_ids.length === 0 || (student.class_id && f.class_ids.includes(student.class_id)))
    : fees;

  // Choices start null and fall back to defaults derived on each render, so a fee list or active
  // term that arrives after the dialog opens still lands in the form.
  const [feeChoice, setFeeChoice] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("all");
  const [classIds, setClassIds] = useState<string[]>([]);
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [studentQuery, setStudentQuery] = useState("");
  const [termChoice, setTermChoice] = useState<FeeTerm | null>(null);
  const [monthChoice, setMonthChoice] = useState<string | null>(null);
  const [amountChoice, setAmountChoice] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const feeId =
    feeChoice ??
    (feeOptions.find((f) => f.id === initialFeeId) ?? (feeOptions.length === 1 ? feeOptions[0] : undefined))
      ?.id ??
    "";
  const fee = feeOptions.find((f) => f.id === feeId);
  const periodDefault = fee ? defaultChargePeriod(fee.frequency, activeTermOrdinal, new Date()) : null;
  const feeTerm: FeeTerm =
    termChoice ?? (periodDefault && periodDefault.fee_term !== "full_year" ? periodDefault.fee_term : "first");
  const month = monthChoice ?? periodDefault?.billing_month ?? "";
  const amount = amountChoice ?? (fee ? String(fee.amount) : "");
  const isOffered = (classId: string | null) =>
    !!classId && (!fee || fee.class_ids.length === 0 || fee.class_ids.includes(classId));
  const classOptions = (classes ?? []).filter((c) => isOffered(c.id));
  // Students enrolled this year, in a class the fee is offered to.
  const eligible = (students ?? []).filter(
    (s) => s.enrollment_status === "active" && isOffered(s.class_id),
  );
  const pickList = eligible.filter((s) =>
    matchesQuery(studentQuery, `${s.first_name} ${s.last_name}`, s.class_name, s.admission_no),
  );

  const reach = student
    ? 1
    : mode === "all"
      ? eligible.length
      : mode === "classes"
        ? eligible.filter((s) => s.class_id && classIds.includes(s.class_id)).length
        : studentIds.length;

  function chooseFee(id: string) {
    setFeeChoice(id);
    // A different fee has its own price, period and classes, so start those over.
    setClassIds([]);
    setStudentIds([]);
    setTermChoice(null);
    setMonthChoice(null);
    setAmountChoice(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const target: ExtraFeeTarget = student
      ? { kind: "students", student_ids: [student.id] }
      : mode === "all"
        ? { kind: "all" }
        : mode === "classes"
          ? { kind: "classes", class_ids: classIds }
          : { kind: "students", student_ids: studentIds };

    const parsed = assignExtraFeeSchema.safeParse({
      extra_fee_item_id: feeId,
      target,
      fee_term: fee?.frequency === "termly" ? feeTerm : "full_year",
      billing_month: fee?.frequency === "monthly" ? month || null : null,
      amount: amount === "" ? undefined : amount,
    });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        const field =
          key === "extra_fee_item_id" ? "fee" : key === "billing_month" ? "period" : key === "target" ? "target" : "amount";
        next[field] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});

    try {
      const { charged, alreadyCharged } = await assign.mutateAsync(parsed.data);
      if (charged === 0 && alreadyCharged === 0) {
        setSubmitError("There are no enrolled students to charge for this selection.");
        return;
      }
      toast.success(charged > 0 ? "Extra fee charged" : "Nothing new to charge", {
        description:
          (charged > 0
            ? `${fee?.name} charged to ${charged} student${charged === 1 ? "" : "s"}.`
            : "") +
          (alreadyCharged > 0
            ? ` ${alreadyCharged} already had this charge for the period and ${alreadyCharged === 1 ? "was" : "were"} skipped.`
            : ""),
      });
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>Assign Extra Fee</DialogTitle>
            <DialogDescription>
              {student
                ? `Charge an extra fee to ${student.name}.`
                : "Charge an extra fee to every student, to whole classes, or to chosen students."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {!activeYear && (
              <p className="rounded-lg bg-[var(--bg)] px-3 py-2 text-sm text-[var(--danger)]">
                Set an active academic year before charging extra fees.
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="ax_fee">Fee</Label>
              <Select value={feeId || null} onValueChange={(v) => v && chooseFee(v)}>
                <SelectTrigger id="ax_fee" className="w-full" aria-invalid={!!errors.fee}>
                  <SelectValue placeholder="Select a fee">
                    {(v: string) => {
                      const f = feeOptions.find((x) => x.id === v);
                      return f ? `${f.name} · ${EXTRA_FREQUENCY_LABEL[f.frequency]}` : "Select a fee";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {feeOptions.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name} · {EXTRA_FREQUENCY_LABEL[f.frequency]} · {formatGHS(f.amount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fee && fee.class_ids.length > 0 && (
                <p className="text-xs text-[var(--muted-foreground)]">Offered to {fee.scope} only.</p>
              )}
              {errors.fee && <p className="text-xs text-[var(--danger)]">{errors.fee}</p>}
            </div>

            {!student && (
              <div className="space-y-2">
                <Label>Charge to</Label>
                <ChoicePills<Mode>
                  ariaLabel="Charge to"
                  value={mode}
                  onChange={(v) => v && setMode(v)}
                  options={[
                    { value: "all", label: "All students" },
                    { value: "classes", label: "Classes" },
                    { value: "students", label: "Students" },
                  ]}
                />

                {mode === "classes" &&
                  (classOptions.length > 0 ? (
                    <ToggleChips
                      ariaLabel="Classes"
                      values={classIds}
                      onChange={setClassIds}
                      options={classOptions.map((c) => ({ value: c.id, label: c.name }))}
                    />
                  ) : (
                    <p className="text-sm text-[var(--muted-foreground)]">No classes to choose from.</p>
                  ))}

                {mode === "students" && (
                  <div className="rounded-lg border border-[var(--border)] p-2">
                    <SearchField
                      value={studentQuery}
                      onChange={setStudentQuery}
                      placeholder="Search by name, class or admission no."
                      label="Search students"
                      className="mb-2"
                    />
                    <ul className="max-h-56 space-y-0.5 overflow-y-auto">
                      {pickList.map((s) => {
                        const checked = studentIds.includes(s.id);
                        return (
                          <li key={s.id}>
                            <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-[var(--bg)]">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) =>
                                  setStudentIds((ids) =>
                                    v === true ? [...ids, s.id] : ids.filter((id) => id !== s.id),
                                  )
                                }
                              />
                              <span className="min-w-0 flex-1 truncate text-[var(--text)]">
                                {s.first_name} {s.last_name}
                              </span>
                              <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                                {s.class_name}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                      {pickList.length === 0 && (
                        <li className="px-2 py-3 text-sm text-[var(--muted-foreground)]">
                          No matching students.
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {errors.target && <p className="text-xs text-[var(--danger)]">{errors.target}</p>}
              </div>
            )}

            {fee && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  {fee.frequency === "termly" ? (
                    <>
                      <Label htmlFor="ax_term">Term</Label>
                      <Select value={feeTerm} onValueChange={(v) => v && setTermChoice(v as FeeTerm)}>
                        <SelectTrigger id="ax_term" className="w-full">
                          <SelectValue>{(v: string) => FEE_TERM_LABEL[v as FeeTerm]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {TERMS.map((t) => (
                            <SelectItem key={t} value={t}>
                              {FEE_TERM_LABEL[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  ) : fee.frequency === "monthly" ? (
                    <>
                      <Label htmlFor="ax_month">Month</Label>
                      <Input
                        id="ax_month"
                        type="month"
                        value={month}
                        min={activeYear?.start_date.slice(0, 7)}
                        max={activeYear?.end_date.slice(0, 7)}
                        aria-invalid={!!errors.period}
                        onChange={(e) => setMonthChoice(e.target.value)}
                      />
                    </>
                  ) : (
                    <>
                      <Label>Period</Label>
                      <p className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]">
                        {activeYear ? `Full year, ${activeYear.name}` : "Full year"}
                      </p>
                    </>
                  )}
                  {errors.period && <p className="text-xs text-[var(--danger)]">{errors.period}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ax_amount">Amount per student (₵)</Label>
                  <Input
                    id="ax_amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={amount}
                    aria-invalid={!!errors.amount}
                    onChange={(e) => setAmountChoice(e.target.value)}
                  />
                  {errors.amount && <p className="text-xs text-[var(--danger)]">{errors.amount}</p>}
                </div>
              </div>
            )}

            {fee && !student && (
              <p className="text-sm text-[var(--muted-foreground)]">
                Charges up to {reach} student{reach === 1 ? "" : "s"}. Anyone already charged for
                this period is skipped.
              </p>
            )}

            {submitError && <p className="text-sm text-[var(--danger)]">{submitError}</p>}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={assign.isPending || !activeYear}>
              {assign.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Assign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
