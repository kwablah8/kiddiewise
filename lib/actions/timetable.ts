"use server";

import { attempt, UserFacingError, type ActionResult } from "./result";
import { tenant, assertWrite, assertOk } from "./_server";
import {
  periodCreateSchema,
  periodUpdateSchema,
  periodIdSchema,
  saveClassTimetableSchema,
  type PeriodCreateInput,
  type PeriodUpdateInput,
  type PeriodIdInput,
  type SaveClassTimetableInput,
  type Weekday,
} from "@/lib/validators/timetable";

// periods is admin-write (0041 RLS, periods_admin), same shape as grade_bands/assessment_types:
// defined once, reused everywhere, RLS is what actually stops a non-admin, assertWrite's 42501
// fallback covers the rare direct call that bypasses the UI.

export async function createPeriod(input: PeriodCreateInput): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = periodCreateSchema.parse(input);
    const ctx = await tenant();

    const row = assertWrite(
      await ctx.db
        .from("periods")
        .insert({ ...data, school_id: ctx.schoolId })
        .select("id")
        .single(),
      "period",
      // unique(school_id, ordinal) does the enforcing; this is the readable version of it.
      "A period with that order already exists.",
    );
    return { id: row.id };
  });
}

export async function updatePeriod(input: PeriodUpdateInput): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const { id, ...rest } = periodUpdateSchema.parse(input);
    const ctx = await tenant();

    const row = assertWrite(
      await ctx.db.from("periods").update(rest).eq("id", id).select("id").single(),
      "period",
      "A period with that order already exists.",
    );
    return { id: row.id };
  });
}

/**
 * Delete a period. `timetable_entries.period_id` is ON DELETE CASCADE (migration 0041), so this
 * also clears that slot from every class's timetable, not just admin's own list, the confirm
 * dialog is what warns about that, there is no server-side block.
 */
export async function deletePeriod(input: PeriodIdInput): Promise<ActionResult<{ ok: true }>> {
  return attempt(async () => {
    const { id } = periodIdSchema.parse(input);
    const ctx = await tenant();
    assertOk(await ctx.db.from("periods").delete().eq("id", id), "period");
    return { ok: true };
  });
}

/**
 * Save a class's whole timetable grid in one submit. Whole-grid replace rather than a diff against
 * what's already there: the form always submits every rendered cell, so the submitted set simply
 * IS the class's new timetable, same "one form, one save" the canteen menu settled on.
 */
export async function saveClassTimetable(
  input: SaveClassTimetableInput,
): Promise<ActionResult<{ ok: true }>> {
  return attempt(async () => {
    const data = saveClassTimetableSchema.parse(input);
    const ctx = await tenant();

    const toSave = data.cells.filter(
      (c): c is { day_of_week: Weekday; period_id: string; subject_id: string } => c.subject_id !== null,
    );

    if (toSave.length > 0) {
      // Every subject placed on the grid must already be assigned to this class (class_subjects),
      // so the teacher a parent or teacher sees for it (derived, never stored, see the migration's
      // comment) is never left undefined.
      const { data: assignments } = await ctx.db
        .from("class_subjects")
        .select("subject_id")
        .eq("class_id", data.class_id);
      const assignedSubjectIds = new Set((assignments ?? []).map((a) => a.subject_id));
      if (toSave.some((c) => !assignedSubjectIds.has(c.subject_id))) {
        throw new UserFacingError(
          "One of these subjects isn't assigned to this class yet — add it under Subjects first.",
        );
      }
    }

    assertOk(
      await ctx.db.from("timetable_entries").delete().eq("class_id", data.class_id),
      "timetable",
    );

    if (toSave.length > 0) {
      assertOk(
        await ctx.db.from("timetable_entries").insert(
          toSave.map((c) => ({
            school_id: ctx.schoolId,
            class_id: data.class_id,
            day_of_week: c.day_of_week,
            period_id: c.period_id,
            subject_id: c.subject_id,
            created_by: ctx.profile.id,
          })),
        ),
        "timetable",
      );
    }

    return { ok: true };
  });
}
