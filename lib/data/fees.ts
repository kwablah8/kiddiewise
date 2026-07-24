import { simulate } from "./_devState";
import { store } from "@/lib/mock/store";
import { summarizeFees } from "@/lib/fees/summary";
import type { FeeStructureVM, FeesOverviewVM, PaymentVM, FeesFilter } from "@/lib/validators/fees";

const EMPTY_OVERVIEW: FeesOverviewVM = {
  total_expected: 0,
  total_paid: 0,
  outstanding: 0,
  total_arrears: 0,
  collection_rate: 0,
  extra_total: 0,
  extra_paid: 0,
  extra_balance: 0,
  extra_records: 0,
  fully_paid: 0,
  partial: 0,
  pending: 0,
  total_records: 0,
};

function matches(
  row: { class_id: string; academic_year_id: string; term: string },
  f: FeesFilter,
): boolean {
  if (f.class_id && row.class_id !== f.class_id) return false;
  if (f.academic_year_id && row.academic_year_id !== f.academic_year_id) return false;
  if (f.term && row.term !== f.term) return false;
  return true;
}

// SEAM: real path is a `fee_collection` view/RPC scoped by RLS. Here we filter the mock records and
// derive the figures via the pure `summarizeFees` helper (golden rule 9). Extra fees are school-wide
// in the mock, so they're shown as-is regardless of the class/term filter.
export function getFeesOverview(filter: FeesFilter = {}): Promise<FeesOverviewVM> {
  const records = store.studentFeeRecords.filter((r) => matches(r, filter));
  return simulate(summarizeFees(records, store.extraFeeRecords), EMPTY_OVERVIEW);
}

export function listFeeStructures(filter: FeesFilter = {}): Promise<FeeStructureVM[]> {
  const result = store.feeStructures
    .filter((s) => matches(s, filter))
    .slice()
    .sort((a, b) =>
      a.class_name < b.class_name ? -1 : a.class_name > b.class_name ? 1 : a.term.localeCompare(b.term),
    );
  return simulate(result, []);
}

export function listPayments(filter: FeesFilter = {}): Promise<PaymentVM[]> {
  const className = filter.class_id
    ? (store.classes.find((c) => c.id === filter.class_id)?.name ?? null)
    : null;
  const result = store.payments
    .filter((p) => (className ? p.class_name === className : true))
    .slice()
    .sort((a, b) => (a.paid_at < b.paid_at ? 1 : a.paid_at > b.paid_at ? -1 : 0));
  return simulate(result, []);
}
