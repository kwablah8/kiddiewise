import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { lightFocusRingClass } from "@/lib/ui";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  /** When set, a back link is shown above the title on mobile only (the sidebar is hidden below
   *  `lg`, so drill-in screens need an explicit way back). Pass the parent list's path. */
  backHref?: string;
  /** Label for the back link — the parent screen's name, e.g. "Staff". Defaults to "Back". */
  backLabel?: string;
}

/** Page title (blue, admin) + one-line muted subtitle + optional top-right action (06-UI §5).
 *  On detail/drill-in screens, pass `backHref` to surface a mobile-only back link. */
export function PageHeader({
  title,
  subtitle,
  action,
  className,
  backHref,
  backLabel = "Back",
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className={cn(
              "-ml-1 mb-2 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--text)] lg:hidden",
              lightFocusRingClass,
            )}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {backLabel}
          </Link>
        )}
        <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-[var(--primary)]">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--muted-foreground)]">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
