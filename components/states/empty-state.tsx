import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Calm, centered, guiding empty state (06-UI §7). Never a bare "No data" left to chance —
 * always a title, and usually a one-line description of what will appear here.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl px-6 py-10 text-center",
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-[var(--bg)] text-[var(--muted-foreground)]">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="text-sm font-medium text-[var(--text)]">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-[var(--muted-foreground)]">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
