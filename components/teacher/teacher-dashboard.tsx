"use client";

import { School, BookOpen, GraduationCap, CalendarCheck } from "lucide-react";
import { MetricCard } from "@/components/data/metric-card";
import { ListPanel } from "@/components/data/list-panel";
import { ErrorState } from "@/components/states/error-state";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { cardShellClass } from "@/lib/ui";
import { formatDate } from "@/lib/format";
import { useTeacherDashboard } from "@/lib/queries/teacher";
import { QuickActions } from "./quick-actions";

export function TeacherDashboard({ teacherId }: { teacherId: string }) {
  const { data, isLoading, isError, refetch } = useTeacherDashboard(teacherId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-[124px] w-full" />
          ))}
        </div>
        <SkeletonBlock className="h-24 w-full" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={cardShellClass}>
        <ErrorState message="Couldn't load your dashboard." onRetry={() => refetch()} />
      </div>
    );
  }

  const { totals, myClasses, mySubjects, activeTerm } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Classes" value={String(totals.classes)} icon={School} tint="blue" />
        <MetricCard label="Total Subjects" value={String(totals.subjects)} icon={BookOpen} tint="indigo" />
        <MetricCard label="Total Students" value={String(totals.students)} icon={GraduationCap} tint="green" />
        <MetricCard
          label="Attendance Rate"
          value={totals.attendanceRate === null ? "—" : `${totals.attendanceRate}%`}
          icon={CalendarCheck}
          tint="amber"
        />
      </div>

      <QuickActions />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ListPanel
          title="My Classes"
          isEmpty={myClasses.length === 0}
          emptyTitle="No classes assigned yet"
          emptyDescription="Classes you teach or lead will appear here once an admin assigns them."
        >
          <ul className="divide-y divide-[var(--border)]">
            {myClasses.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2.5">
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[var(--text)]">{c.name}</span>
                  <span className="block text-xs text-[var(--muted-foreground)]">
                    {c.level}
                    {c.isClassTeacher && " · Class teacher"}
                  </span>
                </span>
                <span className="shrink-0 text-sm text-[var(--muted-foreground)]">
                  {c.studentCount} {c.studentCount === 1 ? "student" : "students"}
                </span>
              </li>
            ))}
          </ul>
        </ListPanel>

        <ListPanel
          title="My Subjects"
          isEmpty={mySubjects.length === 0}
          emptyTitle="No subjects assigned yet"
          emptyDescription="Subjects you teach will appear here once an admin assigns them."
        >
          <ul className="divide-y divide-[var(--border)]">
            {mySubjects.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2.5">
                <span className="text-sm font-medium text-[var(--text)]">{s.name}</span>
                <span className="shrink-0 text-sm text-[var(--muted-foreground)]">
                  {s.classCount} {s.classCount === 1 ? "class" : "classes"}
                </span>
              </li>
            ))}
          </ul>
        </ListPanel>

        <ListPanel
          title="Academic Year"
          isEmpty={!activeTerm}
          emptyTitle="No active term"
          emptyDescription="The current term will show here once an admin activates one."
        >
          {activeTerm && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-[var(--text)]">{activeTerm.name}</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {formatDate(activeTerm.start_date)} – {formatDate(activeTerm.end_date)}
              </p>
            </div>
          )}
        </ListPanel>

        <ListPanel
          title="Recent Activities"
          isEmpty
          emptyTitle="No recent activity"
          emptyDescription="Attendance you mark and results you submit will appear here."
        />
      </div>
    </div>
  );
}
