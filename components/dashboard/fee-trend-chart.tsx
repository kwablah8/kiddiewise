"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ChartCard } from "@/components/data/chart-card";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { ErrorState } from "@/components/states/error-state";
import { useFeeTrend } from "@/lib/queries/dashboard";
import { formatGHS, formatGHSCompact, formatMonthShort } from "@/lib/format";

// Themed via shadcn's ChartConfig, not a hardcoded hex: `var(--primary)` is the admin green
// accent (06-UI §2), resolved by ChartStyle into `--color-value` for this chart's scope.
const chartConfig = {
  value: { label: "Revenue", color: "var(--primary)" },
} satisfies ChartConfig;

/** Monthly revenue, GHS-formatted axis + tooltip (01-REQ Admin §Dashboard, 06-UI §5). */
export function FeeTrendChart() {
  const { data, isLoading, isError, refetch } = useFeeTrend();
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

  return (
    <ChartCard
      title="Fee Collection Trend"
      subtitle="Monthly revenue collected, in GHS"
      isEmpty={isEmpty}
      emptyTitle="No fee data available"
      emptyDescription="Revenue will appear here once payments are recorded."
    >
      {isLoading && <SkeletonBlock className="h-64 w-full" />}
      {isError && (
        <ErrorState message="Couldn't load the fee trend." onRetry={() => refetch()} />
      )}
      {!isLoading && !isError && !isEmpty && (
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="feeTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.32} />
                <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonthShort}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickFormatter={formatGHSCompact}
              tickLine={false}
              axisLine={false}
              width={64}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) =>
                    typeof label === "string" ? formatMonthShort(label) : label
                  }
                  formatter={(value, name, item) => (
                    <div className="flex w-full items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="size-2.5 shrink-0 rounded-[2px]"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-muted-foreground">{name}</span>
                      </div>
                      <span className="font-mono font-medium text-foreground tabular-nums">
                        {formatGHS(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Area
              dataKey="value"
              type="monotone"
              stroke="var(--color-value)"
              strokeWidth={2}
              fill="url(#feeTrendFill)"
            />
          </AreaChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}
