import type { FeesOverviewVM } from "@/lib/validators/fees";

// Minimal shapes the summary needs — satisfied by the mock store records and, post-Supabase, by a
// fee/payment aggregate. `expected` is the net amount owed for the term (after any discount).
export interface FeeRecordForSummary {
  expected: number;
  paid: number;
  arrears: number;
}
export interface ExtraFeeForSummary {
  amount: number;
  paid: number;
}

/** Derive the Overview figures from raw fee + extra-fee records. Pure so it's unit-testable and the
 *  same numbers back every card (golden rule 9). `collection_rate` is a whole percent of the total
 *  due (expected + arrears) that has been paid; a record counts as fully paid when its paid amount
 *  covers its due, pending when nothing is paid, partial otherwise. */
export function summarizeFees(
  records: readonly FeeRecordForSummary[],
  extras: readonly ExtraFeeForSummary[] = [],
): FeesOverviewVM {
  let total_expected = 0;
  let total_paid = 0;
  let total_arrears = 0;
  let fully_paid = 0;
  let partial = 0;
  let pending = 0;

  for (const r of records) {
    const due = r.expected + r.arrears;
    total_expected += r.expected;
    total_paid += r.paid;
    total_arrears += r.arrears;
    if (r.paid >= due) fully_paid += 1;
    else if (r.paid <= 0) pending += 1;
    else partial += 1;
  }

  const totalDue = total_expected + total_arrears;
  const outstanding = Math.max(0, totalDue - total_paid);
  const collection_rate = totalDue > 0 ? Math.round((total_paid / totalDue) * 100) : 0;

  let extra_total = 0;
  let extra_paid = 0;
  for (const e of extras) {
    extra_total += e.amount;
    extra_paid += e.paid;
  }

  return {
    total_expected,
    total_paid,
    outstanding,
    total_arrears,
    collection_rate,
    extra_total,
    extra_paid,
    extra_balance: Math.max(0, extra_total - extra_paid),
    extra_records: extras.length,
    fully_paid,
    partial,
    pending,
    total_records: records.length,
  };
}
