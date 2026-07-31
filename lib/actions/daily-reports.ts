"use server";

import { attempt, type ActionResult } from "./result";
import { tenant, assertOk } from "./_server";
import {
  parentDailyReportSchema,
  teacherDailyReportSchema,
  type ParentDailyReportInput,
  type TeacherDailyReportInput,
} from "@/lib/validators/daily-reports";

/**
 * Both saves are idempotent upserts on `unique(student_id, date)`: a daily report is corrected
 * and re-saved through the day, never duplicated. Who may write which table is entirely RLS's
 * decision (migration 0026): parents reach only their own children's parent rows, teachers only
 * the teacher rows of students in classes they teach — so neither action re-checks the
 * relationship, and an out-of-scope write fails at the database, not in trusting app code.
 */

export async function saveParentDailyReport(
  input: ParentDailyReportInput,
): Promise<ActionResult<{ ok: true }>> {
  return attempt(async () => {
    const data = parentDailyReportSchema.parse(input);
    const ctx = await tenant();

    assertOk(
      await ctx.db.from("daily_reports_parent").upsert(
        {
          ...data,
          school_id: ctx.schoolId,
          created_by: ctx.profile.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_id,date" },
      ),
      "daily report",
    );
    return { ok: true };
  });
}

export async function saveTeacherDailyReport(
  input: TeacherDailyReportInput,
): Promise<ActionResult<{ ok: true }>> {
  return attempt(async () => {
    const data = teacherDailyReportSchema.parse(input);
    const ctx = await tenant();

    assertOk(
      await ctx.db.from("daily_reports_teacher").upsert(
        {
          ...data,
          school_id: ctx.schoolId,
          created_by: ctx.profile.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_id,date" },
      ),
      "daily report",
    );
    return { ok: true };
  });
}
