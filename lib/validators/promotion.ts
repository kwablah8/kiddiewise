import { z } from "zod";

/**
 * End-of-year promotion.
 *
 * The four decisions an admin can make about a student, and the shape of the review table they make
 * them in. See `docs/05-USER-FLOWS.md` §7 — the rule that matters is that promotion never rewrites
 * where a child WAS, it only records where they go next.
 */

export const promotionDecision = z.enum(["promote", "repeat", "graduate", "skip"]);
export type PromotionDecision = z.infer<typeof promotionDecision>;

export const PROMOTION_DECISION_LABEL: Record<PromotionDecision, string> = {
  promote: "Promote",
  repeat: "Repeat",
  graduate: "Graduate",
  skip: "Leave for now",
};

/**
 * One student on the review table, with the three figures a head teacher actually decides on.
 *
 * All three are DERIVED at read time, never stored (golden rule 9): the year average from published
 * terminal reports, attendance from the attendance table, the balance from the fee-position view. A
 * stored copy would be a second version of a number the rest of the app already computes, and it
 * would be wrong the moment a late payment or a corrected mark lands.
 */
export const promotionCandidateVM = z.object({
  student_id: z.string(),
  student_name: z.string(),
  admission_no: z.string(),
  /** Mean of the year's published report averages. Null when nothing has been published yet. */
  year_average: z.number().nullable(),
  /** Percent present across the year. Null when no attendance has been marked. */
  attendance_rate: z.number().nullable(),
  /** Unpaid fees for the year, in GHS. Zero when the family is settled. */
  outstanding: z.number(),
});
export type PromotionCandidateVM = z.infer<typeof promotionCandidateVM>;

export const promoteStudentsSchema = z.object({
  source_class_id: z.string().min(1),
  source_year_id: z.string().min(1),
  target_year_id: z.string().min(1),
  /**
   * Where promoted students land. Required even when every decision is repeat or graduate —
   * the form always has a destination selected, and validating it here means the action never has
   * to guess what an absent value meant.
   */
  target_class_id: z.string().min(1),
  decisions: z
    .array(z.object({ student_id: z.string().min(1), decision: promotionDecision }))
    .min(1, "Choose what happens to at least one student."),
});
export type PromoteStudentsInput = z.infer<typeof promoteStudentsSchema>;

export const promotionResultVM = z.object({
  promoted: z.number(),
  repeated: z.number(),
  graduated: z.number(),
  skipped: z.number(),
});
export type PromotionResultVM = z.infer<typeof promotionResultVM>;
