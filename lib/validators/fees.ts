import { z } from "zod";

// A fee applies to a whole year or a single term (mirrors the reference's Full Year / term split).
export const feeTerm = z.enum(["full_year", "first", "second", "third"]);
export type FeeTerm = z.infer<typeof feeTerm>;

// GHS 10,000,000 — orders of magnitude above any real termly fee, but a hard ceiling that turns a
// fat-fingered or hostile amount (and Infinity, which `.positive()` alone lets through) into a
// validation error instead of a corrupt ledger row.
const MAX_AMOUNT = 10_000_000;

// A money field: a finite, two-decimal (pesewa-precision) number under the ceiling. `min: "nonneg"`
// allows 0 (late fees, optional charges); the default requires a positive amount. Every fee/payment
// amount goes through this so no screen can write NaN, Infinity, a negative, a sub-pesewa fraction,
// or an absurd figure straight past Zod.
function amount(min: "positive" | "nonneg" = "positive") {
  return z.coerce
    .number()
    .refine((v) => Number.isFinite(v), "Enter a valid amount")
    .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, "Use at most two decimal places")
    .refine((v) => v <= MAX_AMOUNT, "That amount is too large")
    .refine(
      (v) => (min === "nonneg" ? v >= 0 : v > 0),
      min === "nonneg" ? "Can't be negative" : "Enter an amount",
    );
}

export const FEE_TERM_LABEL: Record<FeeTerm, string> = {
  full_year: "Full Year",
  first: "First Term",
  second: "Second Term",
  third: "Third Term",
};

export const paymentMethod = z.enum(["cash", "bank_transfer", "mobile_money", "cheque", "other"]);
export type PaymentMethod = z.infer<typeof paymentMethod>;

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  mobile_money: "Mobile Money",
  cheque: "Cheque",
  other: "Other",
};

// A reusable fee definition for a class + year (+ term). (03-DATABASE §9 `fee_items`/`invoices`,
// enriched with the reference's due-date / late-fee / mandatory concepts.)
export const feeStructureVM = z.object({
  id: z.string(),
  class_id: z.string(),
  class_name: z.string(),
  academic_year_id: z.string(),
  academic_year_name: z.string(),
  term: feeTerm,
  amount: z.number(),
  due_date: z.string().nullable(),
  late_fee: z.number().nullable(),
  description: z.string().nullable(),
  is_mandatory: z.boolean(),
});
export type FeeStructureVM = z.infer<typeof feeStructureVM>;

// A payment recorded against a student's fees (03-DATABASE §9 `payments`).
export const paymentVM = z.object({
  id: z.string(),
  student_id: z.string(),
  student_name: z.string(),
  class_name: z.string(),
  amount: z.number(),
  method: paymentMethod,
  reference: z.string().nullable(),
  paid_at: z.string(),
  fee_label: z.string(),
});
export type PaymentVM = z.infer<typeof paymentVM>;

// The derived Overview figures (golden rule 9 — computed by lib/fees/summary.ts, never stored).
export const feesOverviewVM = z.object({
  total_expected: z.number(),
  total_paid: z.number(),
  outstanding: z.number(),
  total_arrears: z.number(),
  collection_rate: z.number(),
  extra_total: z.number(),
  extra_paid: z.number(),
  extra_balance: z.number(),
  extra_records: z.number(),
  fully_paid: z.number(),
  partial: z.number(),
  pending: z.number(),
  total_records: z.number(),
});
export type FeesOverviewVM = z.infer<typeof feesOverviewVM>;

// Create-fee-structure form contract (final Server-Action shape).
export const feeStructureCreateSchema = z.object({
  class_id: z.string().min(1, "Required"),
  academic_year_id: z.string().min(1, "Required"),
  term: feeTerm.default("full_year"),
  amount: amount(),
  due_date: z.string().nullable().default(null),
  late_fee: amount("nonneg").nullable().default(null),
  description: z.string().nullable().default(null),
  is_mandatory: z.boolean().default(true),
});
export type FeeStructureCreateInput = z.infer<typeof feeStructureCreateSchema>;

// Edit contract. A full replace rather than a partial patch: the dialog renders and submits every
// field, so optional-everything would be ceremony with a live footgun — a field accidentally left
// out of the patch keeps its old value and the compiler says nothing.
export const feeStructureUpdateSchema = feeStructureCreateSchema.extend({
  id: z.string().min(1, "Required"),
});
export type FeeStructureUpdateInput = z.infer<typeof feeStructureUpdateSchema>;

