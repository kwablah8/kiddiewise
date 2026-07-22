"use client";

import { GraduationCap, Users, Wallet, CalendarCheck } from "lucide-react";
import { MetricCard } from "@/components/data/metric-card";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { ErrorState } from "@/components/states/error-state";
import { cardShellClass } from "@/lib/ui";
import { useDashboardStats, useDashboardTrends } from "@/lib/queries/dashboard";
import { formatGHS, formatPercent } from "@/lib/format";

/**
 * Row of 4 metric cards — Total Students, Total Staff, Total Revenue, Attendance Rate
 * (01-REQ Admin §Dashboard, 06-UI §5). Backed by two independent hooks: `useDashboardStats()`
 * (the real 4-total RPC shape) supplies each card's value, `useDashboardTrends()` (a seam-only
 * enrichment — see lib/data/dashboard.ts) supplies its trend pill. Stats is load-bearing (no
 * stats -> ErrorState for the whole row); trends is decorative (no trends -> pills just render
 * 0/neutral, same as the "empty" mock state) so a trends failure never blocks the totals.
 */
export function StatsRow() {
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch } =
    useDashboardStats();
  const { data: trends, isLoading: trendsLoading } = useDashboardTrends();

  if (statsLoading || trendsLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-[124px] w-full" />
        ))}
      </div>
    );
  }

  if (statsError || !stats) {
    return (
      <div className={cardShellClass}>
        <ErrorState
          message="Couldn't load the dashboard summary."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Trends is best-effort: absent/errored trends renders neutral 0-value pills rather than
  // hiding the (load-bearing) totals.
  const t = trends ?? { students: 0, staff: 0, revenue: 0, attendance: 0 };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Total Students"
        value={stats.total_students.toLocaleString("en-GH")}
        icon={GraduationCap}
        tint="green"
        trend={t.students}
      />
      <MetricCard
        label="Total Staff"
        value={stats.total_staff.toLocaleString("en-GH")}
        icon={Users}
        tint="amber"
        trend={t.staff}
      />
      <MetricCard
        label="Total Revenue"
        value={formatGHS(stats.total_revenue)}
        icon={Wallet}
        tint="green"
        trend={t.revenue}
      />
      <MetricCard
        label="Attendance Rate"
        value={formatPercent(stats.attendance_rate)}
        icon={CalendarCheck}
        tint="amber"
        trend={t.attendance}
      />
    </div>
  );
}
