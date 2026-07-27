"use server";

import { attempt, type ActionResult } from "./result";

import { tenant, assertWrite } from "./_server";
import { assessmentCreateSchema, type AssessmentCreateInput } from "@/lib/validators/assessments";

/**
 * Create an assessment.
 *
 * `created_by` is the caller. RLS (`asm_teacher_write` via `teacher_teaches`) rejects the insert
 * unless the teacher is assigned that subject in that class, so the pairing isn't re-checked here.
 *
 * There is no `is_submitted` to set: submission is a property of the individual results, and an
 * assessment is treated as submitted once it has results and all of them are submitted (see
 * lib/data/assessments.ts). A brand-new assessment therefore reads as not submitted with no column
 * needing to say so.
 */
export async function createAssessment(input: AssessmentCreateInput): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = assessmentCreateSchema.parse(input);
    const ctx = await tenant();

    const row = assertWrite(
      await ctx.db
        .from("assessments")
        .insert({
          class_id: data.class_id,
          subject_id: data.subject_id,
          term_id: data.term_id,
          assessment_type_id: data.assessment_type_id,
          title: data.title,
          max_score: data.max_score,
          date: data.date,
          school_id: ctx.schoolId,
          created_by: ctx.profile.id,
        })
        .select("id")
        .single(),
      "assessment",
    );

    return { id: row.id };
  });
}
