"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusPill } from "@/components/data/status-pill";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { BulkAssignDialog } from "./bulk-assign-dialog";
import { AssignIndividualDialog } from "./assign-individual-dialog";
import { feeStatusTone } from "./fee-status";
import { useClassFees } from "@/lib/queries/fees";
import { useClasses } from "@/lib/queries/academics";
import { FEE_STATUS_LABEL, type StudentFeeVM, type FeesFilter } from "@/lib/validators/fees";
import { formatGHS } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";

const columns: DataTableColumn<StudentFeeVM>[] = [
  {
    key: "student",
    header: "Student",
    render: (r) => <span className="font-medium text-[var(--text)]">{r.student_name}</span>,
  },
  { key: "class", header: "Class", hideOnMobile: true, render: (r) => r.class_name },
  {
    key: "scholarship",
    header: "Scholarship",
    hideOnMobile: true,
    render: (r) =>
      r.scholarship_type ?? <span className="text-[var(--muted-foreground)]">—</span>,
  },
  { key: "expected", header: "Expected", align: "right", hideOnMobile: true, render: (r) => formatGHS(r.expected) },
  { key: "paid", header: "Paid", align: "right", hideOnMobile: true, render: (r) => formatGHS(r.paid) },
  { key: "balance", header: "Balance", align: "right", render: (r) => formatGHS(r.balance) },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusPill label={FEE_STATUS_LABEL[r.status]} tone={feeStatusTone(r.status)} />,
  },
];

export function ClassFeesTab({ filter }: { filter: FeesFilter }) {
  const { data, isLoading, isError, refetch } = useClassFees(filter);
  const { data: classes } = useClasses();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkKey, setBulkKey] = useState(0);
  const [indivOpen, setIndivOpen] = useState(false);
  const [indivKey, setIndivKey] = useState(0);
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;
  const selectedClass = filter.class_id ? classes?.find((c) => c.id === filter.class_id) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIndivKey((k) => k + 1);
            setIndivOpen(true);
          }}
        >
          Assign Individual
        </Button>
        <Button
          type="button"
          disabled={!selectedClass}
          title={selectedClass ? undefined : "Select a class to bulk-assign"}
          onClick={() => {
            setBulkKey((k) => k + 1);
            setBulkOpen(true);
          }}
        >
          Bulk Assign Fees
        </Button>
      </div>

      {!selectedClass && (
        <p className="text-sm text-[var(--muted-foreground)]">
          Showing all students. Select a class above to bulk-assign fees to it.
        </p>
      )}

      <div className={cardShellClass}>
        {isError ? (
          <ErrorState message="Couldn't load class fees." onRetry={() => refetch()} />
        ) : isEmpty ? (
          <EmptyState
            icon={Users}
            title="No student fees yet"
            description="Assign fees to a class or an individual student to get started."
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

      {selectedClass && (
        <BulkAssignDialog
          key={bulkKey}
          classId={selectedClass.id}
          className={selectedClass.name}
          open={bulkOpen}
          onOpenChange={setBulkOpen}
        />
      )}
      <AssignIndividualDialog
        key={indivKey}
        classId={filter.class_id}
        open={indivOpen}
        onOpenChange={setIndivOpen}
      />
    </div>
  );
}
