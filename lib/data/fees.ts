import { simulate } from "./_devState";
import { store } from "@/lib/mock/store";
import { summarizeFees } from "@/lib/fees/summary";
import type {
  FeeStructureVM,
  FeesOverviewVM,
  PaymentVM,
  FeesFilter,
  FeeStatus,
  StudentFeeVM,
  ExtraFeeStructureVM,
  ExtraFeeAssignmentVM,
} from "@/lib/validators/fees";

function statusFor(paid: number, due: number): FeeStatus {
  if (paid >= due) return "paid";
  if (paid <= 0) return "pending";
  return "partial";
}

function classNameFor(classId: string | undefined): string | null {
  return classId ? (store.classes.find((c) => c.id === classId)?.name ?? null) : null;
}

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
  const className = classNameFor(filter.class_id);
  const result = store.payments
    .filter((p) => (className ? p.class_name === className : true))
    .slice()
    .sort((a, b) => (a.paid_at < b.paid_at ? 1 : a.paid_at > b.paid_at ? -1 : 0));
  return simulate(result, []);
}

// Class Fees — per-student fee position (derived balance + status) for the filtered scope.
export function listClassFees(filter: FeesFilter = {}): Promise<StudentFeeVM[]> {
  const result = store.studentFeeRecords
    .filter((r) => matches(r, filter))
    .map((r): StudentFeeVM => {
      const due = r.expected + r.arrears;
      return {
        id: r.id,
        student_id: r.student_id,
        student_name: r.student_name,
        class_name: r.class_name,
        expected: r.expected,
        discount: r.discount,
        scholarship_type: r.scholarship_type,
        paid: r.paid,
        arrears: r.arrears,
        balance: Math.max(0, due - r.paid),
        status: statusFor(r.paid, due),
      };
    })
    .sort((a, b) => a.student_name.localeCompare(b.student_name));
  return simulate(result, []);
}

// Extra Fees — the definitions, filtered to those that apply to the selected class (or all).
export function listExtraFeeStructures(filter: FeesFilter = {}): Promise<ExtraFeeStructureVM[]> {
  const className = classNameFor(filter.class_id);
  const result = store.extraFeeStructures.filter(
    (s) => !className || s.scope === "All classes" || s.scope === className,
  );
  return simulate(result, []);
}

// Extra Fees — the assigned records (derived balance + status), the same source the Overview sums.
export function listExtraFeeAssignments(filter: FeesFilter = {}): Promise<ExtraFeeAssignmentVM[]> {
  const className = classNameFor(filter.class_id);
  const result = store.extraFeeRecords
    .filter((r) => !className || r.class_name === className)
    .map((r): ExtraFeeAssignmentVM => ({
      id: r.id,
      student_name: r.student_name,
      class_name: r.class_name,
      fee_name: r.fee_name,
      amount: r.amount,
      paid: r.paid,
      balance: Math.max(0, r.amount - r.paid),
      status: statusFor(r.paid, r.amount),
    }));
  return simulate(result, []);
}
