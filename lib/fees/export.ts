import type { ExportColumn } from "@/lib/export";
import { formatDate, formatGHS } from "@/lib/format";
import {
  FEE_STATUS_LABEL,
  FEE_TERM_LABEL,
  PAYMENT_METHOD_LABEL,
  type FeesFilter,
  type PaymentVM,
  type StudentFeeVM,
} from "@/lib/validators/fees";

const money = (value: number) => value.toFixed(2);

/** Payment History. The spreadsheet gets a plain date and plain amounts so it can sort and total. */
export const paymentColumns: ExportColumn<PaymentVM>[] = [
  { header: "Date", width: 1.1, pdf: (p) => formatDate(p.paid_at), csv: (p) => p.paid_at.slice(0, 10) },
  { header: "Student", width: 2, pdf: (p) => p.student_name },
  { header: "Class", width: 1.2, pdf: (p) => p.class_name },
  { header: "Fee", width: 1.6, pdf: (p) => p.fee_label },
  { header: "Method", width: 1.3, pdf: (p) => PAYMENT_METHOD_LABEL[p.method] },
  { header: "Reference", width: 1.5, pdf: (p) => p.reference ?? "—", csv: (p) => p.reference ?? "" },
  { header: "Received by", width: 1.5, pdf: (p) => p.recorded_by_name ?? "—", csv: (p) => p.recorded_by_name ?? "" },
  { header: "Amount", width: 1.3, align: "right", pdf: (p) => formatGHS(p.amount), csv: (p) => money(p.amount) },
];

/** Class Fees: each student's position for the year and term on screen. */
export const classFeeColumns: ExportColumn<StudentFeeVM>[] = [
  { header: "Student", width: 2.2, pdf: (r) => r.student_name },
  { header: "Class", width: 1.2, pdf: (r) => r.class_name },
  { header: "Term", width: 1.1, pdf: (r) => FEE_TERM_LABEL[r.fee_term] },
  { header: "Scholarship", width: 1.4, pdf: (r) => r.scholarship_type ?? "—", csv: (r) => r.scholarship_type ?? "" },
  { header: "Expected", width: 1.3, align: "right", pdf: (r) => formatGHS(r.expected), csv: (r) => money(r.expected) },
  { header: "Paid", width: 1.3, align: "right", pdf: (r) => formatGHS(r.paid), csv: (r) => money(r.paid) },
  { header: "Balance", width: 1.3, align: "right", pdf: (r) => formatGHS(r.balance), csv: (r) => money(r.balance) },
  { header: "Status", width: 0.9, pdf: (r) => FEE_STATUS_LABEL[r.status] },
];

/** "Basic 1 · 2026/2027 · First Term", the filters in force, for the line under the title. */
export function feesFilterLabels(
  filter: FeesFilter,
  classes: { id: string; name: string }[],
  years: { id: string; name: string }[],
): string[] {
  return [
    filter.class_id ? classes.find((c) => c.id === filter.class_id)?.name : undefined,
    filter.academic_year_id ? years.find((y) => y.id === filter.academic_year_id)?.name : undefined,
    filter.term ? FEE_TERM_LABEL[filter.term] : undefined,
  ].filter((label): label is string => !!label);
}

export function paymentDetails(filterLabels: string[], payments: PaymentVM[]): string[] {
  const total = payments.reduce((sum, p) => sum + p.amount, 0);
  return [
    ...filterLabels,
    `${payments.length} payment${payments.length === 1 ? "" : "s"}`,
    `Total ${formatGHS(total)}`,
  ];
}

export function classFeeDetails(filterLabels: string[], rows: StudentFeeVM[]): string[] {
  const sum = (pick: (r: StudentFeeVM) => number) => rows.reduce((total, r) => total + pick(r), 0);
  return [
    ...filterLabels,
    `${rows.length} student${rows.length === 1 ? "" : "s"}`,
    `Expected ${formatGHS(sum((r) => r.expected))}`,
    `Paid ${formatGHS(sum((r) => r.paid))}`,
    `Outstanding ${formatGHS(sum((r) => r.balance))}`,
  ];
}
