import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendPill } from "./trend-pill";

export type MetricTint = "green" | "amber" | "blue" | "indigo" | "purple";

// Soft, low-saturation tinted chips (06-UI §2 "Stat-card icon chips") — decorative
// accents, not full-color blocks. green/amber are the admin palette; blue/indigo/purple
// extend the same component for the teacher portal later.
const tintStyles: Record<MetricTint, string> = {
  green: "bg-[var(--success-bg)] text-[var(--success-fg)]",
  amber: "bg-[var(--warning-bg)] text-[#92400E]",
  blue: "bg-[#E7F0FE] text-[#1D4ED8]",
  indigo: "bg-[#EEF0FF] text-[#4F46E5]",
  purple: "bg-[#F5EEFF] text-[#7C3AED]",
};

interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tint?: MetricTint;
  trend?: number;
  trendPeriod?: string;
  className?: string;
}

/** Tinted icon chip · muted label · bold number · trend pill (06-UI §6). */
export function MetricCard({
  label,
  value,
  icon: Icon,
  tint = "green",
  trend,
  trendPeriod,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-xl",
            tintStyles[tint],
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {typeof trend === "number" && <TrendPill value={trend} period={trendPeriod} />}
      </div>
      <div className="mt-4 space-y-1">
        <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
        <p className="text-3xl font-bold tracking-tight text-[var(--text)]">{value}</p>
      </div>
    </div>
  );
}
