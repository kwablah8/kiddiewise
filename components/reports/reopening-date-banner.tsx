"use client";

import { useState } from "react";
import { CalendarDays, Loader2, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSetReopeningDate } from "@/lib/queries/academics";
import { formatDate } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

/**
 * When school reopens after the selected term, set from the terminal reports screen.
 *
 * It sits above the class/year/term selectors and applies to the TERM, not to a class, every child
 * in the school comes back on the same day, and storing it per report row would let two pupils in
 * one class disagree (migration 0023). Keeping it here rather than in Academic → Terms is
 * deliberate: it is the person writing report cards who knows the date, and this is the screen they
 * are already on.
 *
 * Not shown until a term is chosen, because there is nothing to attach a date to before then.
 */
export function ReopeningDateBanner({
  termId,
  termName,
  reopeningDate,
}: {
  termId: string | null;
  termName: string | null;
  reopeningDate: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const setReopeningDate = useSetReopeningDate();

  if (!termId) return null;

  async function save(value: string | null) {
    if (!termId) return;
    try {
      await setReopeningDate.mutateAsync({ term_id: termId, reopening_date: value });
      setEditing(false);
      toast.success(value ? "Reopening date saved" : "Reopening date cleared", {
        description: value
          ? `Reports for ${termName} will show ${formatDate(value)}.`
          : `Reports for ${termName} will not show a reopening date.`,
      });
    } catch (err) {
      toast.error("Couldn't save the reopening date", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }

  return (
    <div className={cn(cardShellClass, "flex flex-wrap items-center justify-between gap-3")}>
      <div className="flex items-center gap-2.5">
        <CalendarDays className="size-4 shrink-0 text-[var(--muted-foreground)]" aria-hidden="true" />
        <span className="text-sm font-medium text-[var(--text)]">Reopening date</span>
      </div>

      {editing ? (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label={`Reopening date after ${termName}`}
            className="h-9 w-auto"
          />
          <Button
            type="button"
            size="sm"
            disabled={!draft || setReopeningDate.isPending}
            onClick={() => save(draft)}
          >
            {setReopeningDate.isPending && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            Save
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {reopeningDate ? (
            <span className="rounded-full bg-[var(--success-bg)] px-3 py-1 text-sm font-medium text-[var(--success-fg)]">
              {formatDate(reopeningDate)}
            </span>
          ) : (
            // Stated plainly rather than left blank: an admin about to publish needs to notice the
            // date is missing, since it is the line parents look for first.
            <span className="text-sm text-[var(--muted-foreground)]">Not set for {termName}</span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setDraft(reopeningDate ?? "");
              setEditing(true);
            }}
          >
            {reopeningDate ? "Edit" : "Set date"}
          </Button>
          {reopeningDate && (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Clear the reopening date"
              disabled={setReopeningDate.isPending}
              onClick={() => save(null)}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
