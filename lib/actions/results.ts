"use server";

import { attempt, UserFacingError, type ActionResult } from "./result";

import { revalidatePath } from "next/cache";
import { tenant, assertOk, logActivity } from "./_server";
import { saveResultsSchema, type SaveResultsInput } from "@/lib/validators/assessments";

/**
 * Record marks for an assessment.
 *
 * `entered_by` is the caller, never client input. RLS (`res_teacher_rw` via
 * `teacher_teaches(class_id, subject_id)`) rejects the write unless this teacher takes that subject in
 * that class — so the assessment→teacher relationship isn't re-checked here.
 *
 * `grade` and `remark` are deliberately NOT written. Every screen derives them from the school's
 * current bands at read time (lib/results.ts), so storing them would be a second copy that goes stale
 * the moment the grading scale is edited — exactly what golden rule 9 forbids. The upside is real:
 * correcting a band re-grades every existing mark at once instead of needing a backfill.
 */
export async function saveResults(
  input: SaveResultsInput,
): Promise<ActionResult<{ saved: number; skipped: number; submitted: boolean }>> {
  return attempt(async () => {
    const { assessment_id, submit, entries } = saveResultsSchema.parse(input);
    const ctx = await tenant();

    // The ceiling is a property of the assessment, so it cannot live in the Zod schema. Checked here,
    // server-side, which means it holds even for a request that never went through the form.
    const { data: assessment, error } = await ctx.db
      .from("assessments")
      .select("max_score, title, classes(name)")
      .eq("id", assessment_id)
      .maybeSingle();

    if (error) throw new Error(`Could not load that assessment: ${error.message}`);
    if (!assessment) throw new UserFacingError("That assessment no longer exists.");

    const max = Number(assessment.max_score);
    const overMax = entries.filter((e) => e.score !== null && e.score > max);
    if (overMax.length > 0) {
      throw new UserFacingError(
        `${overMax.length === 1 ? "A score is" : `${overMax.length} scores are`} above the maximum of ${max}.`,
      );
    }

    // A blank score means "not marked yet" — for a student who was absent, or a sheet the teacher is
    // filling in over several sittings. No row is written, so the sheet keeps showing them as unmarked
    // rather than recording a zero they didn't earn.
    const marked = entries.filter((e) => e.score !== null);
    const skipped = entries.length - marked.length;

    if (marked.length === 0) {
      return { saved: 0, skipped, submitted: false };
    }

    const now = new Date().toISOString();
    assertOk(
      await ctx.db.from("results").upsert(
        marked.map((e) => ({
          school_id: ctx.schoolId,
          assessment_id,
          student_id: e.student_id,
          score: e.score!,
          // Explicitly nulled, not merely omitted. An upsert leaves untouched columns as they were, so
          // a row previously carrying grade 'D' for a score of 53 would keep saying 'D' after the score
          // is corrected to 91 — a row contradicting itself. Every screen derives the grade from the
          // current bands, so the only correct stored value is none.
          grade: null,
          remark: null,
          teacher_comment: e.teacher_comment,
          entered_by: ctx.profile.id,
          is_submitted: submit,
          updated_at: now,
        })),
        // The unique constraint from 0008. Re-saving corrects the existing mark instead of duplicating
        // it, which is what makes a mark sheet editable — teachers routinely fix a transcription slip.
        { onConflict: "assessment_id,student_id" },
      ),
      "results",
    );

    // Only submission is feed-worthy — draft saves happen every few minutes while a sheet is
    // being filled and would drown the dashboard.
    if (submit) {
      await logActivity(
        ctx,
        `submitted ${assessment.title} results${assessment.classes ? ` for ${assessment.classes.name}` : ""}`,
        "result",
        assessment_id,
      );
    }

    // These marks feed the admin's assessment view, the student's academic record and the parent
    // portal, so a server-rendered view must not keep serving the pre-save numbers.
    revalidatePath("/teacher/grade");
    revalidatePath(`/teacher/assessment/${assessment_id}`);

    return { saved: marked.length, skipped, submitted: submit };
  });
}
