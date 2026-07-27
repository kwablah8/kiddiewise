"use client";

import { useState } from "react";
import { Download, Receipt } from "lucide-react";
import { SearchField } from "@/components/data/search-field";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { usePayments } from "@/lib/queries/fees";
import { PAYMENT_METHOD_LABEL, type PaymentVM, type FeesFilter } from "@/lib/validators/fees";
import { formatDate, formatGHS } from "@/lib/format";
import { matchesQuery } from "@/lib/search";
import { buildReceipt } from "@/lib/receipt";
import { downloadReceipt } from "@/lib/pdf/receipt-pdf";
import { useSchool } from "@/lib/queries/school";
import { useSession } from "@/lib/auth/useSession";
import { cardShellClass } from "@/lib/ui";

function buildColumns(onReceipt: (p: PaymentVM) => void): DataTableColumn<PaymentVM>[] {
  return [
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
  {
    key: "receipt",
    header: "",
    align: "right",
    render: (r) => (
      <Button type="button" variant="outline" size="sm" onClick={() => onReceipt(r)}>
        <Download className="size-3.5" aria-hidden="true" />
        Receipt
      </Button>
    ),
  },
  ];
}

export function PaymentHistoryTab({ filter }: { filter: FeesFilter }) {
  const { data, isLoading, isError, refetch } = usePayments(filter);
  const { data: school } = useSchool();
  const { profile } = useSession();
  const [query, setQuery] = useState("");

  function onReceipt(payment: PaymentVM) {
    downloadReceipt(
      buildReceipt({
        payment,
        // Read from the tenant, not hardcoded: the receipt is the school's document, and a wrong
        // name on it is worse than a plain one.
        schoolName: school?.name ?? "School",
        methodLabel: PAYMENT_METHOD_LABEL[payment.method],
        issuedBy: profile ? `${profile.first_name} ${profile.last_name}` : "the school office",
      }),
    );
  }

  // Reference is searchable alongside the name because that is how a disputed payment gets found:
  // a parent arrives with a receipt or a MoMo reference, not with a row number.
  const rows = (data ?? []).filter((p) =>
    matchesQuery(query, p.student_name, p.class_name, p.reference, p.amount),
  );

  const isEmpty = !isLoading && !isError && rows.length === 0;
  const noneAtAll = (data?.length ?? 0) === 0;

  return (
    <div className={cardShellClass}>
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Search by student, class or reference"
        label="Search payments"
        className="mb-3"
      />
      {isError ? (
        <ErrorState message="Couldn't load payments." onRetry={() => refetch()} />
      ) : isEmpty ? (
        // Two different empty states: nothing recorded yet is a different problem from a search
        // that found nothing, and telling someone "no payments yet" while they are searching reads
        // as if their data has vanished.
        <EmptyState
          icon={Receipt}
          title={noneAtAll ? "No payments found" : "No matching payments"}
          description={
            noneAtAll
              ? "Recorded payments will appear here as fees are collected."
              : `Nothing matches “${query}”. Check the spelling, or clear the search.`
          }
        />
      ) : (
        <DataTable
          columns={buildColumns(onReceipt)}
          data={rows}
          getRowId={(row) => row.id}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
