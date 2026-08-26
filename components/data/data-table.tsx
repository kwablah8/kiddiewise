"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { EmptyState } from "@/components/states/empty-state";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
  className?: string;
  /** Hide this column below the `sm` breakpoint (progressive disclosure on phones). The row still
   *  scrolls horizontally for any columns that remain wider than the screen. */
  hideOnMobile?: boolean;
}

/** Anything inside a row that owns its own activation, clicking it must not also open the row. */
const INTERACTIVE_SELECTOR =
  'a[href], button, input, select, textarea, label, [role="button"], [role="menuitem"], [role="checkbox"], [role="switch"]';

/**
 * Whether a row-level click/keypress actually came from something interactive inside the row.
 *
 * Two distinct cases, both of which reached production as the same bug, clicking "Invite" on the
 * staff page opened the teacher's profile behind the dialog:
 *
 *  1. A control inside the row (button, link, checkbox). The event bubbles up through the DOM to the
 *     row, which then navigates on top of whatever the control just did.
 *  2. A dialog or menu the row opened. Those render through a portal, so they sit outside the row in
 *     the DOM, but React dispatches synthetic events through the COMPONENT tree, so every click
 *     inside them still arrives at this handler. Containment is what tells the two apart.
 *
 * Fixed here rather than with a `stopPropagation` wrapper at each call site: the row is what
 * over-reaches, so the row is where it gets bounded, otherwise every future table column with a
 * button in it has to remember the same incantation.
 */
function isFromInteractiveChild(event: {
  target: EventTarget | null;
  currentTarget: HTMLElement;
}): boolean {
  const target = event.target;
  if (!(target instanceof Element)) return false;
  // Portalled UI: outside the row in the DOM, inside it in React's tree.
  if (!event.currentTarget.contains(target)) return true;
  const hit = target.closest(INTERACTIVE_SELECTOR);
  // The row itself carries role="button", so it matches the selector, ignoring that match is what
  // keeps ordinary clicks on a cell working.
  return hit !== null && hit !== event.currentTarget;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  isLoading?: boolean;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  /** When provided, rows become clickable (and keyboard-activatable via Enter/Space). */
  onRowClick?: (row: T) => void;
}

/**
 * Generic data table: uppercase muted headers, comfortable rows, right-aligned numerics,
 * row hover, pagination (06-UI §6). Consumers render `<StatusPill>` etc. from `render`.
 */
export function DataTable<T>({
  columns,
  data,
  getRowId,
  isLoading = false,
  pageSize = 8,
  emptyTitle = "No records yet",
  emptyDescription,
  onRowClick,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(data.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const rows = useMemo(
    () => data.slice(currentPage * pageSize, currentPage * pageSize + pageSize),
    [data, currentPage, pageSize],
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow className="border-[var(--border)] hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  "h-9 text-[11px] font-medium tracking-wide text-[var(--label)] uppercase",
                  col.align === "right" && "text-right",
                  col.hideOnMobile && "hidden sm:table-cell",
                )}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={getRowId(row)}
              onClick={
                onRowClick
                  ? (e) => {
                      if (isFromInteractiveChild(e)) return;
                      onRowClick(row);
                    }
                  : undefined
              }
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? "button" : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      // Enter on a focused button inside the row activates that button; the row must
                      // not treat the same keypress as its own activation.
                      if (isFromInteractiveChild(e)) return;
                      e.preventDefault();
                      onRowClick(row);
                    }
                  : undefined
              }
              className={cn(
                "border-[var(--border)] hover:bg-[var(--bg)]",
                onRowClick &&
                  "cursor-pointer focus-visible:bg-[var(--bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-inset",
              )}
            >
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  className={cn(
                    "py-3 text-sm whitespace-nowrap text-[var(--text)]",
                    col.align === "right" && "text-right",
                    col.hideOnMobile && "hidden sm:table-cell",
                    col.className,
                  )}
                >
                  {col.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pageCount > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-[var(--muted-foreground)]">
            Page {currentPage + 1} of {pageCount}
          </p>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={currentPage === 0}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={currentPage === pageCount - 1}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
