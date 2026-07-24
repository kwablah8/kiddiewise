"use client";

import { ChildTabs } from "@/components/parent/child-tabs";
import { StatusPill, type StatusTone } from "@/components/data/status-pill";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { useChildAttendance } from "@/lib/queries/parent";
import { summarizeAttendance } from "@/lib/parent/attendance";
import type { AttendanceStatus } from "@/lib/validators/parent";
import { formatDate } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<AttendanceStatus, StatusTone> = {
  present: "success",
  late: "warning",
  absent: "danger",
};
const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "Present",
  late: "Late",
  absent: "Absent",
};

export function ChildAttendance({ id }: { id: string }) {
  const { data, isLoading, isError, refetch } = useChildAttendance(id);
  const records = data ?? [];
  const summary = summarizeAttendance(records);
  const isEmpty = !isLoading && !isError && records.length === 0;

  return (
    <div className="space-y-6">
      <ChildTabs childId={id} />

      {isLoading && (
        <div className="space-y-4">
          <SkeletonBlock className="h-28 w-full" />
          <SkeletonBlock className="h-64 w-full" />
        </div>
      )}

      {isError && (
        <div className={cardShellClass}>
          <ErrorState message="Couldn't load attendance." onRetry={() => refetch()} />
        </div>
      )}

      {isEmpty && (
        <div className={cardShellClass}>
          <EmptyState
            title="No attendance recorded yet"
            description="Attendance for this term will appear here once teachers begin marking the register."
          />
        </div>
      )}

      {!isLoading && !isError && !isEmpty && (
        <>
          <div className={cn(cardShellClass, "flex flex-wrap items-center gap-x-10 gap-y-4")}>
            <div>
              <p className="text-xs font-medium tracking-wide text-[var(--label)] uppercase">
                Attendance rate
              </p>
              <p className="mt-1 text-3xl font-semibold text-[var(--text)]">
                {summary.pct !== null ? `${summary.pct}%` : "—"}
              </p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                over {summary.total} recorded {summary.total === 1 ? "day" : "days"}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <Tally label="Present" value={summary.present} tone="success" />
              <Tally label="Late" value={summary.late} tone="warning" />
              <Tally label="Absent" value={summary.absent} tone="danger" />
            </div>
          </div>

          <div className={cn(cardShellClass, "space-y-1")}>
            <h2 className="mb-3 text-base font-semibold text-[var(--text)]">History</h2>
            <ul className="divide-y divide-[var(--border)]">
              {records.map((r) => (
                <li
                  key={r.date}
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <span className="text-sm text-[var(--text)]">{formatDate(r.date)}</span>
                  <StatusPill label={STATUS_LABEL[r.status]} tone={STATUS_TONE[r.status]} />
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function Tally({ label, value, tone }: { label: string; value: number; tone: StatusTone }) {
  const dot: Record<StatusTone, string> = {
    success: "bg-[var(--success-fg)]",
    warning: "bg-[var(--warning-fg)]",
    danger: "bg-[var(--danger)]",
    neutral: "bg-[var(--muted-foreground)]",
  };
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-[var(--label)] uppercase">
        <span className={cn("size-2 rounded-full", dot[tone])} aria-hidden="true" />
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-[var(--text)]">{value}</p>
    </div>
  );
}
