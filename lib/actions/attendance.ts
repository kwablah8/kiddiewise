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
 * no ownership check is repeated here, doing so would imply the client was what enforced it.
 *
 * Upserted on (student_id, date), the unique constraint from 0007, so re-marking a register
 * corrects the existing rows rather than creating duplicates. That is what makes the register
 * editable, which teachers do routinely when a late arrival turns up.
 */
export async function saveAttendance(
  input: SaveAttendanceInput,
): Promise<ActionResult<{ ok: true; count: number }>> {
  return attempt(async () => {
    const { class_id, date, entries } = saveAttendanceSchema.parse(input);
    const ctx = await tenant();
    const { academicYearId, termId } = await activeContext(ctx);

    if (!termId) {
      throw new UserFacingError("Set an active term before taking attendance.");
    }

    // RLS (att_teacher_write / teacher_teaches_class) proves the caller owns the CLASS, but not that
    // the student_ids in the payload actually belong to it. Without this check a teacher could send
    // another class's student_id and, because the register is upserted on (student_id, date), silently
    // OVERWRITE that student's real register for the day, attributed to a class they aren't in. Confirm
    // every entry is an active enrolment of this class (in the active year) before writing.
    const studentIds = entries.map((e) => e.student_id);
    let roster = ctx.db
      .from("enrollments")
      .select("student_id")
      .eq("class_id", class_id)
      .eq("status", "active")
      .in("student_id", studentIds);
    if (academicYearId) roster = roster.eq("academic_year_id", academicYearId);
    const { data: enrolled, error: rosterError } = await roster;
    if (rosterError) throw new Error(`Could not verify the class roster: ${rosterError.message}`);
    const allowed = new Set((enrolled ?? []).map((e) => e.student_id));
    if (studentIds.some((id) => !allowed.has(id))) {
      throw new UserFacingError("Some of those students aren't in this class.");
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
