"use client";

import { useState } from "react";
import { Coins, Plus, Receipt } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusPill } from "@/components/data/status-pill";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { ExtraFeeStructureDialog } from "./extra-fee-structure-dialog";
import { feeStatusTone } from "./fee-status";
import { useExtraFeeAssignments, useExtraFeeStructures } from "@/lib/queries/fees";
import {
  EXTRA_FREQUENCY_LABEL,
  FEE_STATUS_LABEL,
  type ExtraFeeAssignmentVM,
  type ExtraFeeStructureVM,
  type FeesFilter,
} from "@/lib/validators/fees";
import { formatGHS } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";

const structureColumns: DataTableColumn<ExtraFeeStructureVM>[] = [
  {
    key: "name",
    header: "Name",
    render: (r) => <span className="font-medium text-[var(--text)]">{r.name}</span>,
  },
  { key: "amount", header: "Amount", align: "right", render: (r) => formatGHS(r.amount) },
  {
    key: "frequency",
    header: "Frequency",
    hideOnMobile: true,
    render: (r) => EXTRA_FREQUENCY_LABEL[r.frequency],
  },
  { key: "scope", header: "Applies to", hideOnMobile: true, render: (r) => r.scope },
];

const assignmentColumns: DataTableColumn<ExtraFeeAssignmentVM>[] = [
  {
    key: "student",
    header: "Student",
    render: (r) => <span className="font-medium text-[var(--text)]">{r.student_name}</span>,
  },
  { key: "fee", header: "Fee", hideOnMobile: true, render: (r) => r.fee_name },
  { key: "class", header: "Class", hideOnMobile: true, render: (r) => r.class_name },
  { key: "amount", header: "Amount", align: "right", hideOnMobile: true, render: (r) => formatGHS(r.amount) },
  { key: "paid", header: "Paid", align: "right", hideOnMobile: true, render: (r) => formatGHS(r.paid) },
  { key: "balance", header: "Balance", align: "right", render: (r) => formatGHS(r.balance) },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusPill label={FEE_STATUS_LABEL[r.status]} tone={feeStatusTone(r.status)} />,
  },
];

export function ExtraFeesTab({ filter }: { filter: FeesFilter }) {
  const structures = useExtraFeeStructures(filter);
  const assignments = useExtraFeeAssignments(filter);
  const [open, setOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);

  const structEmpty =
    !structures.isLoading && !structures.isError && (structures.data?.length ?? 0) === 0;
  const assignEmpty =
    !assignments.isLoading && !assignments.isError && (assignments.data?.length ?? 0) === 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => {
            setDialogKey((k) => k + 1);
            setOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden="true" />
          Create Extra Fee Structure
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--text)]">Extra Fee Structures</h2>
        <div className={cardShellClass}>
          {structures.isError ? (
            <ErrorState message="Couldn't load extra fee structures." onRetry={() => structures.refetch()} />
          ) : structEmpty ? (
            <EmptyState
              icon={Coins}
              title="No extra fee structures"
              description="Create an extra fee (transport, feeding, uniform, etc.) to assign to students."
            />
          ) : (
            <DataTable
              columns={structureColumns}
              data={structures.data ?? []}
              getRowId={(row) => row.id}
              isLoading={structures.isLoading}
            />
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--text)]">Assigned Extra Fees</h2>
        <div className={cardShellClass}>
          {assignments.isError ? (
            <ErrorState message="Couldn't load assigned extra fees." onRetry={() => assignments.refetch()} />
          ) : assignEmpty ? (
            <EmptyState
              icon={Receipt}
              title="No extra fees assigned"
              description="Extra fees assigned to students will appear here."
            />
          ) : (
            <DataTable
              columns={assignmentColumns}
              data={assignments.data ?? []}
              getRowId={(row) => row.id}
              isLoading={assignments.isLoading}
            />
          )}
        </div>
      </section>

      <ExtraFeeStructureDialog key={dialogKey} open={open} onOpenChange={setOpen} />
    </div>
  );
}
