"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ChartCard } from "@/components/data/chart-card";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { ErrorState } from "@/components/states/error-state";
import { useEnrollmentTrend } from "@/lib/queries/dashboard";
import { formatMonthShort } from "@/lib/format";

// `var(--chart-enrollment)` is a token defined in app/globals.css (06-UI §2 palette extension)
// so the enrollment series reads as visually distinct from the green fee/revenue series
// without any component ever hardcoding a hex value.
const chartConfig = {
  value: { label: "New enrollments", color: "var(--chart-enrollment)" },
} satisfies ChartConfig;

/** Students enrolled per month (01-REQ Admin §Dashboard, 06-UI §5). */
export function EnrollmentTrendChart() {
  const { data, isLoading, isError, refetch } = useEnrollmentTrend();
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

  return (
    <ChartCard
      title="Enrollment Trend"
      subtitle="New students enrolled per month"
      isEmpty={isEmpty}
      emptyTitle="No enrollment data available"
      emptyDescription="New enrollments will appear here as students are admitted."
    >
      {isLoading && <SkeletonBlock className="h-64 w-full" />}
      {isError && (
        <ErrorState message="Couldn't load the enrollment trend." onRetry={() => refetch()} />
      )}
      {!isLoading && !isError && !isEmpty && (
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonthShort}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
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
                        {value}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}
