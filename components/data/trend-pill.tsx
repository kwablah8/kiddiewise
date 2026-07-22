import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTrend } from "@/lib/format";

interface TrendPillProps {
  value: number;
  period?: string;
  className?: string;
}

/** "↗ +12% from last month" — success/danger tint, arrow pairs with the sign (06-UI §9). */
export function TrendPill({ value, period, className }: TrendPillProps) {
  const isNegative = value < 0;
  const Icon = value > 0 ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        isNegative
          ? "bg-[color-mix(in_srgb,var(--danger)_12%,white)] text-[var(--danger)]"
          : "bg-[var(--success-bg)] text-[var(--success-fg)]",
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {formatTrend(value, period)}
    </span>
  );
}
