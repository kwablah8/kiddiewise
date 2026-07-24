import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { cardShellClass } from "@/lib/ui";
import { TrendPill } from "./trend-pill";

export type MetricTint = "green" | "amber" | "blue" | "indigo";

// Soft, low-saturation tinted chips (06-UI §2 "Stat-card icon chips") — decorative accents, not
// full-color blocks. green/amber are the admin palette; blue/indigo are the teacher palette (06-UI §8)
// used by the teacher dashboard metric row.
const tintStyles: Record<MetricTint, string> = {
  green: "bg-[var(--success-bg)] text-[var(--success-fg)]",
  amber: "bg-[var(--warning-bg)] text-[var(--warning-fg)]",
  blue: "bg-[var(--info-bg)] text-[var(--info-fg)]",
  indigo: "bg-[var(--indigo-bg)] text-[var(--indigo-fg)]",
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
    <div className={cn(cardShellClass, className)}>
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
