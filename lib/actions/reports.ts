"use server";

import { revalidatePath } from "next/cache";
import { tenant, assertWrite, assertOk } from "./_server";
import { aggregateSubjectResults } from "@/lib/results";
import { reportTotals, assignPositions, attendanceTotals } from "@/lib/terminal-reports";
import {
  generateReportsSchema,
  reportCommentsSchema,
  publishReportsSchema,
  type GenerateReportsInput,
  type ReportCommentsInput,
  type PublishReportsInput,
} from "@/lib/validators/reports";
import type { GradeBandVM } from "@/lib/validators/grading";

/**
 * Generate (or regenerate) terminal reports for a class and term.
 *
 * Safe to run repeatedly, and deliberately NOT the same act as publishing: generating produces
 * unpublished snapshots an admin reviews first. That separation is what makes it safe to regenerate
 * after a teacher corrects a mark.
 *
 * Two things are carefully PRESERVED across a regeneration:
 *   - the comments, which are a human's words and must never be overwritten by arithmetic;
 *   - `is_published`, so regenerating an already-published set does not silently retract it from
 *     parents who have read it.
 * A blind upsert would destroy both, because PostgREST replaces the whole row.
 */
export async function generateReports(
  input: GenerateReportsInput,
): Promise<{ generated: number; skipped: number }> {
  const { class_id, term_id } = generateReportsSchema.parse(input);
  const ctx = await tenant();

  const { data: term, error: termError } = await ctx.db
    .from("terms")
    .select("id, academic_year_id")
    .eq("id", term_id)
    .maybeSingle();
  if (termError) throw new Error(`Could not load that term: ${termError.message}`);
  if (!term) throw new Error("That term no longer exists.");

  const [enrolledRes, bandsRes, existingRes] = await Promise.all([
    ctx.db
      .from("enrollments")
      .select("student_id")
      .eq("class_id", class_id)
      .eq("status", "active"),
    ctx.db.from("grade_bands").select("id, min_score, max_score, grade, remark"),
    ctx.db
      .from("terminal_reports")
      .select("student_id, class_teacher_comment, head_teacher_comment, is_published")
      .eq("class_id", class_id)
      .eq("term_id", term_id),
  ]);

  if (enrolledRes.error) throw new Error(`Could not load the class: ${enrolledRes.error.message}`);
  const studentIds = (enrolledRes.data ?? []).map((e) => e.student_id);
  if (studentIds.length === 0) {
    throw new Error("This class has no active enrolments, so there are no reports to generate.");
  }

  const bands: GradeBandVM[] = (bandsRes.data ?? []).map((b) => ({
    ...b,
    min_score: Number(b.min_score),
    max_score: Number(b.max_score),
  }));
  const existing = new Map((existingRes.data ?? []).map((r) => [r.student_id, r]));

  const [resultsRes, attendanceRes] = await Promise.all([
    ctx.db
      .from("results")
      .select("student_id, score, teacher_comment, created_at, assessments!inner(max_score, term_id, subjects(name))")
      // Only submitted marks reach a report — a teacher's draft must never become an official record.
      .eq("is_submitted", true)
      .in("student_id", studentIds),
    ctx.db
      .from("attendance")
      .select("student_id, status")
      .eq("term_id", term_id)
      .in("student_id", studentIds),
  ]);

  const allResults = resultsRes.data ?? [];
  const allAttendance = attendanceRes.data ?? [];

  const draft = studentIds.map((studentId) => {
    const subjects = aggregateSubjectResults(
      allResults
        .filter((r) => r.student_id === studentId && r.assessments?.term_id === term_id)
        .map((r) => ({
          subject: r.assessments?.subjects?.name ?? null,
          score: Number(r.score),
          max_score: Number(r.assessments?.max_score ?? 0),
          teacher_comment: r.teacher_comment,
          recorded_at: r.created_at,
        })),
      bands,
    );
    const totals = reportTotals(subjects);
    const attendance = attendanceTotals(allAttendance.filter((a) => a.student_id === studentId));

    return { student_id: studentId, ...totals, ...attendance };
  });

  // Positions computed across the whole class at once — a rank is meaningless per student.
  const positioned = assignPositions(draft);

  const rows = positioned.map((r) => {
    const prior = existing.get(r.student_id);
    return {
      school_id: ctx.schoolId,
      student_id: r.student_id,
      class_id,
      term_id,
      academic_year_id: term.academic_year_id,
      total_score: r.total_score,
      average_score: r.average_score,
      position: r.position,
      attendance_present: r.present,
      attendance_total: r.total,
      // Preserved, never recomputed — see the note above.
      class_teacher_comment: prior?.class_teacher_comment ?? null,
      head_teacher_comment: prior?.head_teacher_comment ?? null,
      is_published: prior?.is_published ?? false,
      generated_at: new Date().toISOString(),
    };
  });

  assertOk(
    // unique(student_id, term_id) from 0009 — regenerating updates in place.
    await ctx.db.from("terminal_reports").upsert(rows, { onConflict: "student_id,term_id" }),
    "terminal reports",
  );

  revalidatePath("/terminal-reports");

  // A student with no submitted marks still gets a report row (attendance is on it), but flagging the
  // count tells the admin their class isn't fully marked yet.
  return {
    generated: rows.length,
    skipped: rows.filter((r) => r.average_score === null).length,
  };
}

/** Save the class teacher's and head teacher's remarks for one report. */
export async function setReportComments(input: ReportCommentsInput): Promise<{ id: string }> {
  const { id, class_teacher_comment, head_teacher_comment } = reportCommentsSchema.parse(input);
  const ctx = await tenant();

  const row = assertWrite(
    await ctx.db
      .from("terminal_reports")
      .update({ class_teacher_comment, head_teacher_comment })
      .eq("id", id)
      .select("id")
      .single(),
    "report comments",
  );

  revalidatePath("/terminal-reports");
  return { id: row.id };
}

/**
 * Publish or retract a whole class's reports for a term.
 *
 * Class-wide rather than per report on purpose: parents compare notes, so releasing one child's report
 * and not another's within the same class creates exactly the phone calls a school does not want.
 * Publishing is what makes a report visible to parents (`tr_parent_read` gates on `is_published`).
 */
export async function setReportsPublished(
  input: PublishReportsInput,
): Promise<{ affected: number; published: boolean }> {
  const { class_id, term_id, published } = publishReportsSchema.parse(input);
  const ctx = await tenant();

  const { data, error } = await ctx.db
    .from("terminal_reports")
    .update({ is_published: published })
    .eq("class_id", class_id)
    .eq("term_id", term_id)
    .select("id");

  if (error) throw new Error(`Could not ${published ? "publish" : "retract"} these reports: ${error.message}`);

  revalidatePath("/terminal-reports");
  return { affected: data?.length ?? 0, published };
}
