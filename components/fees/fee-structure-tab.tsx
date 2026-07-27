"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { SearchField } from "@/components/data/search-field";
import { StatusPill } from "@/components/data/status-pill";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FeeStructureDialog } from "./fee-structure-dialog";
import { toast } from "@/lib/toast";
import { useDeleteFeeStructure, useFeeStructures } from "@/lib/queries/fees";
import { FEE_TERM_LABEL, type FeeStructureVM, type FeesFilter } from "@/lib/validators/fees";
import { formatDate, formatGHS } from "@/lib/format";
import { matchesQuery } from "@/lib/search";
import { cardShellClass } from "@/lib/ui";

function buildColumns(
  onEdit: (row: FeeStructureVM) => void,
  onDelete: (row: FeeStructureVM) => void,
): DataTableColumn<FeeStructureVM>[] {
  return [
  {
    key: "class",
    header: "Class",
    render: (r) => <span className="font-medium text-[var(--text)]">{r.class_name}</span>,
  },
  { key: "term", header: "Term", render: (r) => FEE_TERM_LABEL[r.term] },
  { key: "amount", header: "Amount", align: "right", render: (r) => formatGHS(r.amount) },
  {
    key: "due",
    header: "Due date",
    hideOnMobile: true,
    render: (r) =>
      r.due_date ? formatDate(r.due_date) : <span className="text-[var(--muted-foreground)]">—</span>,
  },
  {
    key: "late",
    header: "Late fee",
    align: "right",
    hideOnMobile: true,
    render: (r) =>
      r.late_fee != null ? formatGHS(r.late_fee) : <span className="text-[var(--muted-foreground)]">—</span>,
  },
  {
    key: "mandatory",
    header: "Mandatory",
    hideOnMobile: true,
    render: (r) =>
      r.is_mandatory ? (
        <StatusPill label="Mandatory" tone="neutral" />
      ) : (
        <span className="text-[var(--muted-foreground)]">Optional</span>
      ),
  },
  {
    key: "actions",
    header: "",
    align: "right",
    // Both labels name the class AND the term: two Basic 1 rows differing only by term are exactly
    // the case this column exists to untangle, and "Edit Basic 1" twice over tells a screen-reader
    // user nothing.
    render: (r) => (
      <div className="flex items-center justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit ${r.class_name} ${FEE_TERM_LABEL[r.term]} fee`}
          onClick={() => onEdit(r)}
        >
          <Pencil className="size-4" aria-hidden="true" />
        </Button>
        {/* Ghost until hover, not permanently red: there is one of these on every row, and a
            column of red icons reads as a table full of errors. */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-[var(--muted-foreground)] hover:text-[var(--danger)]"
          aria-label={`Delete ${r.class_name} ${FEE_TERM_LABEL[r.term]} fee`}
          onClick={() => onDelete(r)}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </div>
    ),
  },
  ];
}

export function FeeStructureTab({ filter }: { filter: FeesFilter }) {
  const { data, isLoading, isError, refetch } = useFeeStructures(filter);
  const [open, setOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [editStructure, setEditStructure] = useState<FeeStructureVM | null>(null);
  const [editKey, setEditKey] = useState(0);
  const [deleteStructure, setDeleteStructure] = useState<FeeStructureVM | null>(null);
  const [query, setQuery] = useState("");

  const columns = buildColumns(
    (row) => {
      setEditKey((k) => k + 1);
      setEditStructure(row);
    },
    (row) => setDeleteStructure(row),
  );

  const rows = (data ?? []).filter((r) =>
    matchesQuery(query, r.class_name, r.academic_year_name, r.description, r.amount),
  );
  const isEmpty = !isLoading && !isError && rows.length === 0;
  const noneAtAll = (data?.length ?? 0) === 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => {
            setDialogKey((k) => k + 1);
            setOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden="true" />
          Create Fee Structure
        </Button>
      </div>

      <div className={cardShellClass}>
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search by class, year or description"
          label="Search fee structures"
          className="mb-3"
        />
        {isError ? (
          <ErrorState message="Couldn't load fee structures." onRetry={() => refetch()} />
        ) : isEmpty ? (
          <EmptyState
            icon={Wallet}
            title={noneAtAll ? "No fee structures yet" : "No matching fee structures"}
            description={
              noneAtAll
                ? "Create a fee structure to define what a class owes for a year or term."
                : `Nothing matches “${query}”. Check the spelling, or clear the search.`
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            getRowId={(row) => row.id}
            isLoading={isLoading}
          />
        )}
      </div>

      <FeeStructureDialog key={dialogKey} mode="create" open={open} onOpenChange={setOpen} />

      <FeeStructureDialog
        key={`edit-${editKey}`}
        mode="edit"
        structure={editStructure ?? undefined}
        open={!!editStructure}
        onOpenChange={(next) => {
          if (!next) setEditStructure(null);
        }}
      />

      <ConfirmDeleteFeeStructureDialog
        structure={deleteStructure}
        onOpenChange={() => setDeleteStructure(null)}
      />
    </div>
  );
}

function ConfirmDeleteFeeStructureDialog({
  structure,
  onOpenChange,
}: {
  structure: FeeStructureVM | null;
  onOpenChange: (open: boolean) => void;
}) {
  const deleteFeeStructure = useDeleteFeeStructure();

  async function handleConfirm() {
    if (!structure) return;
    try {
      await deleteFeeStructure.mutateAsync({ id: structure.id });
      toast.success("Fee structure deleted", {
        description: `${structure.class_name} — ${FEE_TERM_LABEL[structure.term]} removed.`,
      });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <Dialog open={!!structure} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this fee structure?</DialogTitle>
          <DialogDescription>
            {structure && (
              <>
                {/* Names class, term AND amount — telling two near-identical rows apart before one
                    of them is removed is the entire job of this dialog. */}
                <strong className="text-[var(--text)]">
                  {structure.class_name} — {FEE_TERM_LABEL[structure.term]},{" "}
                  {formatGHS(structure.amount)}
                </strong>{" "}
                will be removed from the fee structure list. Students&rsquo; existing invoices and
                payments are not affected.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteFeeStructure.isPending}
          >
            {deleteFeeStructure.isPending && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
