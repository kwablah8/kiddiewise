"use client";

import { GraduationCap, Users, Wallet, CalendarCheck } from "lucide-react";
import { MetricCard } from "@/components/data/metric-card";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { ErrorState } from "@/components/states/error-state";
import { cardShellClass } from "@/lib/ui";
import { useDashboardStats } from "@/lib/queries/dashboard";
import { formatGHS, formatPercent } from "@/lib/format";

/**
 * Row of 4 metric cards — Total Students, Total Staff, Total Revenue, Attendance Rate
 * (01-REQ Admin §Dashboard, 06-UI §5). Loading/error/empty/success all live here since this
 * is a single hook driving one visual row.
 */
export function StatsRow() {
  const { data, isLoading, isError, refetch } = useDashboardStats();

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
      <div className={cardShellClass}>
        <ErrorState
          message="Couldn't load the dashboard summary."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Total Students"
        value={data.total_students.toLocaleString("en-GH")}
        icon={GraduationCap}
        tint="green"
        trend={data.students_trend}
      />
      <MetricCard
        label="Total Staff"
        value={data.total_staff.toLocaleString("en-GH")}
        icon={Users}
        tint="amber"
        trend={data.staff_trend}
      />
      <MetricCard
        label="Total Revenue"
        value={formatGHS(data.total_revenue)}
        icon={Wallet}
        tint="green"
        trend={data.revenue_trend}
      />
      <MetricCard
        label="Attendance Rate"
        value={formatPercent(data.attendance_rate)}
        icon={CalendarCheck}
        tint="amber"
        trend={data.attendance_trend}
      />
    </div>
  );
}
