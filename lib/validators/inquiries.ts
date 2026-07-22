import { z } from "zod";

// inquiry_status enum (03-DATABASE §3) — mirrors the DB enum exactly.
export const inquiryStatus = z.enum(["new", "reviewing", "accepted", "rejected", "converted"]);
export type InquiryStatus = z.infer<typeof inquiryStatus>;

// Write input for the marketing Admissions/Contact forms (03-DATABASE §8 `admissions_inquiries`,
// 05-USER-FLOWS §10). Mirrors the table's writable columns; `id`/`school_id`/`status`/
// `created_at` are assigned server-side, not collected from the visitor.
export const inquiryCreateSchema = z.object({
  applicant_name: z.string().min(1, "Required"),
  parent_name: z.string().min(1, "Required"),
  parent_email: z.string().email("Enter a valid email"),
  parent_phone: z.string().nullable(),
  desired_class: z.string().nullable(),
  message: z.string().nullable(),
});
export type InquiryCreateInput = z.infer<typeof inquiryCreateSchema>;

// Stored/returned shape — the future Admin → Admissions slice reads this.
export const inquiryVM = inquiryCreateSchema.extend({
  id: z.string(),
  status: inquiryStatus,
  created_at: z.string(),
});
export type InquiryVM = z.infer<typeof inquiryVM>;
