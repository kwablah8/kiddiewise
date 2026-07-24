"use client";

import { School, UserCheck, Users } from "lucide-react";
import { MetricCard } from "@/components/data/metric-card";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { useStudentStats } from "@/lib/queries/people";

/** Rounded share of `total`; `0` (not `NaN`) when there's nothing to divide yet. */
function pctOf(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

/**
 * 4-card summary row atop the Students list (06-UI §6): Total, Active, Assigned to a class,
 * and Gender ratio. Stats are secondary to the roster below, so a failed fetch degrades to a
 * single muted note rather than a full `ErrorState` + retry — the table below still works.
 */
export function StudentStats() {
  const { data, isLoading, isError } = useStudentStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-[124px] w-full" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        Student summary is unavailable right now.
      </p>
    );
  }

  const activePct = pctOf(data.active, data.total);
  const assignedPct = pctOf(data.assigned, data.total);
  const malePct = pctOf(data.male, data.total);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Total Students"
        value={data.total.toLocaleString("en-GH")}
        icon={Users}
        tint="green"
      />
      <MetricCard
        label="Active Students"
        value={data.active.toLocaleString("en-GH")}
        icon={UserCheck}
        tint="amber"
        trend={activePct}
        trendPeriod="currently active"
      />
      <MetricCard
        label="Assigned to Class"
        value={data.assigned.toLocaleString("en-GH")}
        icon={School}
        tint="green"
        trend={assignedPct}
        trendPeriod="assigned to a class"
      />
      <MetricCard
        label="Gender Ratio"
        value={`${data.male}/${data.female}`}
        icon={Users}
        tint="green"
        trend={malePct}
        trendPeriod="male"
      />
    </div>
  );
}