export const feeStructureDeleteSchema = z.object({ id: z.string().min(1, "Required") });
export type FeeStructureDeleteInput = z.infer<typeof feeStructureDeleteSchema>;

// Shared filter for the fees screens (undefined = "all").
export interface FeesFilter {
  class_id?: string;
  academic_year_id?: string;
  term?: FeeTerm;
}

// ---- Class Fees ----
export const feeStatus = z.enum(["paid", "partial", "pending"]);
export type FeeStatus = z.infer<typeof feeStatus>;

export const FEE_STATUS_LABEL: Record<FeeStatus, string> = {
  paid: "Paid",
  partial: "Partial",
  pending: "Pending",
};

export const scholarshipType = z.enum(["none", "partial", "full", "bursary"]);
export type ScholarshipType = z.infer<typeof scholarshipType>;

export const SCHOLARSHIP_LABEL: Record<ScholarshipType, string> = {
  none: "No Scholarship",
  partial: "Partial Scholarship",
  full: "Full Scholarship",
  bursary: "Bursary",
};

// A student's fee position for a class (derived balance + status). Backs the Class Fees table.
export const studentFeeVM = z.object({
  id: z.string(),
  student_id: z.string(),
  student_name: z.string(),
  class_name: z.string(),
  // The invoice's scope, carried so the Record Payment dialog can settle THIS invoice rather than
  // guessing the student's full-year one.
  fee_term: feeTerm,
  expected: z.number(),
  discount: z.number(),
  scholarship_type: z.string().nullable(),
  paid: z.number(),
  arrears: z.number(),
  balance: z.number(),
  status: feeStatus,
});
export type StudentFeeVM = z.infer<typeof studentFeeVM>;

export const bulkAssignFeesSchema = z.object({
  class_id: z.string().min(1, "Select a class"),
  amount: amount(),
  term: feeTerm.default("full_year"),
  due_date: z.string().nullable().default(null),
  scholarship_type: scholarshipType.default("none"),
  discount: z.coerce.number().min(0, "0–100").max(100, "0–100").default(0),
});
export type BulkAssignFeesInput = z.infer<typeof bulkAssignFeesSchema>;

export const assignIndividualFeeSchema = bulkAssignFeesSchema
  .omit({ class_id: true })
  .extend({ student_id: z.string().min(1, "Select a student") });
export type AssignIndividualFeeInput = z.infer<typeof assignIndividualFeeSchema>;

// ---- Extra Fees ----
export const extraFeeFrequency = z.enum(["one_time", "termly", "monthly", "annual"]);
export type ExtraFeeFrequency = z.infer<typeof extraFeeFrequency>;

export const EXTRA_FREQUENCY_LABEL: Record<ExtraFeeFrequency, string> = {
  one_time: "One-time",
  termly: "Termly",
  monthly: "Monthly",
  annual: "Annual",
};

export const extraFeeStructureVM = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  amount: z.number(),
  frequency: extraFeeFrequency,
  scope: z.string(), // "All classes" or a class name
});
export type ExtraFeeStructureVM = z.infer<typeof extraFeeStructureVM>;

export const extraFeeAssignmentVM = z.object({
  id: z.string(),
  student_name: z.string(),
  class_name: z.string(),
  fee_name: z.string(),
  amount: z.number(),
  paid: z.number(),
  balance: z.number(),
  status: feeStatus,
});
export type ExtraFeeAssignmentVM = z.infer<typeof extraFeeAssignmentVM>;

export const extraFeeStructureCreateSchema = z.object({
  name: z.string().min(1, "Required"),
  amount: amount(),
  frequency: extraFeeFrequency.default("one_time"),
  description: z.string().nullable().default(null),
});
export type ExtraFeeStructureCreateInput = z.infer<typeof extraFeeStructureCreateSchema>;

// ---- Record Payment ----
export const recordPaymentSchema = z.object({
  student_id: z.string().min(1, "Required"),
  // Which of the student's invoices this payment settles. A student can hold a full-year invoice AND
  // per-term invoices at once, so the scope of the row the admin clicked must travel with the payment
  // — otherwise the action cannot tell them apart. The Class Fees row (StudentFeeVM) already carries
  // `fee_term`; the action re-resolves the invoice under the caller's RLS from student + active year +
  // this scope, so nothing here is trusted beyond the enum. Defaults to full_year for older callers.
  fee_term: feeTerm.default("full_year"),
  amount: amount(),
  method: paymentMethod.default("cash"),
  reference: z.string().nullable().default(null),
  paid_at: z.string().min(1, "Required"),
  fee_label: z.string().nullable().default(null),
});
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
