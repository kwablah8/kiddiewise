"use server";

import { attempt, UserFacingError, type ActionResult } from "./result";

import { revalidatePath } from "next/cache";
import { tenant, activeContext, assertOk, logActivity } from "./_server";
import { saveAttendanceSchema, type SaveAttendanceInput } from "@/lib/validators/attendance";

/**
 * Mark or amend a class register for one date.
 *
 * `marked_by` is the caller, never a value from the request. RLS (`att_teacher_write` via
 * `teacher_teaches_class`) rejects the whole statement if the teacher isn't assigned to the class, so
 * no ownership check is repeated here — doing so would imply the client was what enforced it.
 *
 * Upserted on (student_id, date) — the unique constraint from 0007 — so re-marking a register
 * corrects the existing rows rather than creating duplicates. That is what makes the register
 * editable, which teachers do routinely when a late arrival turns up.
 */
export async function saveAttendance(
  input: SaveAttendanceInput,
): Promise<ActionResult<{ ok: true; count: number }>> {
  return attempt(async () => {
    const { class_id, date, entries } = saveAttendanceSchema.parse(input);
    const ctx = await tenant();
    const { termId } = await activeContext(ctx);

    if (!termId) {
      throw new UserFacingError("Set an active term before taking attendance.");
    }

    const rows = entries.map((e) => ({
      school_id: ctx.schoolId,
      student_id: e.student_id,
      class_id,
      term_id: termId,
      date,
      status: e.status,
      marked_by: ctx.profile.id,
      updated_at: new Date().toISOString(),
    }));

    assertOk(
      await ctx.db.from("attendance").upsert(rows, { onConflict: "student_id,date" }),
      "attendance",
    );

    const { data: klass } = await ctx.db.from("classes").select("name").eq("id", class_id).maybeSingle();
    await logActivity(ctx, `marked attendance for ${klass?.name ?? "a class"}`, "attendance");

    // The same rows back the parent portal and the admin dashboard; revalidate so a server-rendered
    // view doesn't keep serving yesterday's numbers.
    revalidatePath("/teacher/attendance");

    return { ok: true, count: rows.length };
  });
}
