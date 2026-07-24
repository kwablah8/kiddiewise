"use client";

import {
  Banknote,
  CircleAlert,
  Coins,
  Receipt,
  TrendingUp,
  TriangleAlert,
  Wallet,
} from "lucide-react";

import { MetricCard } from "@/components/data/metric-card";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { ErrorState } from "@/components/states/error-state";
import { useFeesOverview } from "@/lib/queries/fees";
import type { FeesFilter } from "@/lib/validators/fees";
import { formatGHS } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

export function FeesOverview({ filter }: { filter: FeesFilter }) {
  const { data, isLoading, isError, refetch } = useFeesOverview(filter);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-28 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={cardShellClass}>
        <ErrorState message="Couldn't load the fees overview." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard label="Total Expected" value={formatGHS(data.total_expected)} icon={Wallet} tint="blue" />
        <MetricCard label="Total Paid" value={formatGHS(data.total_paid)} icon={Banknote} tint="green" />
        <MetricCard label="Outstanding" value={formatGHS(data.outstanding)} icon={CircleAlert} tint="amber" />
        <MetricCard label="Total Arrears" value={formatGHS(data.total_arrears)} icon={TriangleAlert} tint="amber" />
        <MetricCard label="Collection Rate" value={`${data.collection_rate}%`} icon={TrendingUp} tint="indigo" />
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--text)]">Extra Fees Overview</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard label="Extra Fees Total" value={formatGHS(data.extra_total)} icon={Coins} tint="blue" />
          <MetricCard label="Extra Fees Paid" value={formatGHS(data.extra_paid)} icon={Banknote} tint="green" />
          <MetricCard label="Extra Fees Balance" value={formatGHS(data.extra_balance)} icon={CircleAlert} tint="amber" />
          <MetricCard label="Extra Fee Records" value={String(data.extra_records)} icon={Receipt} tint="indigo" />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CountBox label="Fully Paid" value={data.fully_paid} unit="students" tone="success" />
        <CountBox label="Partial Payment" value={data.partial} unit="students" tone="warning" />
        <CountBox label="Pending" value={data.pending} unit="students" tone="danger" />
        <CountBox label="Total Records" value={data.total_records} unit="fee records" tone="neutral" />
      </section>
    </div>
  );
}

const TONE_TEXT: Record<string, string> = {
  success: "text-[var(--success-fg)]",
  warning: "text-[var(--warning-fg)]",
  danger: "text-[var(--danger)]",
  neutral: "text-[var(--text)]",
};

function CountBox({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: number;
  unit: string;
  tone: "success" | "warning" | "danger" | "neutral";
}) {
  return (
    <div className={cn(cardShellClass, "text-center")}>
      <p className="text-sm font-medium text-[var(--muted-foreground)]">{label}</p>
      <p className={cn("mt-2 text-3xl font-bold tracking-tight", TONE_TEXT[tone])}>{value}</p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{unit}</p>
    </div>
  );
}
