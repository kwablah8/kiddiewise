"use server";

import { attempt, UserFacingError, type ActionResult } from "./result";

import { revalidatePath } from "next/cache";
import { tenant, assertWrite, assertOk, logActivity } from "./_server";
import {
  assignPositions,
  attendanceTotals,
  computeSubjectComponents,
  type ComponentResultInput,
  type SubjectComponents,
} from "@/lib/terminal-reports";
import { scoreToGrade } from "@/lib/grading";
import {
  generateReportsSchema,
  reportCommentsSchema,
  publishReportsSchema,
  type GenerateReportsInput,
  type ReportCommentsInput,
  type PublishReportsInput,
} from "@/lib/validators/reports";
import type { GradeBandVM } from "@/lib/validators/grading";
import type { TablesUpdate } from "@/lib/supabase/types";

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
): Promise<ActionResult<{ generated: number; skipped: number }>> {
  return attempt(async () => {
    const { class_id, term_id } = generateReportsSchema.parse(input);
    const ctx = await tenant();

    const { data: term, error: termError } = await ctx.db
      .from("terms")
      .select("id, academic_year_id")
      .eq("id", term_id)
      .maybeSingle();
    if (termError) throw new Error(`Could not load that term: ${termError.message}`);
    if (!term) throw new UserFacingError("That term no longer exists.");

    const [enrolledRes, bandsRes, existingRes, schoolRes] = await Promise.all([
      ctx.db
        .from("enrollments")
        .select("student_id")
        .eq("class_id", class_id)
        .eq("status", "active")
        // The term's own year, NOT just "active status": promotion appends an enrollment per year
        // and leaves history in place, so an unscoped roster would generate reports for every
        // student the class has ever held.
        .eq("academic_year_id", term.academic_year_id),
      ctx.db.from("grade_bands").select("id, min_score, max_score, grade, remark"),
      ctx.db
        .from("terminal_reports")
        .select(
          "student_id, class_teacher_comment, head_teacher_comment, conduct, attitude, interest, promoted_to, is_published",
        )
        .eq("class_id", class_id)
        .eq("term_id", term_id),
      ctx.db.from("schools").select("ca_weight").eq("id", ctx.schoolId).single(),
    ]);

    if (enrolledRes.error) throw new Error(`Could not load the class: ${enrolledRes.error.message}`);
    const studentIds = (enrolledRes.data ?? []).map((e) => e.student_id);
    if (studentIds.length === 0) {
      throw new UserFacingError("This class has no active enrolments, so there are no reports to generate.");
    }

    const bands: GradeBandVM[] = (bandsRes.data ?? []).map((b) => ({
      ...b,
      min_score: Number(b.min_score),
      max_score: Number(b.max_score),
    }));
    const existing = new Map((existingRes.data ?? []).map((r) => [r.student_id, r]));
    const caWeight = Number(schoolRes.data?.ca_weight ?? 50);

    const [resultsRes, attendanceRes] = await Promise.all([
      ctx.db
        .from("results")
        .select(
          "student_id, score, assessments!inner(max_score, term_id, subjects(name), assessment_types(is_exam))",
        )
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

    // Per student: the GES split per subject, then overall totals from the subject totals.
    const draft = studentIds.map((studentId) => {
      const componentInputs: ComponentResultInput[] = allResults
        .filter((r) => r.student_id === studentId && r.assessments?.term_id === term_id)
        .map((r) => ({
          subject: r.assessments?.subjects?.name ?? null,
          score: Number(r.score),
          max_score: Number(r.assessments?.max_score ?? 0),
          is_exam: r.assessments?.assessment_types?.is_exam ?? false,
        }));
      const subjects = computeSubjectComponents(componentInputs, caWeight);
      const totals = subjects.map((s) => s.total).filter((t): t is number => t !== null);
      const attendance = attendanceTotals(allAttendance.filter((a) => a.student_id === studentId));

      return {
        student_id: studentId,
        subjects,
        subject_count: totals.length,
        total_score: totals.length === 0 ? null : Math.round(totals.reduce((a, b) => a + b, 0)),
        average_score:
          totals.length === 0
            ? null
            : Math.round(totals.reduce((a, b) => a + b, 0) / totals.length),
        ...attendance,
      };
    });

    // Positions computed across the whole class at once — a rank is meaningless per student.
    // Overall position ranks the averages; each SUBJECT is ranked separately over its totals.
    const positioned = assignPositions(draft);
    const subjectPosition = new Map<string, number | null>();
    const subjectNames = [...new Set(draft.flatMap((d) => d.subjects.map((s) => s.subject_name)))];
    for (const name of subjectNames) {
      const ranked = assignPositions(
        draft.map((d) => ({
          student_id: d.student_id,
          average_score: d.subjects.find((s) => s.subject_name === name)?.total ?? null,
        })),
      );
      for (const r of ranked) subjectPosition.set(`${r.student_id}:${name}`, r.position);
    }

    // Published reports are refreshed like the rest (comments and figures preserved/recomputed the
    // same way), but their SUBJECT rows are also rewritten — figures and rows must never disagree.
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
        enrolled_count: studentIds.length,
        // Preserved, never recomputed — a human's words are not arithmetic.
        class_teacher_comment: prior?.class_teacher_comment ?? null,
        head_teacher_comment: prior?.head_teacher_comment ?? null,
        conduct: prior?.conduct ?? null,
        attitude: prior?.attitude ?? null,
        interest: prior?.interest ?? null,
        promoted_to: prior?.promoted_to ?? null,
        is_published: prior?.is_published ?? false,
        generated_at: new Date().toISOString(),
      };
    });

    const saved = assertWrite(
      // unique(student_id, term_id) from 0009 — regenerating updates in place.
      await ctx.db
        .from("terminal_reports")
        .upsert(rows, { onConflict: "student_id,term_id" })
        .select("id, student_id"),
      "terminal reports",
    );

    // Snapshot the subject rows: replace wholesale so subjects dropped from the class disappear.
    const reportIdByStudent = new Map(saved.map((s) => [s.student_id, s.id]));
    const subjectRows = positioned.flatMap((r) =>
      r.subjects.map((s: SubjectComponents) => ({
        school_id: ctx.schoolId,
        report_id: reportIdByStudent.get(r.student_id)!,
        student_id: r.student_id,
        subject_name: s.subject_name,
        class_score: s.class_score,
        exam_score: s.exam_score,
        total: s.total,
        position: subjectPosition.get(`${r.student_id}:${s.subject_name}`) ?? null,
        remark: s.total === null ? null : (scoreToGrade(s.total, 100, bands)?.remark ?? null),
      })),
    );
    assertOk(
      await ctx.db
        .from("terminal_report_subjects")
        .delete()
        .in("report_id", [...reportIdByStudent.values()]),
      "report subjects",
    );
    if (subjectRows.length > 0) {
      assertOk(await ctx.db.from("terminal_report_subjects").insert(subjectRows), "report subjects");
    }

    revalidatePath("/terminal-reports");

    // A student with no submitted marks still gets a report row (attendance is on it), but flagging the
    // count tells the admin their class isn't fully marked yet.
    return {
      generated: rows.length,
      skipped: rows.filter((r) => r.average_score === null).length,
    };
  });
}

