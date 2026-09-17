"use client";

import { SkeletonBlock } from "@/components/states/skeleton-block";
import { ErrorState } from "@/components/states/error-state";
import { EmptyState } from "@/components/states/empty-state";
import { usePeriods } from "@/lib/queries/timetable";
import { WEEKDAY_ORDER, WEEKDAY_LABEL, type TimetableEntryVM } from "@/lib/validators/timetable";
import { CalendarClock } from "lucide-react";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

/**
 * Read-only weekly grid — periods for the day: Mon-Fri, this class's timetable. Shared by the
 * teacher and parent portals; only the admin editor (class-timetable-editor.tsx) writes to it.
 */
export function TimetableView({
  entries,
  isLoading,
  isError,
  onRetry,
}: {
  entries: TimetableEntryVM[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const { data: periods, isLoading: periodsLoading, isError: periodsError, refetch: refetchPeriods } = usePeriods();

  if (isLoading || periodsLoading) {
    return (
      <div className={cn(cardShellClass, "space-y-2")}>
        {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} className="h-10 w-full" />)}
      </div>
    );
  }
  if (isError || periodsError) {
    return (
      <div className={cardShellClass}>
        <ErrorState message="Couldn't load the timetable." onRetry={() => { onRetry(); refetchPeriods(); }} />
      </div>
    );
  }
  if (!periods || periods.length === 0) {
    return (
      <div className={cardShellClass}>
        <EmptyState icon={CalendarClock} title="No timetable set yet"
          description="The school hasn't published a timetable for this class yet." />
      </div>
    );
  }

  const byCell = new Map((entries ?? []).map((e) => [`${e.day_of_week}:${e.period_id}`, e]));

  return (
    <div className={cn(cardShellClass, "overflow-x-auto")}>
      <table className="w-full min-w-[640px] border-collapse text-sm">
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
                  const entry = byCell.get(`${day}:${period.id}`);
                  return (
                    <td key={day} className="p-2 align-top">
                      {entry ? (
                        <>
                          <p className="text-[var(--text)]">{entry.subject_name}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{entry.teacher_name ?? "—"}</p>
                        </>
                      ) : (
                        <span className="text-[var(--muted-foreground)]">—</span>
                      )}
                    </td>
                  );
                })
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
