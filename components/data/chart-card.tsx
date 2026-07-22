import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/states/empty-state";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Bold title · muted subtitle (units) · chart · designed empty state (06-UI §6). */
export function ChartCard({
  title,
  subtitle,
  isEmpty,
  emptyTitle = "No data available",
  emptyDescription,
  action,
  children,
  className,
}: ChartCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--text)]">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4">
        {isEmpty ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          children
        )}
      </div>
    </section>
  );
}