/**
 * Save the human-written card fields for one report: the two remarks plus conduct, attitude,
 * interest and promoted-to. Only the keys the caller sent are written (omitted = untouched,
 * empty string = cleared) — the teacher dialog and the admin dialog send different subsets and
 * neither may wipe the other's fields. RLS decides who may write: admin anywhere,
 * the class teacher on their own class (tr_class_teacher_update, migration 0028).
 */
export async function setReportComments(input: ReportCommentsInput): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const { id, ...fields } = reportCommentsSchema.parse(input);
    const ctx = await tenant();

    const patch: TablesUpdate<"terminal_reports"> = {};
    if (fields.class_teacher_comment !== undefined) patch.class_teacher_comment = fields.class_teacher_comment;
    if (fields.head_teacher_comment !== undefined) patch.head_teacher_comment = fields.head_teacher_comment;
    if (fields.conduct !== undefined) patch.conduct = fields.conduct;
    if (fields.attitude !== undefined) patch.attitude = fields.attitude;
    if (fields.interest !== undefined) patch.interest = fields.interest;
    if (fields.promoted_to !== undefined) patch.promoted_to = fields.promoted_to;

    const row = assertWrite(
      await ctx.db.from("terminal_reports").update(patch).eq("id", id).select("id").single(),
      "report comments",
    );

    revalidatePath("/terminal-reports");
    return { id: row.id };
  });
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
): Promise<ActionResult<{ affected: number; published: boolean }>> {
  return attempt(async () => {
    const { class_id, term_id, published } = publishReportsSchema.parse(input);
    const ctx = await tenant();

    const { data, error } = await ctx.db
      .from("terminal_reports")
      .update({ is_published: published })
      .eq("class_id", class_id)
      .eq("term_id", term_id)
      .select("id");

    if (error) throw new Error(`Could not ${published ? "publish" : "retract"} these reports: ${error.message}`);

    // Publication is the feed-worthy moment — it's when parents can suddenly see the reports.
    if (published && (data?.length ?? 0) > 0) {
      const { data: klass } = await ctx.db.from("classes").select("name").eq("id", class_id).maybeSingle();
      await logActivity(ctx, `published terminal reports for ${klass?.name ?? "a class"}`, "terminal_report");
    }

    revalidatePath("/terminal-reports");
    return { affected: data?.length ?? 0, published };
  });
}
