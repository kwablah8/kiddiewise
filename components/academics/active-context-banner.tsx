"use client";

import { CalendarDays, CalendarClock } from "lucide-react";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { ErrorState } from "@/components/states/error-state";
import { useActiveContext } from "@/lib/queries/academics";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

/**
 * Top-of-page banner surfacing the school's single active academic year + term
 * (06-UI §7 empty-state tone: "No active term"). Every other screen that reads
 * `useActiveContext()` shows the same "Active: …" phrasing this banner establishes.
 */
export function ActiveContextBanner() {
  const { data, isLoading, isError, refetch } = useActiveContext();

  if (isLoading) {
    return (
      <div className={cn(cardShellClass, "flex items-center gap-3")}>
        <SkeletonBlock className="size-10 rounded-full" />
        <SkeletonBlock className="h-5 w-64" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cardShellClass}>
        <ErrorState message="Couldn't load the active academic context." onRetry={() => refetch()} />
      </div>
    );
  }

  if (!data?.active_year) {
    return (
      <div
        className={cn(
          cardShellClass,
          "flex items-center gap-3 border-[color-mix(in_srgb,var(--warning-fg)_25%,var(--border))] bg-[var(--warning-bg)]",
        )}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--warning-fg)]">
          <CalendarClock className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">
            No active academic year
          </p>
          <p className="text-sm text-[var(--warning-fg)]">
            Create one below to begin — students, classes, and terms all key off it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        cardShellClass,
        "flex items-center gap-3 border-[color-mix(in_srgb,var(--success-fg)_20%,var(--border))] bg-[var(--success-bg)]",
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--success-fg)]">
        <CalendarDays className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-[var(--text)]">
          Active: {data.active_year.name}
          {data.active_term ? ` · ${data.active_term.name}` : ""}
        </p>
        {!data.active_term && (
          <p className="text-sm text-[var(--warning-fg)]">
            No active term yet — set one in the Terms panel below.
          </p>
        )}
      </div>
    </div>
  );
}
