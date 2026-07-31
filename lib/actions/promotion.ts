"use server";

import { attempt, UserFacingError, type ActionResult } from "./result";

import { tenant, assertOk, logActivity } from "./_server";
import { summarizeDecisions } from "@/lib/promotion";
import {
  promoteStudentsSchema,
  type PromoteStudentsInput,
  type PromotionResultVM,
} from "@/lib/validators/promotion";

/**
 * End-of-year promotion for one class.
 *
 * Writes NEW enrollments for the target year and leaves every existing row alone. That is the whole
 * design (docs/05-USER-FLOWS.md §7): a student's class is an enrollment, not a column, so last
 * year's placement stays true and last year's reports keep resolving to the class the child was
 * actually in. Rewriting the old row instead would quietly rewrite history — a Basic 3 report card
 * would start claiming the child was in Basic 4.
 *
 * Idempotent. The upsert targets `unique(student_id, academic_year_id)` from migration 0006, so
 * re-running after a mistake CORRECTS the placement rather than duplicating it. That matters
 * because running it again is the first thing anyone does when they realise they picked the wrong
 * destination class.
 */
export async function promoteStudents(
  input: PromoteStudentsInput,
): Promise<ActionResult<PromotionResultVM>> {
  return attempt(async () => {
    const data = promoteStudentsSchema.parse(input);
    const ctx = await tenant();

    if (data.target_year_id === data.source_year_id) {
      throw new UserFacingError(
        "Promotion moves students into a different academic year. Choose the year they are moving into.",
      );
    }

    const promoting = data.decisions.filter((d) => d.decision === "promote");
    const repeating = data.decisions.filter((d) => d.decision === "repeat");
    const graduating = data.decisions.filter((d) => d.decision === "graduate");

    // Promoted and repeating students differ only in which class they land in, so they are one
    // upsert. Both are `active` in the new year.
    const newEnrollments = [
      ...promoting.map((d) => ({
        school_id: ctx.schoolId,
        student_id: d.student_id,
        class_id: data.target_class_id,
        academic_year_id: data.target_year_id,
        status: "active" as const,
      })),
      ...repeating.map((d) => ({
        school_id: ctx.schoolId,
        student_id: d.student_id,
        // Same class as this year — that is what repeating means.
        class_id: data.source_class_id,
        academic_year_id: data.target_year_id,
        status: "active" as const,
      })),
    ];

    if (newEnrollments.length > 0) {
      assertOk(
        await ctx.db
          .from("enrollments")
          .upsert(newEnrollments, { onConflict: "student_id,academic_year_id" }),
        "enrollment",
      );
    }

    // Graduating writes no new enrollment — there is no next class. It closes off the CURRENT
    // year's row instead, which is the one place promotion does change an existing record, and only
    // its outcome, never its placement.
    if (graduating.length > 0) {
      assertOk(
        await ctx.db
          .from("enrollments")
          .update({ status: "graduated" })
          .eq("academic_year_id", data.source_year_id)
          .eq("class_id", data.source_class_id)
          .in(
            "student_id",
            graduating.map((d) => d.student_id),
          ),
        "enrollment",
      );
    }

    const n = data.decisions.length;
    await logActivity(ctx, `recorded promotion decisions for ${n} student${n === 1 ? "" : "s"}`, "promotion");

    // Counted by the same function the confirmation dialog used, so what the admin was promised and
    // what they are told happened cannot disagree.
    return summarizeDecisions(data.decisions);
  });
}
