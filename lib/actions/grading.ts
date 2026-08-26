"use server";

import { attempt, type ActionResult } from "./result";

import { tenant, assertWrite, assertOk } from "./_server";
import { z } from "zod";
import {
  gradeBandCreateSchema,
  gradeBandUpdateSchema,
  assessmentTypeCreateSchema,
  assessmentTypeUpdateSchema,
  type GradeBandCreateInput,
  type GradeBandUpdateInput,
  type AssessmentTypeCreateInput,
  type AssessmentTypeUpdateInput,
} from "@/lib/validators/grading";

// grade_bands and assessment_types are admin-write (0008 RLS). Editing the grading scale re-grades
// every result view at once, because grades are derived at read time rather than stored, see
// lib/results.ts. That is the point of the scale being editable at all.

const idSchema = z.object({ id: z.string().min(1) });

export async function createGradeBand(input: GradeBandCreateInput): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = gradeBandCreateSchema.parse(input);
    const ctx = await tenant();

    const row = assertWrite(
      await ctx.db
        .from("grade_bands")
        .insert({ ...data, school_id: ctx.schoolId })
        .select("id")
        .single(),
      "grade band",
    );
    return { id: row.id };
  });
}

export async function updateGradeBand(input: GradeBandUpdateInput): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const { id, ...rest } = gradeBandUpdateSchema.parse(input);
    const ctx = await tenant();

    const row = assertWrite(
      await ctx.db.from("grade_bands").update(rest).eq("id", id).select("id").single(),
      "grade band",
    );
    return { id: row.id };
  });
}

export async function deleteGradeBand(input: { id: string }): Promise<ActionResult<{ ok: true }>> {
  return attempt(async () => {
    const { id } = idSchema.parse(input);
    const ctx = await tenant();
    assertOk(await ctx.db.from("grade_bands").delete().eq("id", id), "grade band");
    return { ok: true };
  });
}

export async function createAssessmentType(
  input: AssessmentTypeCreateInput,
): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = assessmentTypeCreateSchema.parse(input);
    const ctx = await tenant();

    const row = assertWrite(
      await ctx.db
        .from("assessment_types")
        .insert({ ...data, school_id: ctx.schoolId })
        .select("id")
        .single(),
      "assessment type",
      // unique(school_id, name) does the enforcing; this is the readable version of it.
      "An assessment type with this name already exists.",
    );
    return { id: row.id };
  });
}

export async function updateAssessmentType(
  input: AssessmentTypeUpdateInput,
): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const { id, ...rest } = assessmentTypeUpdateSchema.parse(input);
    const ctx = await tenant();

    const row = assertWrite(
      await ctx.db.from("assessment_types").update(rest).eq("id", id).select("id").single(),
      "assessment type",
      "An assessment type with this name already exists.",
    );
    return { id: row.id };
  });
}

/**
 * Delete an assessment type.
 *
 * `assessments.assessment_type_id` is ON DELETE RESTRICT, so the database refuses this while any
 * assessment still references the type. `assertWrite`'s generic 23503 message describes a dangling
 * reference, which is the wrong way round here, the row being deleted is the one being referenced,
 * so the message is supplied explicitly.
 */
export async function deleteAssessmentType(input: { id: string }): Promise<ActionResult<{ ok: true }>> {
  return attempt(async () => {
    const { id } = idSchema.parse(input);
    const ctx = await tenant();
    assertOk(
      await ctx.db.from("assessment_types").delete().eq("id", id),
      "assessment type",
      "This type is used by existing assessments and can't be deleted.",
    );
    return { ok: true };
  });
}
