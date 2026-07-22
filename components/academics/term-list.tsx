"use client";

import { useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { TermFormDialog } from "./term-form";
import { useTerms, useSetActiveTerm } from "@/lib/queries/academics";
import type { AcademicYearVM, TermVM } from "@/lib/validators/academics";
import { formatDate } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";

interface TermListProps {
  /** The academic year whose terms are shown, or `null` when no year exists/is selected yet. */
  year: AcademicYearVM | null;
}

/** Terms panel for the selected year: ordinal, active badge, "Set active" (confirmed), "New Term". */
export function TermList({ year }: TermListProps) {
  const { data, isLoading, isError, refetch } = useTerms(year?.id);
  const [createOpen, setCreateOpen] = useState(false);
  const [createKey, setCreateKey] = useState(0);
  const [confirmTerm, setConfirmTerm] = useState<TermVM | null>(null);

  return (
    <div className={cardShellClass}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-[var(--text)]">
          Terms{year ? ` — ${year.name}` : ""}
        </h3>
        <Button
          type="button"
          size="sm"
          disabled={!year}
          title={year ? undefined : "Create or select an academic year first"}
          onClick={() => {
            setCreateKey((k) => k + 1);
            setCreateOpen(true);
          }}
        >
          New Term
        </Button>
      </div>

      <div className="mt-4">
        {!year ? (
          <EmptyState
            icon={CalendarClock}
            title="No academic year selected"
            description="Create or select an academic year above to manage its terms."
          />
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message="Couldn't load terms." onRetry={() => refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No terms yet"
            description={`Add First, Second, and Third Term to ${year.name}.`}
          />
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {[...data]
              .sort((a, b) => a.ordinal - b.ordinal)
              .map((term) => (
                <li
                  key={term.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 rounded-full bg-[var(--bg)] px-2 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
                        {term.ordinal}
                      </span>
                      <span className="truncate text-sm font-medium text-[var(--text)]">
                        {term.name}
                      </span>
                      {term.is_active && <StatusPill label="Active" tone="success" />}
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      {formatDate(term.start_date)} – {formatDate(term.end_date)}
                    </p>
                  </div>
                  {!term.is_active && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => setConfirmTerm(term)}
                    >
                      Set active
                    </Button>
                  )}
                </li>
              ))}
          </ul>
        )}
      </div>

      {year && (
        <TermFormDialog
          key={`${year.id}-${createKey}`}
          academicYearId={year.id}
          yearName={year.name}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      )}
      <ConfirmSetActiveTermDialog term={confirmTerm} onOpenChange={() => setConfirmTerm(null)} />
    </div>
  );
}

function ConfirmSetActiveTermDialog({
  term,
  onOpenChange,
}: {
  term: TermVM | null;
  onOpenChange: (open: boolean) => void;
}) {
  const setActiveTerm = useSetActiveTerm();

  async function handleConfirm() {
    if (!term) return;
    try {
      await setActiveTerm.mutateAsync({ id: term.id });
      toast.success("Active term updated", {
        description: `${term.name} is now the active term.`,
      });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <Dialog open={!!term} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set active term?</DialogTitle>
          <DialogDescription>
            {term && (
              <>
                <strong className="text-[var(--text)]">{term.name}</strong> will become the
                active term. The currently active term will be deactivated.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={setActiveTerm.isPending}>
            {setActiveTerm.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Set Active
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
