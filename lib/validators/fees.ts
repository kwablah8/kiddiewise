import { z } from "zod";

// A fee applies to a whole year or a single term (mirrors the reference's Full Year / term split).
export const feeTerm = z.enum(["full_year", "first", "second", "third"]);
export type FeeTerm = z.infer<typeof feeTerm>;

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
  amount: z.coerce.number().positive("Enter an amount"),
  due_date: z.string().nullable().default(null),
  late_fee: z.coerce.number().nonnegative().nullable().default(null),
  description: z.string().nullable().default(null),
  is_mandatory: z.boolean().default(true),
});
export type FeeStructureCreateInput = z.infer<typeof feeStructureCreateSchema>;

// Shared filter for the fees screens (undefined = "all").
export interface FeesFilter {
  class_id?: string;
  academic_year_id?: string;
  term?: FeeTerm;
}
