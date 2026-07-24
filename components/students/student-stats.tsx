"use client";

import type { LucideIcon } from "lucide-react";
import { School, UserCheck, Users } from "lucide-react";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { useStudentStats } from "@/lib/queries/people";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

/** Rounded share of `total`; `0` (not `NaN`) when there's nothing to divide yet. */
function pctOf(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

type Tint = "green" | "amber";
const tintChip: Record<Tint, string> = {
  green: "bg-[var(--success-bg)] text-[var(--success-fg)]",
  amber: "bg-[var(--warning-bg)] text-[var(--warning-fg)]",
};

/**
 * Local stat card: tinted icon chip · label · value · muted caption sub-line. Deliberately NOT
 * `MetricCard` — its `trend` prop renders a `TrendPill` (a colored ↑/↓ delta for period-over-period
 * change), so a share-of-total fed to it reads as a false "trending up +N%". These captions are
 * static shares of the roster, so they belong in a plain muted sub-line under the value instead.
 */
function StatCard({
  label,
  value,
  icon: Icon,
  tint,
  caption,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tint: Tint;
  caption: string;
}) {
  return (
    <div className={cardShellClass}>
      <span className={cn("flex size-10 items-center justify-center rounded-xl", tintChip[tint])}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="mt-4 space-y-1">
        <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
        <p className="text-3xl font-bold tracking-tight text-[var(--text)]">{value}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{caption}</p>
      </div>
    </div>
  );
}

/**
 * 4-card summary row atop the Students list (06-UI §6): Total, Active, Assigned to a class, and
 * Gender ratio. Stats are secondary to the roster below, so a failed fetch degrades to a single
 * muted note rather than a full `ErrorState` + retry — the table below still works.
 */
export function StudentStats() {
  const { data, isLoading, isError } = useStudentStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-[132px] w-full" />
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
  const femalePct = pctOf(data.female, data.total);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total Students"
        value={data.total.toLocaleString("en-GH")}
        icon={Users}
        tint="green"
        caption="Enrolled students"
      />
      <StatCard
        label="Active Students"
        value={data.active.toLocaleString("en-GH")}
        icon={UserCheck}
        tint="amber"
        caption={`${activePct}% currently active`}
      />
      <StatCard
        label="Assigned to Class"
        value={data.assigned.toLocaleString("en-GH")}
        icon={School}
        tint="green"
        caption={`${assignedPct}% have a class`}
      />
      <StatCard
        label="Gender Ratio"
        value={`${data.male}/${data.female}`}
        icon={Users}
        tint="green"
        caption={`${malePct}% male · ${femalePct}% female`}
      />
    </div>
  );
}
