import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "danger" | "neutral";

const toneStyles: Record<StatusTone, string> = {
  success: "bg-[var(--success-bg)] text-[var(--success-fg)]",
  warning: "bg-[var(--warning-bg)] text-[var(--warning-fg)]",
  danger: "bg-[color-mix(in_srgb,var(--danger)_12%,white)] text-[var(--danger)]",
  neutral: "bg-[var(--bg)] text-[var(--muted-foreground)]",
};

interface StatusPillProps {
  label: string;
  tone?: StatusTone;
  className?: string;
}

/**
 * Status shown as a pill, never color alone (06-UI §11, the label is always real text).
 */
export function StatusPill({ label, tone = "neutral", className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        toneStyles[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
