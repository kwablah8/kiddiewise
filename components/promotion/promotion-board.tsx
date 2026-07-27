"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GraduationCap, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { useAcademicYears, useClasses } from "@/lib/queries/academics";
import { usePromotionCandidates, usePromoteStudents } from "@/lib/queries/promotion";
import { describePromotion, hasWork, summarizeDecisions } from "@/lib/promotion";
import {
  PROMOTION_DECISION_LABEL,
  type PromotionCandidateVM,
  type PromotionDecision,
} from "@/lib/validators/promotion";
import { formatGHS } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

const DECISIONS: PromotionDecision[] = ["promote", "repeat", "graduate", "skip"];

/**
 * End-of-year promotion for one class.
 *
 * Deliberately one class at a time, not the whole school in a single sweep. Promotion is the least
 * reversible thing an admin does here — it decides where every child sits for a year — and a
 * screen that moved 250 pupils on one button would be reviewed by nobody.
 *
 * Nothing about the destination is inferred. Class levels in real data are typed by hand and drift
 * ("Primary" vs "Primary ", a JHS class levelled Pre-school), so guessing the next class from a
 * name or a level would put children in the wrong room and do it silently. The admin picks.
 */
export function PromotionBoard() {
  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: years, isLoading: yearsLoading } = useAcademicYears();

  const [sourceClassId, setSourceClassId] = useState<string | null>(null);
  const [targetClassId, setTargetClassId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, PromotionDecision>>({});

  const yearList = useMemo(() => years ?? [], [years]);
  const activeYear = yearList.find((y) => y.is_active) ?? null;

  const [sourceYearId, setSourceYearId] = useState<string | null>(null);
  const [targetYearId, setTargetYearId] = useState<string | null>(null);

  const effectiveSourceYearId = sourceYearId ?? activeYear?.id ?? null;

  // The year they are moving INTO: the next one that starts after the source year. Falling back to
  // "any other year" would happily offer to promote pupils backwards into a finished year.
  const suggestedTargetYear = useMemo(() => {
    const source = yearList.find((y) => y.id === effectiveSourceYearId);
    if (!source) return null;
    return (
      yearList
        .filter((y) => y.id !== source.id && y.start_date > source.start_date)
        .sort((a, b) => a.start_date.localeCompare(b.start_date))[0] ?? null
    );
  }, [yearList, effectiveSourceYearId]);

  const effectiveTargetYearId = targetYearId ?? suggestedTargetYear?.id ?? null;

  const { data, isLoading, isError, refetch } = usePromotionCandidates(
    sourceClassId,
    effectiveSourceYearId,
  );
  const promote = usePromoteStudents();

  const candidates = data ?? [];
  const decisionList = candidates.map((c) => ({
    student_id: c.student_id,
    // Promote is the default because it is what happens to most children most years. The rows that
    // need thought are the exceptions, and those are the ones an admin will actually change.
    decision: decisions[c.student_id] ?? ("promote" as PromotionDecision),
  }));
  const summary = summarizeDecisions(decisionList);

  const sourceClass = (classes ?? []).find((c) => c.id === sourceClassId) ?? null;
  const targetClass = (classes ?? []).find((c) => c.id === targetClassId) ?? null;
  const targetYear = yearList.find((y) => y.id === effectiveTargetYearId) ?? null;

  const ready = !!sourceClassId && !!effectiveSourceYearId && !!effectiveTargetYearId && !!targetClassId;

  function setAll(decision: PromotionDecision) {
    setDecisions(Object.fromEntries(candidates.map((c) => [c.student_id, decision])));
  }

  async function run() {
    if (!ready) return;
    try {
      const result = await promote.mutateAsync({
        source_class_id: sourceClassId,
        source_year_id: effectiveSourceYearId,
        target_year_id: effectiveTargetYearId,
        target_class_id: targetClassId,
        decisions: decisionList,
      });
      setConfirming(false);
      setDecisions({});
      toast.success("Promotion complete", {
        description: describePromotion(
          result,
          targetClass?.name ?? "the next class",
          targetYear?.name ?? "next year",
        ),
      });
    } catch (err) {
      toast.error("Couldn't complete the promotion", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }

  const columns: DataTableColumn<PromotionCandidateVM>[] = [
    {
      key: "name",
      header: "Student",
      render: (r) => (
        <div className="min-w-0">
          <p className="font-medium text-[var(--text)]">{r.student_name}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{r.admission_no}</p>
        </div>
      ),
    },
    {
      key: "average",
      header: "Year average",
      align: "right",
      // A dash, not 0%. "No reports published" and "scored nothing" are different facts, and only
      // one of them is a reason to hold a child back.
      render: (r) =>
        r.year_average === null ? (
          <span className="text-[var(--muted-foreground)]">—</span>
        ) : (
          `${r.year_average}%`
        ),
    },
    {
      key: "attendance",
      header: "Attendance",
      align: "right",
      hideOnMobile: true,
      render: (r) =>
        r.attendance_rate === null ? (
          <span className="text-[var(--muted-foreground)]">—</span>
        ) : (
          `${r.attendance_rate}%`
        ),
    },
    {
      key: "outstanding",
      header: "Fees owed",
      align: "right",
      hideOnMobile: true,
      render: (r) =>
        r.outstanding > 0 ? (
          <span className="font-medium text-[var(--danger)]">{formatGHS(r.outstanding)}</span>
        ) : (
          <span className="text-[var(--muted-foreground)]">—</span>
        ),
    },
    {
      key: "decision",
      header: "Decision",
      align: "right",
      render: (r) => (
        <Select
          value={decisions[r.student_id] ?? "promote"}
          onValueChange={(v) =>
            setDecisions((d) => ({ ...d, [r.student_id]: v as PromotionDecision }))
          }
        >
          <SelectTrigger className="ml-auto h-9 w-40" aria-label={`Decision for ${r.student_name}`}>
            <SelectValue>
              {(v: string) => PROMOTION_DECISION_LABEL[v as PromotionDecision]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {DECISIONS.map((d) => (
              <SelectItem key={d} value={d}>
                {PROMOTION_DECISION_LABEL[d]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
  ];

  // No future year means promotion cannot happen at all. Said here, before any selection, rather
  // than as an error after the admin has filled the whole form in.
  const noFutureYear = !yearsLoading && yearList.length > 0 && !suggestedTargetYear;

  return (
    <div className="space-y-6">
      {noFutureYear && (
        <div
          className={cn(
            cardShellClass,
            "flex flex-wrap items-center justify-between gap-3 border-[var(--warning-border,var(--border))]",
          )}
        >
          <div className="flex items-start gap-2.5">
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0 text-[var(--warning-fg,var(--text))]"
              aria-hidden="true"
            />
            <p className="text-sm text-[var(--text)]">
              There is no academic year after this one, so there is nowhere to promote students to.
              Create next year first.
            </p>
          </div>
          <Link href="/academic" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Go to Academic Years
          </Link>
        </div>
      )}

      <div className={cn(cardShellClass, "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4")}>
        <Field label="Current year">
          <Select
            value={effectiveSourceYearId ?? ""}
            onValueChange={(v) => {
              setSourceYearId(v || null);
              // The suggested destination depends on the source, so a changed source invalidates a
              // destination the admin may have picked by hand.
              setTargetYearId(null);
            }}
            disabled={yearsLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a year">
                {(v: string) => yearList.find((y) => y.id === v)?.name ?? "Select a year"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {yearList.map((y) => (
                <SelectItem key={y.id} value={y.id}>
                  {y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Class to promote">
          <Select
            value={sourceClassId ?? ""}
            onValueChange={(v) => {
              setSourceClassId(v || null);
              setDecisions({});
            }}
            disabled={classesLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a class">
                {(v: string) => (classes ?? []).find((c) => c.id === v)?.name ?? "Select a class"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(classes ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} · {c.level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Moving into year">
          <Select
            value={effectiveTargetYearId ?? ""}
            onValueChange={(v) => setTargetYearId(v || null)}
            disabled={yearsLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a year">
                {(v: string) => yearList.find((y) => y.id === v)?.name ?? "Select a year"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {yearList
                .filter((y) => y.id !== effectiveSourceYearId)
                .map((y) => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Moving into class">
          <Select
            value={targetClassId ?? ""}
            onValueChange={(v) => setTargetClassId(v || null)}
            disabled={classesLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a class">
                {(v: string) => (classes ?? []).find((c) => c.id === v)?.name ?? "Select a class"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(classes ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} · {c.level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className={cardShellClass}>
        {!sourceClassId ? (
          <EmptyState
            icon={GraduationCap}
            title="Choose a class"
            description="Pick the class you are promoting and the year it is moving into."
          />
        ) : isError ? (
          <ErrorState message="Couldn't load this class." onRetry={() => refetch()} />
        ) : !isLoading && candidates.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No students to promote"
            description={`${sourceClass?.name ?? "This class"} has no actively-enrolled students for that year.`}
          />
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-[var(--muted-foreground)]">
                {candidates.length} student{candidates.length === 1 ? "" : "s"} · everyone is set to
                promote unless you change them
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setAll("promote")}>
                  All promote
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setAll("repeat")}>
                  All repeat
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setAll("skip")}>
                  Clear
                </Button>
              </div>
            </div>

            <DataTable
              columns={columns}
              data={candidates}
              getRowId={(row) => row.student_id}
              isLoading={isLoading}
              pageSize={12}
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
              <p className="text-sm text-[var(--text)]">
                {describePromotion(
                  summary,
                  targetClass?.name ?? "the next class",
                  targetYear?.name ?? "next year",
                )}
              </p>
              <Button
                type="button"
                disabled={!ready || !hasWork(summary)}
                onClick={() => setConfirming(true)}
              >
                Review and promote
              </Button>
            </div>
          </>
        )}
      </div>

      <Dialog
        open={confirming}
        onOpenChange={(next) => !promote.isPending && setConfirming(next)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Promote {sourceClass?.name}?</DialogTitle>
            <DialogDescription>
              {describePromotion(
                summary,
                targetClass?.name ?? "the next class",
                targetYear?.name ?? "next year",
              )}{" "}
              This year&apos;s records are not changed — last year&apos;s reports keep showing the
              class each child was actually in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              disabled={promote.isPending}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={promote.isPending} onClick={run}>
              {promote.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Promote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-[var(--label)] uppercase">{label}</Label>
      {children}
    </div>
  );
}
