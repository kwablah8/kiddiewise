"use server";

import { z } from "zod";
import { attempt, UserFacingError, type ActionResult } from "./result";

import { tenant, assertWrite, assertOk } from "./_server";
import {
  assessmentCreateSchema,
  assessmentUpdateSchema,
  type AssessmentCreateInput,
  type AssessmentUpdateInput,
} from "@/lib/validators/assessments";

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

/**
 * Edit an assessment's descriptive fields. RLS (asm_teacher_update / asm_admin) decides who may;
 * the one app-level rule is that `max_score` freezes once ANY score has been recorded against it —
 * every stored score is a fraction of that total, so changing it would silently re-grade the class.
 */
export async function updateAssessment(
  input: AssessmentUpdateInput,
): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const { id, ...patch } = assessmentUpdateSchema.parse(input);
    const ctx = await tenant();

    if (patch.max_score !== undefined) {
      const { count } = await ctx.db
        .from("results")
        .select("id", { count: "exact", head: true })
        .eq("assessment_id", id);
      if ((count ?? 0) > 0) {
        throw new UserFacingError(
          "Scores have already been entered against this total. The maximum score can't change now — the title, type and date still can.",
        );
      }
    }

    const row = assertWrite(
      await ctx.db.from("assessments").update(patch).eq("id", id).select("id").single(),
      "assessment",
    );
    return { id: row.id };
  });
}

/**
 * Delete an assessment that hasn't entered the record.
 *
 * Submitted results are what parents and terminal reports read — block-if-history applies and the
 * delete is refused. Unsubmitted rows are the teacher's own drafts and cascade away with the
 * assessment (results FK, migration 0008). RLS: teachers may only delete within their own
 * class-subject pairs (asm_teacher_delete, migration 0025).
 */
export async function deleteAssessment(input: { id: string }): Promise<ActionResult<{ ok: true }>> {
  return attempt(async () => {
    const { id } = z.object({ id: z.string().min(1) }).parse(input);
    const ctx = await tenant();

    const { count } = await ctx.db
      .from("results")
      .select("id", { count: "exact", head: true })
      .eq("assessment_id", id)
      .eq("is_submitted", true);
    if ((count ?? 0) > 0) {
      throw new UserFacingError(
        "Scores from this assessment have been submitted — they're part of the record now. It can't be deleted.",
      );
    }

    assertOk(await ctx.db.from("assessments").delete().eq("id", id), "assessment");
    return { ok: true };
  });
}
