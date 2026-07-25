"use client";

import { useState } from "react";
import { CalendarRange, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/data/status-pill";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { YearFormDialog } from "./year-form";
import { useAcademicYears, useSetActiveYear } from "@/lib/queries/academics";
import type { AcademicYearVM } from "@/lib/validators/academics";
import { formatDate } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

interface YearListProps {
  selectedYearId: string | null;
  onSelectYear: (id: string) => void;
}

/** Years panel: list w/ active badge + "Set active" (confirmed) + "New Year" (06-UI §6/§7). */
export function YearList({ selectedYearId, onSelectYear }: YearListProps) {
  const { data, isLoading, isError, refetch } = useAcademicYears();
  const [createOpen, setCreateOpen] = useState(false);
  const [createKey, setCreateKey] = useState(0);
  const [confirmYear, setConfirmYear] = useState<AcademicYearVM | null>(null);

  return (
    <div className={cardShellClass}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-[var(--text)]">Academic Years</h3>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setCreateKey((k) => k + 1);
            setCreateOpen(true);
          }}
        >
          New Year
        </Button>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message="Couldn't load academic years." onRetry={() => refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title="No academic years yet"
            description="Create your first academic year to start setting up terms and classes."
          />
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {data.map((year) => {
              const isSelected = year.id === selectedYearId;
              return (
                <li key={year.id}>
                  {/* Selectable row: a `<div role="button">`, not a real `<button>`, since it
                      wraps the "Set active" `<Button>` — nesting an interactive `<button>`
                      inside another is invalid HTML and triggers a hydration error. */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectYear(year.id)}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectYear(year.id);
                      }
                    }}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-3 text-left transition-colors first:pt-2 last:pb-2 hover:bg-[var(--bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                      isSelected && "bg-[var(--bg)]",
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-[var(--text)]">
                          {year.name}
                        </span>
                        {year.is_active && <StatusPill label="Active" tone="success" />}
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        {formatDate(year.start_date)} – {formatDate(year.end_date)} ·{" "}
                        {year.term_count} {year.term_count === 1 ? "term" : "terms"}
                      </p>
                    </div>
                    {!year.is_active && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmYear(year);
                        }}
                      >
                        Set active
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <YearFormDialog key={createKey} open={createOpen} onOpenChange={setCreateOpen} />
      <ConfirmSetActiveYearDialog year={confirmYear} onOpenChange={() => setConfirmYear(null)} />
    </div>
  );
}

function ConfirmSetActiveYearDialog({
  year,
  onOpenChange,
}: {
  year: AcademicYearVM | null;
  onOpenChange: (open: boolean) => void;
}) {
  const setActiveYear = useSetActiveYear();

  async function handleConfirm() {
    if (!year) return;
    try {
      await setActiveYear.mutateAsync({ id: year.id });
      toast.success("Active year updated", {
        description: `${year.name} is now the active academic year.`,
      });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <Dialog open={!!year} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set active academic year?</DialogTitle>
          <DialogDescription>
            {year && (
              <>
                <strong className="text-[var(--text)]">{year.name}</strong> will become the
                active academic year. The currently active year will be deactivated.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={setActiveYear.isPending}>
            {setActiveYear.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Set Active
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
