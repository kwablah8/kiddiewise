import { z } from "zod";

// inquiry_status enum (03-DATABASE §3), mirrors the DB enum exactly.
export const inquiryStatus = z.enum(["new", "reviewing", "accepted", "rejected", "converted"]);
export type InquiryStatus = z.infer<typeof inquiryStatus>;

// Write input for the marketing Admissions/Contact forms (03-DATABASE §8 `admissions_inquiries`,
// 05-USER-FLOWS §10). Mirrors the table's writable columns; `id`/`school_id`/`status`/
// `created_at` are assigned server-side, not collected from the visitor.
// This is the one write an unauthenticated visitor can make (inq_anon_insert), so every field is
// length-capped: without a ceiling, anyone on the internet could POST multi-megabyte strings straight
// into the table, storage abuse and a denial-of-service on the admin's admissions inbox. Names and
// class are short; the free-text message is generous but bounded. `.trim()` keeps whitespace-only
// values from passing `.min(1)`.
export const inquiryCreateSchema = z.object({
  applicant_name: z.string().trim().min(1, "Required").max(120, "Keep this under 120 characters"),
  parent_name: z.string().trim().min(1, "Required").max(120, "Keep this under 120 characters"),
  parent_email: z.string().trim().email("Enter a valid email").max(200, "That email is too long"),
  parent_phone: z.string().trim().max(40, "That phone number is too long").nullable(),
  desired_class: z.string().trim().max(80, "Keep this under 80 characters").nullable(),
  message: z.string().trim().max(2000, "Keep your message under 2000 characters").nullable(),
});
export type InquiryCreateInput = z.infer<typeof inquiryCreateSchema>;

// Stored/returned shape, the future Admin → Admissions slice reads this.
export const inquiryVM = inquiryCreateSchema.extend({
  id: z.string(),
  status: inquiryStatus,
  created_at: z.string(),
});
export type InquiryVM = z.infer<typeof inquiryVM>;

// Admin status-change input (Admin → Admissions). `status` is the target; the transition guard
// (lib/inquiries.ts#canTransitionInquiry) decides whether it's legal from the current status.
export const inquiryStatusUpdateSchema = z.object({
  id: z.string(),
  status: inquiryStatus,
});
export type InquiryStatusUpdateInput = z.infer<typeof inquiryStatusUpdateSchema>;
