"use client";

import { Download, Wallet } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusPill } from "@/components/data/status-pill";
import { feeStatusTone } from "@/components/fees/fee-status";
import { ChildTabs } from "@/components/parent/child-tabs";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { Button } from "@/components/ui/button";
import { combineFeeTotals } from "@/lib/fees/summary";
import { useReceiptDownload } from "@/lib/fees/use-receipt-download";
import { formatDate, formatGHS } from "@/lib/format";
import { useChildFees } from "@/lib/queries/parent";
import {
  FEE_STATUS_LABEL,
  FEE_TERM_LABEL,
  PAYMENT_METHOD_LABEL,
  type ExtraFeeAssignmentVM,
  type PaymentVM,
  type StudentFeeVM,
} from "@/lib/validators/fees";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

const CLASS_FEE_COLUMNS: DataTableColumn<StudentFeeVM>[] = [
  {
    key: "term",
    header: "Fee",
    render: (r) => (
      <span className="font-medium text-[var(--text)]">{FEE_TERM_LABEL[r.fee_term]}</span>
    ),
  },
  {
    key: "expected",
    header: "Expected",
    align: "right",
    hideOnMobile: true,
    render: (r) => formatGHS(r.expected),
  },
  {
    key: "arrears",
    header: "Arrears",
    align: "right",
    hideOnMobile: true,
    // A dash rather than GHS 0.00: most families carry nothing forward, and a column of zeroes
    // invites a parent to wonder what they missed.
    render: (r) =>
      r.arrears > 0 ? formatGHS(r.arrears) : <span className="text-[var(--muted-foreground)]">—</span>,
  },
  { key: "paid", header: "Paid", align: "right", render: (r) => formatGHS(r.paid) },
  {
    key: "balance",
    header: "Balance",
    align: "right",
    render: (r) => (
      <span className={cn(r.balance > 0 && "font-medium text-[var(--text)]")}>
        {formatGHS(r.balance)}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusPill label={FEE_STATUS_LABEL[r.status]} tone={feeStatusTone(r.status)} />,
  },
];

const EXTRA_FEE_COLUMNS: DataTableColumn<ExtraFeeAssignmentVM>[] = [
  {
    key: "fee",
    header: "Fee",
    render: (r) => <span className="font-medium text-[var(--text)]">{r.fee_name}</span>,
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    hideOnMobile: true,
    render: (r) => formatGHS(r.amount),
  },
  { key: "paid", header: "Paid", align: "right", render: (r) => formatGHS(r.paid) },
  { key: "balance", header: "Balance", align: "right", render: (r) => formatGHS(r.balance) },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusPill label={FEE_STATUS_LABEL[r.status]} tone={feeStatusTone(r.status)} />,
  },
];

function paymentColumns(
  onReceipt: (payment: PaymentVM) => void,
): DataTableColumn<PaymentVM>[] {
  return [
    {
      key: "date",
      header: "Date",
      render: (r) => <span className="text-[var(--text)]">{formatDate(r.paid_at)}</span>,
    },
    {
      key: "for",
      header: "Towards",
      render: (r) => <span className="font-medium text-[var(--text)]">{r.fee_label}</span>,
    },
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
    { key: "amount", header: "Amount", align: "right", render: (r) => formatGHS(r.amount) },
    {
      key: "receipt",
      header: "",
      align: "right",
      render: (r) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onReceipt(r)}
          // The visible word is enough for a sighted parent scanning the row; a screen reader
          // hears every button in the column, so each one names the payment it belongs to.
          aria-label={`Download receipt for ${formatGHS(r.amount)} paid on ${formatDate(r.paid_at)}`}
        >
          <Download className="size-3.5" aria-hidden="true" />
          Receipt
        </Button>
      ),
    },
  ];
}

/**
 * A child's fees, as their parent sees them: what is owed, what has been paid, and a receipt for
 * every payment.
 *
 * Read-only by design and by policy — a parent has SELECT and nothing else on the fee tables, so
 * there is no "pay now" action here to hide. The receipt is the same Official Receipt form the
 * office prints (`useReceiptDownload`), which is the point: a parent asked to prove they paid can
 * produce the school's own document rather than a screenshot.
 */
