"use client";

import { Receipt } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { usePayments } from "@/lib/queries/fees";
import { PAYMENT_METHOD_LABEL, type PaymentVM, type FeesFilter } from "@/lib/validators/fees";
import { formatDate, formatGHS } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";

const columns: DataTableColumn<PaymentVM>[] = [
  {
    key: "student",
    header: "Student",
    render: (r) => <span className="font-medium text-[var(--text)]">{r.student_name}</span>,
  },
  { key: "class", header: "Class", hideOnMobile: true, render: (r) => r.class_name },
  { key: "amount", header: "Amount", align: "right", render: (r) => formatGHS(r.amount) },
  {
    key: "method",
    header: "Method",
    hideOnMobile: true,
    render: (r) => PAYMENT_METHOD_LABEL[r.method],
  },
  {
    key: "reference",
    header: "Reference",
    hideOnMobile: true,
    render: (r) => r.reference ?? <span className="text-[var(--muted-foreground)]">—</span>,
  },
  {
    key: "date",
    header: "Date",
    render: (r) => <span className="text-[var(--muted-foreground)]">{formatDate(r.paid_at)}</span>,
  },
];

export function PaymentHistoryTab({ filter }: { filter: FeesFilter }) {
  const { data, isLoading, isError, refetch } = usePayments(filter);
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

  return (
    <div className={cardShellClass}>
      {isError ? (
        <ErrorState message="Couldn't load payments." onRetry={() => refetch()} />
      ) : isEmpty ? (
        <EmptyState
          icon={Receipt}
          title="No payments found"
          description="Recorded payments will appear here as fees are collected."
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
  );
}
