"use client";

import { useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusPill } from "@/components/data/status-pill";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { FeeStructureDialog } from "./fee-structure-dialog";
import { useFeeStructures } from "@/lib/queries/fees";
import { FEE_TERM_LABEL, type FeeStructureVM, type FeesFilter } from "@/lib/validators/fees";
import { formatDate, formatGHS } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";

const columns: DataTableColumn<FeeStructureVM>[] = [
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
];

export function FeeStructureTab({ filter }: { filter: FeesFilter }) {
  const { data, isLoading, isError, refetch } = useFeeStructures(filter);
  const [open, setOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

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
        {isError ? (
          <ErrorState message="Couldn't load fee structures." onRetry={() => refetch()} />
        ) : isEmpty ? (
          <EmptyState
            icon={Wallet}
            title="No fee structures yet"
            description="Create a fee structure to define what a class owes for a year or term."
          />
        ) : (
          <DataTable
            columns={columns}
            data={data ?? []}
            getRowId={(row) => row.id}
            isLoading={isLoading}
          />
        )}
      </div>

      <FeeStructureDialog key={dialogKey} open={open} onOpenChange={setOpen} />
    </div>
  );
}
