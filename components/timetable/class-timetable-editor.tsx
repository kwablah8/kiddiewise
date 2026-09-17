"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { ErrorState } from "@/components/states/error-state";
import { EmptyState } from "@/components/states/empty-state";
import { useClasses, useAssignments } from "@/lib/queries/academics";
import { usePeriods, useClassTimetable, useSaveClassTimetable } from "@/lib/queries/timetable";
import {
  WEEKDAY_ORDER,
  WEEKDAY_LABEL,
  type PeriodVM,
  type TimetableEntryVM,
  type Weekday,
} from "@/lib/validators/timetable";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

const NONE = "__none__";

/** Class picker, then that class's editable grid — one Save button submits the whole thing at once. */
export function ClassTimetableEditor() {
  const { data: classes } = useClasses();
  const [classId, setClassId] = useState<string | null>(null);

  return (
    <div className={cardShellClass}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text)]">Class timetable</h2>
          <p className="text-xs text-[var(--muted-foreground)]">Pick a class, then fill in its weekly grid.</p>
        </div>
        <div className="w-56 space-y-1.5">
          <Label className="sr-only">Class</Label>
          <Select value={classId ?? undefined} onValueChange={setClassId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a class">
                {(v: string) => (classes ?? []).find((c) => c.id === v)?.name ?? "Select a class"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(classes ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!classId ? (
        <EmptyState title="Select a class" description="Choose a class above to see and edit its timetable." />
      ) : (
        <EditorBody key={classId} classId={classId} />
      )}
    </div>
  );
}

function EditorBody({ classId }: { classId: string }) {
  const { data: periods, isLoading: periodsLoading, isError: periodsError, refetch: refetchPeriods } = usePeriods();
  const { data: entries, isLoading: entriesLoading, isError: entriesError, refetch: refetchEntries } = useClassTimetable(classId);
  const { data: assignments } = useAssignments(classId);

  if (periodsLoading || entriesLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} className="h-10 w-full" />)}
      </div>
    );
  }
  if (periodsError || entriesError) {
    return <ErrorState message="Couldn't load the timetable." onRetry={() => { refetchPeriods(); refetchEntries(); }} />;
  }
  if (!periods || periods.length === 0) {
    return (
      <EmptyState title="No periods yet"
        description="Add the school's time slots above before building a class's timetable." />
    );
  }

  return (
    <TimetableForm
      classId={classId}
      periods={periods}
      initialEntries={entries ?? []}
      subjects={(assignments ?? []).map((a) => ({ id: a.subject_id, name: a.subject_name }))}
    />
  );
}

function TimetableForm({
  classId,
  periods,
  initialEntries,
  subjects,
}: {
  classId: string;
  periods: PeriodVM[];
  initialEntries: TimetableEntryVM[];
  subjects: { id: string; name: string }[];
}) {
  // Lazy initializer, not an effect: EditorBody keys this component by classId, so switching
  // classes remounts it fresh rather than needing to sync local state against a changing prop.
  const [grid, setGrid] = useState<Record<string, string>>(() => {
    const g: Record<string, string> = {};
    for (const e of initialEntries) g[`${e.day_of_week}:${e.period_id}`] = e.subject_id;
    return g;
  });
  const save = useSaveClassTimetable();

  function setCell(day: Weekday, periodId: string, subjectId: string) {
    setGrid((g) => ({ ...g, [`${day}:${periodId}`]: subjectId }));
  }

  async function handleSave() {
    const teachingPeriods = periods.filter((p) => !p.is_break);
    const cells = WEEKDAY_ORDER.flatMap((day) =>
      teachingPeriods.map((p) => ({
        day_of_week: day,
        period_id: p.id,
        subject_id: grid[`${day}:${p.id}`] || null,
      })),
    );
    try {
      await save.mutateAsync({ class_id: classId, cells });
      toast.success("Timetable saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div>
      {subjects.length === 0 && (
        <p className="mb-3 rounded-lg border border-[var(--warning-border,var(--border))] bg-[var(--warning-bg,var(--bg))] p-3 text-xs text-[var(--text)]">
          This class has no subjects assigned yet — add them under Subjects before building its timetable.
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-32 border-b border-[var(--border)] p-2 text-left text-xs font-medium tracking-wide text-[var(--label)] uppercase">
                Period
              </th>
              {WEEKDAY_ORDER.map((day) => (
                <th key={day} className="border-b border-[var(--border)] p-2 text-left text-xs font-medium tracking-wide text-[var(--label)] uppercase">
                  {WEEKDAY_LABEL[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period.id} className="border-b border-[var(--border)] last:border-0">
                <td className="p-2 align-top">
                  <p className="font-medium text-[var(--text)]">{period.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {period.start_time.slice(0, 5)}–{period.end_time.slice(0, 5)}
                  </p>
                </td>
                {period.is_break ? (
                  <td colSpan={WEEKDAY_ORDER.length} className="p-2 text-center text-xs text-[var(--muted-foreground)] italic">
                    {period.name}
                  </td>
                ) : (
                  WEEKDAY_ORDER.map((day) => {
                    const key = `${day}:${period.id}`;
                    const value = grid[key] || NONE;
                    return (
                      <td key={day} className="p-1.5 align-top">
                        <Select
                          value={value}
                          onValueChange={(v) => {
                            const next = v ?? NONE;
                            setCell(day, period.id, next === NONE ? "" : next);
                          }}
                        >
                          <SelectTrigger className={cn("h-9 w-full text-xs", value === NONE && "text-[var(--muted-foreground)]")}>
                            <SelectValue>
                              {(v: string) => (v === NONE ? "—" : subjects.find((s) => s.id === v)?.name ?? "—")}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>—</SelectItem>
                            {subjects.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="button" onClick={handleSave} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
          Save timetable
        </Button>
      </div>
    </div>
  );
}
