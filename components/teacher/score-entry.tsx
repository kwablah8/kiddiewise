"use client";

import { useState } from "react";
import { Loader2, SquarePen } from "lucide-react";
import { toast } from "@/lib/toast";
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
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { StatusPill } from "@/components/data/status-pill";
import { cardShellClass } from "@/lib/ui";
import { useTeacherAssessments, useScoreSheet, useSaveResults } from "@/lib/queries/assessments";
import { useGradeBands } from "@/lib/queries/grading";
import { scoreToGrade } from "@/lib/grading";

/**
 * Score entry for one of the teacher's own assessments.
 *
 * Mirrors AttendanceMarker: pick a thing, edit a roster, save. Pending edits live in a keyed record
 * layered over the loaded sheet, so the displayed value is `pending[id] ?? entry.score` and no effect
 * is needed to sync them.
 *
 * The grade beside each score is computed live from the school's bands rather than waiting for a
 * round trip, so a teacher sees "72 → B" as they type. That is the same `scoreToGrade` the reads use,
 * so the preview cannot disagree with what is stored.
 */
export function ScoreEntry({ teacherId }: { teacherId: string }) {
  const { data: assessments, isLoading: listLoading } = useTeacherAssessments(teacherId);
  const { data: bands } = useGradeBands();
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  // Blank string is a real state ("cleared, leave unmarked"), distinct from an absent key ("untouched").
  const [pending, setPending] = useState<Record<string, string>>({});

  const { data: sheet, isLoading, isError, refetch } = useScoreSheet(assessmentId);
  const save = useSaveResults();

  const entries = sheet?.entries ?? [];
  const max = sheet?.assessment.max_score ?? 100;

  /** The value shown in a row's input: a pending edit if there is one, else what was loaded. */
  const shown = (studentId: string, base: number | null): string =>
    pending[studentId] ?? (base === null ? "" : String(base));

  const parsed = (studentId: string, base: number | null): number | null => {
    const raw = shown(studentId, base).trim();
    if (raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  const markedCount = entries.filter((e) => parsed(e.student_id, e.score) !== null).length;
  const invalid = entries.filter((e) => {
    const n = parsed(e.student_id, e.score);
    return n !== null && (n < 0 || n > max);
  });

  function changeAssessment(next: string | null) {
    setAssessmentId(next);
    setPending({});
  }

  async function persist(submit: boolean) {
    if (!assessmentId || invalid.length > 0) return;
    const payload = entries.map((e) => ({
      student_id: e.student_id,
      score: parsed(e.student_id, e.score),
      teacher_comment: e.teacher_comment,
    }));

    try {
      const res = await save.mutateAsync({ assessment_id: assessmentId, submit, entries: payload });
      if (res.saved === 0) {
        toast.message("Nothing to save yet — enter at least one score.");
        return;
      }
      setPending({});
      toast.success(
        submit
          ? `${res.saved} score${res.saved === 1 ? "" : "s"} submitted.`
          : `Draft saved for ${res.saved} student${res.saved === 1 ? "" : "s"}.`,
        {
          // Naming the unmarked students matters: submitting a sheet is when a teacher discovers they
          // forgot someone, and silence there is how a missing mark reaches a report card.
          description:
            res.skipped > 0
              ? `${res.skipped} student${res.skipped === 1 ? "" : "s"} left unmarked.`
              : undefined,
        },
      );
    } catch (err) {
      toast.error("Couldn't save these scores", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="assessment">Assessment</Label>
          <Select
            value={assessmentId}
            onValueChange={(v) => changeAssessment(v || null)}
            disabled={listLoading || (assessments?.length ?? 0) === 0}
          >
            <SelectTrigger id="assessment" className="w-[22rem]">
              {/* This SelectValue needs a render child to map the value to a label, without one,
                  base-ui renders the raw value, which here is a UUID. */}
              <SelectValue placeholder={listLoading ? "Loading…" : "Select an assessment…"}>
                {(v: string) => {
                  const a = (assessments ?? []).find((x) => x.id === v);
                  return a ? `${a.title} · ${a.class_name}` : "Select an assessment…";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(assessments ?? []).map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.title} · {a.class_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {sheet && (
          <div className="space-y-1.5">
            <Label>Marked out of</Label>
            <p className="text-sm font-medium text-[var(--text)]">{max}</p>
          </div>
        )}
      </div>

      <div className={cardShellClass}>
        {!listLoading && (assessments?.length ?? 0) === 0 ? (
          <EmptyState
            icon={SquarePen}
            title="No assessments yet"
            description="Create an assessment first — then you can enter scores for it here."
          />
        ) : !assessmentId ? (
          <EmptyState
            icon={SquarePen}
            title="Select an assessment"
            description="Choose one of your assessments to enter scores."
          />
        ) : isError ? (
          <ErrorState message="Couldn't load this mark sheet." onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={SquarePen}
            title="No students enrolled"
            description="This class has no active enrolments, so there is nobody to mark."
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-3">
              <p className="text-sm text-[var(--muted-foreground)]">
                {markedCount} of {entries.length} marked
              </p>
              {invalid.length > 0 && (
                <p className="text-sm font-medium text-[var(--danger)]">
                  {invalid.length} score{invalid.length === 1 ? "" : "s"} outside 0–{max}
                </p>
              )}
            </div>

            <ul className="divide-y divide-[var(--border)]">
              {entries.map((e) => {
                const value = shown(e.student_id, e.score);
                const n = parsed(e.student_id, e.score);
                const isInvalid = n !== null && (n < 0 || n > max);
                // Percentage of this assessment's max, because assessments aren't all out of 100.
                const band =
                  n !== null && !isInvalid && bands
                    ? scoreToGrade(n, max, bands)
                    : null;

                return (
                  <li
                    key={e.student_id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-[var(--text)]">{e.student_name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{e.admission_no}</p>
                    </div>

                    {e.is_submitted && <StatusPill label="Submitted" tone="success" />}

                    {/* Grade preview sits next to the input so a mistyped mark is obvious before
                        saving — "7" showing F when the teacher meant 70 is caught immediately. */}
                    <span className="w-24 text-right text-sm text-[var(--muted-foreground)]">
                      {band ? `${band.grade} · ${band.remark}` : ""}
                    </span>

                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={max}
                      step="any"
                      className="w-24 text-right"
                      placeholder="—"
                      aria-label={`Score for ${e.student_name}, out of ${max}`}
                      aria-invalid={isInvalid}
                      value={value}
                      onChange={(ev) =>
                        setPending((p) => ({ ...p, [e.student_id]: ev.target.value }))
                      }
                    />
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border)] px-4 py-3">
              {/* Draft first: saving progress is the safe, frequent action, and submitting is the one
                  that makes marks visible to parents. */}
              <Button
                type="button"
                variant="outline"
                disabled={save.isPending || invalid.length > 0}
                onClick={() => persist(false)}
              >
                {save.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Save draft
              </Button>
              <Button
                type="button"
                disabled={save.isPending || invalid.length > 0 || markedCount === 0}
                onClick={() => persist(true)}
              >
                {save.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Submit scores
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
