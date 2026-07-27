"use client";

import { useState } from "react";
import { Coins, Plus, Receipt } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { SearchField } from "@/components/data/search-field";
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
import { matchesQuery } from "@/lib/search";
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

  // Two independent searches, because these are two different questions. "Which extra fees do we
  // offer?" is asked of the structures; "has this child paid for transport?" is asked of the
  // assignments. One shared box would make answering either awkward.
  const [structQuery, setStructQuery] = useState("");
  const [assignQuery, setAssignQuery] = useState("");

  const structRows = (structures.data ?? []).filter((r) =>
    matchesQuery(structQuery, r.name, r.description, r.scope, r.amount),
  );
  const assignRows = (assignments.data ?? []).filter((r) =>
    matchesQuery(assignQuery, r.student_name, r.class_name, r.fee_name),
  );

  const structEmpty = !structures.isLoading && !structures.isError && structRows.length === 0;
  const assignEmpty = !assignments.isLoading && !assignments.isError && assignRows.length === 0;
  const noStructsAtAll = (structures.data?.length ?? 0) === 0;
  const noAssignsAtAll = (assignments.data?.length ?? 0) === 0;

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
          <SearchField
            value={structQuery}
            onChange={setStructQuery}
            placeholder="Search by name or scope"
            label="Search extra fee structures"
            className="mb-3"
          />
          {structures.isError ? (
            <ErrorState message="Couldn't load extra fee structures." onRetry={() => structures.refetch()} />
          ) : structEmpty ? (
            <EmptyState
              icon={Coins}
              title={noStructsAtAll ? "No extra fee structures" : "No matching extra fees"}
              description={
                noStructsAtAll
                  ? "Create an extra fee (transport, feeding, uniform, etc.) to assign to students."
                  : `Nothing matches “${structQuery}”. Check the spelling, or clear the search.`
              }
            />
          ) : (
            <DataTable
              columns={structureColumns}
              data={structRows}
              getRowId={(row) => row.id}
              isLoading={structures.isLoading}
            />
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--text)]">Assigned Extra Fees</h2>
        <div className={cardShellClass}>
          <SearchField
            value={assignQuery}
            onChange={setAssignQuery}
            placeholder="Search by student, class or fee"
            label="Search assigned extra fees"
            className="mb-3"
          />
          {assignments.isError ? (
            <ErrorState message="Couldn't load assigned extra fees." onRetry={() => assignments.refetch()} />
          ) : assignEmpty ? (
            <EmptyState
              icon={Receipt}
              title={noAssignsAtAll ? "No extra fees assigned" : "No matching assignments"}
              description={
                noAssignsAtAll
                  ? "Extra fees assigned to students will appear here."
                  : `Nothing matches “${assignQuery}”. Check the spelling, or clear the search.`
              }
            />
          ) : (
            <DataTable
              columns={assignmentColumns}
              data={assignRows}
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
