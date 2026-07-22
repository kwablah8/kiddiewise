"use client";

import {
  Activity,
  ClipboardList,
  Download,
  FileBarChart2,
  GraduationCap,
  Megaphone,
  School,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { ListPanel } from "@/components/data/list-panel";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { ErrorState } from "@/components/states/error-state";
import { StatsRow } from "@/components/dashboard/stats-row";
import { FeeTrendChart } from "@/components/dashboard/fee-trend-chart";
import { EnrollmentTrendChart } from "@/components/dashboard/enrollment-trend-chart";
import { ClassPerformanceTable } from "@/components/dashboard/class-performance-table";
import { useRecentActivities, useUpcomingEvents } from "@/lib/queries/dashboard";
import { formatDate, formatMonthShort } from "@/lib/format";

const ENTITY_ICONS: Record<string, LucideIcon> = {
  student: GraduationCap,
  invoice: Wallet,
  terminal_report: FileBarChart2,
  announcement: Megaphone,
  admissions_inquiry: ClipboardList,
  class: School,
};

function RecentActivitiesPanel() {
  const { data, isLoading, isError, refetch } = useRecentActivities();
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

  return (
    <ListPanel
      title="Recent Activities"
      isEmpty={isEmpty}
      emptyTitle="No recent activity"
      emptyDescription="Actions taken across the school will show up here."
    >
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-10 w-full" />
          ))}
        </div>
      )}
      {isError && (
        <ErrorState message="Couldn't load recent activities." onRetry={() => refetch()} />
      )}
      {!isLoading && !isError && !isEmpty && (
        <ul className="divide-y divide-[var(--border)]">
          {data?.map((activity) => {
            const Icon = ENTITY_ICONS[activity.entity_type] ?? Activity;
            return (
              <li key={activity.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg)] text-[var(--muted-foreground)]">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <p className="min-w-0 flex-1 text-sm text-[var(--text)]">
                  <span className="font-medium">{activity.actor_name}</span> {activity.action}
                </p>
                <span className="shrink-0 text-xs whitespace-nowrap text-[var(--muted-foreground)]">
                  {formatDate(activity.created_at)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </ListPanel>
  );
}

function UpcomingEventsPanel() {
  const { data, isLoading, isError, refetch } = useUpcomingEvents();
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

  return (
    <ListPanel
      title="Upcoming Events"
      viewAllHref="/events"
      isEmpty={isEmpty}
      emptyTitle="No upcoming events"
      emptyDescription="Scheduled events will appear here as they're added."
    >
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-12 w-full" />
          ))}
        </div>
      )}
      {isError && (
        <ErrorState message="Couldn't load upcoming events." onRetry={() => refetch()} />
      )}
      {!isLoading && !isError && !isEmpty && (
        <ul className="divide-y divide-[var(--border)]">
          {data?.map((event) => (
            <li key={event.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="flex size-11 shrink-0 flex-col items-center justify-center gap-0 rounded-lg bg-[var(--success-bg)] leading-none text-[var(--success-fg)]">
                <span className="text-[10px] font-semibold uppercase">
                  {formatMonthShort(event.start_at)}
                </span>
                <span className="text-sm font-bold">
                  {new Date(event.start_at).getUTCDate()}
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text)]">{event.title}</p>
                <p className="truncate text-xs text-[var(--muted-foreground)]">
                  {event.location ?? "Location TBA"} · {formatDate(event.start_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </ListPanel>
  );
}

export default function DashboardPage() {
  function handleExport() {
    // Stub: the real integration wires this to a Server Action that renders + downloads a
    // PDF/CSV export. For this UI phase it's just success feedback (06-UI §7 "Success").
    toast.success("Export started", {
      description: "Your report will download shortly.",
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="An overview of your school's students, staff, fees, and activity."
        action={
          <Button type="button" variant="outline" onClick={handleExport}>
            <Download className="size-4" aria-hidden="true" />
            Export Report
          </Button>
        }
      />

      <StatsRow />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FeeTrendChart />
        <EnrollmentTrendChart />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentActivitiesPanel />
        <UpcomingEventsPanel />
      </div>

      <ClassPerformanceTable />
    </div>
  );
}
