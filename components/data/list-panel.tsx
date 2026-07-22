import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/states/empty-state";

interface ListPanelProps {
  title: string;
  viewAllHref?: string;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  children?: ReactNode;
  className?: string;
}

/** Header + right-aligned "View all" link · rows · empty state (06-UI §6). */
export function ListPanel({
  title,
  viewAllHref,
  isEmpty,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  children,
  className,
}: ListPanelProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--text)]">{title}</h3>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"
          >
            View all
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        )}
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