export function ChildFees({ id }: { id: string }) {
  const { data, isLoading, isError, refetch } = useChildFees(id);
  const onReceipt = useReceiptDownload();

  const totals = data ? combineFeeTotals(data.overview) : null;
  const nothingAtAll =
    !!data &&
    data.class_fees.length === 0 &&
    data.extra_fees.length === 0 &&
    data.payments.length === 0;
  const yearLabel = data?.year_name ? `${data.year_name} academic year` : "Current fees";

  return (
    <div className="space-y-6">
      <ChildTabs childId={id} />

      {isLoading && (
        <div className="space-y-4">
          <SkeletonBlock className="h-28 w-full" />
          <SkeletonBlock className="h-56 w-full" />
          <SkeletonBlock className="h-56 w-full" />
        </div>
      )}

      {isError && (
        <div className={cardShellClass}>
          <ErrorState message="Couldn't load fees." onRetry={() => refetch()} />
        </div>
      )}

      {nothingAtAll && (
        <div className={cardShellClass}>
          <EmptyState
            icon={Wallet}
            title="No fees yet"
            description="School fees and payments will appear here once the school raises them for this year."
          />
        </div>
      )}

      {data && totals && !nothingAtAll && (
        <>
          <div className={cn(cardShellClass, "space-y-4")}>
            <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
              <div>
                <p className="text-xs font-medium tracking-wide text-[var(--label)] uppercase">
                  Outstanding balance
                </p>
                <p
                  className={cn(
                    "mt-1 text-3xl font-semibold",
                    totals.outstanding > 0
                      ? "text-[var(--text)]"
                      : "text-[var(--success-fg)]",
                  )}
                >
                  {formatGHS(totals.outstanding)}
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{yearLabel}</p>
              </div>
              <dl className="flex flex-wrap gap-x-8 gap-y-3">
                <Figure label="Total due" value={formatGHS(totals.due)} />
                <Figure label="Paid" value={formatGHS(totals.paid)} />
                {data.overview.total_arrears > 0 && (
                  <Figure
                    label="Brought forward"
                    value={formatGHS(data.overview.total_arrears)}
                  />
                )}
              </dl>
            </div>
            {totals.outstanding === 0 && totals.due > 0 && (
              <p className="text-sm text-[var(--success-fg)]">
                Fully paid — thank you. Nothing is outstanding for this year.
              </p>
            )}
          </div>

          <section aria-labelledby="school-fees-heading" className={cn(cardShellClass, "space-y-3")}>
            <h2 id="school-fees-heading" className="text-base font-semibold text-[var(--text)]">
              School fees
            </h2>
            <DataTable
              columns={CLASS_FEE_COLUMNS}
              data={data.class_fees}
              getRowId={(row) => row.id}
              emptyTitle="No school fees raised yet"
              emptyDescription="The school hasn't billed school fees for this academic year yet."
            />
          </section>

          {data.extra_fees.length > 0 && (
            <section aria-labelledby="extra-fees-heading" className={cn(cardShellClass, "space-y-3")}>
              <h2 id="extra-fees-heading" className="text-base font-semibold text-[var(--text)]">
                Other fees
              </h2>
              <DataTable
                columns={EXTRA_FEE_COLUMNS}
                data={data.extra_fees}
                getRowId={(row) => row.id}
              />
            </section>
          )}

          <section aria-labelledby="payments-heading" className={cn(cardShellClass, "space-y-3")}>
            <div>
              <h2 id="payments-heading" className="text-base font-semibold text-[var(--text)]">
                Payments &amp; receipts
              </h2>
              {/* Said plainly because the table above is year-scoped and this one is not — a parent
                  who paid last year should know to look here for that receipt. */}
              <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                Every payment the school has recorded, newest first.
              </p>
            </div>
            <DataTable
              columns={paymentColumns(onReceipt)}
              data={data.payments}
              getRowId={(row) => row.id}
              emptyTitle="No payments recorded yet"
              emptyDescription="Payments appear here as soon as the school office records them."
            />
          </section>
        </>
      )}
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-[var(--label)] uppercase">{label}</dt>
      <dd className="mt-1 text-xl font-semibold text-[var(--text)]">{value}</dd>
    </div>
  );
}
