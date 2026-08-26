"use server";

import { attempt, UserFacingError, type ActionResult } from "./result";

import { revalidatePath } from "next/cache";
import { tenant, assertWrite, assertOk, logActivity } from "./_server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  assignPositions,
  attendanceTotals,
  computeSubjectComponents,
  countPasses,
  round1,
  spreadStats,
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
 * Read every row a filtered query matches, not just PostgREST's first page.
 *
 * PostgREST caps a response at a server-side maximum (1000 rows by default) and returns a short page
 * with no error when there are more. For most screens that is a paginated table and fine. Here it is a
 * silent-corruption trap: these figures are FROZEN into official, printed report cards, and a class of
 * 40 with a few years of history has far more than 1000 result rows, and one term of attendance for
 * that class (≈40 × 60 school days) already exceeds it. A truncated read would freeze wrong totals,
 * class averages and positions with nothing on screen to say so. So page until a short read.
 */
async function fetchAllPaged<T>(
  makeQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000,
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await makeQuery(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < pageSize) return all;
  }
}

/**
 * Generate (or regenerate) terminal reports for a class and term.
 *
 * Safe to run repeatedly, and deliberately not the same act as publishing: generating produces
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

    // Who may compile this class's reports: an admin, or the class's own homeroom teacher (the write
    // policies tr_class_teacher_write / trs_class_teacher_all mirror exactly this). We check it here
    // because the marks below are read with the SERVICE ROLE, and this is the authorization that
    // replaces the RLS those reads bypass.
    const { data: klass } = await ctx.db
      .from("classes")
      .select("class_teacher_id, level")
      .eq("id", class_id)
      .maybeSingle();
    if (!klass) throw new UserFacingError("That class no longer exists.");
    const isAdmin = ctx.profile.role === "school_admin" || ctx.profile.role === "super_admin";
    if (!isAdmin && klass.class_teacher_id !== ctx.profile.id) {
      throw new UserFacingError("Only this class's teacher or an administrator can generate its reports.");
    }

    const [enrolledRes, bandsRes, existingRes, schoolRes, rosterRes] = await Promise.all([
      ctx.db
        .from("enrollments")
        .select("student_id")
        .eq("class_id", class_id)
        .eq("status", "active")
        // The term's own year, not just "active status": promotion appends an enrollment per year
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
      ctx.db.from("schools").select("ca_weight, pass_mark").eq("id", ctx.schoolId).single(),
      // The class's timetable: what the card lists, marked or not (see computeSubjectComponents).
      ctx.db.from("class_subjects").select("subjects(name, code)").eq("class_id", class_id),
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
    const passMark = Number(schoolRes.data?.pass_mark ?? 50);
    const roster = (rosterRes.data ?? [])
      .map((cs) => cs.subjects)
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .map((s) => ({ name: s.name, code: s.code }));

    // Read the marks and attendance with the SERVICE ROLE, not the caller's client.
    //
    // A report card lists every subject on the class's timetable, but res_teacher_rw scopes a teacher
    // to results for the subjects THEY personally teach (teacher_teaches checks class_subjects, with no
    // homeroom clause). So a class teacher compiling the card under their own RLS would silently get
    // zero rows for every colleague-taught subject and freeze null totals and a wrong class rank onto
    // an official document. The caller was authorized as this class's teacher (or an admin) above, and
    // every read below is pinned to this school and this class's roster, so elevating just these reads
    // is safe and is what lets the card be complete. Writes stay on ctx.db; RLS still confines the
    // teacher to their own class.
    const svc = createServiceClient();
    const [allResults, allAttendance] = await Promise.all([
      fetchAllPaged((from, to) =>
        svc
          .from("results")
          .select(
            "student_id, score, assessments!inner(max_score, term_id, subjects(name), assessment_types(is_exam))",
          )
          .eq("school_id", ctx.schoolId)
          // Only submitted marks reach a report, a teacher's draft must never become an official record.
          .eq("is_submitted", true)
          .eq("assessments.term_id", term_id)
          .in("student_id", studentIds)
          .range(from, to),
      ),
      fetchAllPaged((from, to) =>
        svc
          .from("attendance")
          .select("student_id, status")
          .eq("school_id", ctx.schoolId)
          .eq("term_id", term_id)
          .in("student_id", studentIds)
          .range(from, to),
      ),
    ]);

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
      const subjects = computeSubjectComponents(componentInputs, caWeight, roster);
      const totals = subjects.map((s) => s.total).filter((t): t is number => t !== null);
      const attendance = attendanceTotals(allAttendance.filter((a) => a.student_id === studentId));

      return {
        student_id: studentId,
        subjects,
        subject_count: totals.length,
        // One decimal, like the paper card: 877.7 and 87.8, not 878 and 88. Rounding the total to a
        // whole number and the average separately would let the two disagree on the page.
        total_score: totals.length === 0 ? null : round1(totals.reduce((a, b) => a + b, 0)),
        average_score:
          totals.length === 0 ? null : round1(totals.reduce((a, b) => a + b, 0) / totals.length),
        passes: countPasses(subjects, passMark),
        ...attendance,
      };
    });

    // Positions computed across the whole class at once, a rank is meaningless per student.
    // Overall position ranks the averages; each SUBJECT is ranked separately over its totals.
    const positioned = assignPositions(draft);
    const subjectPosition = new Map<string, number | null>();
    const subjectSpread = new Map<string, ReturnType<typeof spreadStats>>();
    const subjectNames = [...new Set(draft.flatMap((d) => d.subjects.map((s) => s.subject_name)))];
    for (const name of subjectNames) {
      const totals = draft.map((d) => d.subjects.find((s) => s.subject_name === name)?.total ?? null);
      subjectSpread.set(name, spreadStats(totals));
      const ranked = assignPositions(
        draft.map((d, i) => ({ student_id: d.student_id, average_score: totals[i]! })),
      );
      for (const r of ranked) subjectPosition.set(`${r.student_id}:${name}`, r.position);
    }

    // The class's own spread, the card's "Class Average / Lowest Class Ave. / Highest Class Ave."
    const classSpread = spreadStats(draft.map((d) => d.average_score));

    // "Position in <level>": the same rank taken across every class at this level. The sister
    // classes' figures come from their STORED reports, so a level whose other classes have not been
    // generated yet ranks against a partial cohort, generate the whole level before publishing.
    const levelRank = await rankAcrossLevel(svc, {
      schoolId: ctx.schoolId,
      classId: class_id,
      level: klass.level,
      termId: term_id,
      cohort: draft.map((d) => ({ student_id: d.student_id, average_score: d.average_score })),
    });

    // Published reports are refreshed like the rest (comments and figures preserved/recomputed the
    // same way), but their SUBJECT rows are also rewritten, figures and rows must never disagree.
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
        passes: r.passes,
        class_average: classSpread.average,
        class_lowest_average: classSpread.lowest,
        class_highest_average: classSpread.highest,
        level_position: levelRank.positionByStudent.get(r.student_id) ?? null,
        level_size: levelRank.size,
        attendance_present: r.present,
        attendance_total: r.total,
        enrolled_count: studentIds.length,
        // Preserved, never recomputed, a human's words are not arithmetic.
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
      // unique(student_id, term_id) from 0009, regenerating updates in place.
      await ctx.db
        .from("terminal_reports")
        .upsert(rows, { onConflict: "student_id,term_id" })
        .select("id, student_id"),
      "terminal reports",
    );

    // Snapshot the subject rows: replace wholesale so subjects dropped from the class disappear.
    const reportIdByStudent = new Map(saved.map((s) => [s.student_id, s.id]));
    const subjectRows = positioned.flatMap((r) =>
      r.subjects.map((s: SubjectComponents) => {
        const band = s.total === null ? null : scoreToGrade(s.total, 100, bands);
        const spread = subjectSpread.get(s.subject_name);
        return {
          school_id: ctx.schoolId,
          report_id: reportIdByStudent.get(r.student_id)!,
          student_id: r.student_id,
          subject_name: s.subject_name,
          short_code: s.short_code,
          class_score: s.class_score,
          exam_score: s.exam_score,
          total: s.total,
          class_average: spread?.average ?? null,
          class_lowest: spread?.lowest ?? null,
          class_highest: spread?.highest ?? null,
          grade: band?.grade ?? null,
          position: subjectPosition.get(`${r.student_id}:${s.subject_name}`) ?? null,
          remark: band?.remark ?? null,
        };
      }),
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
 * The card's second position line: where the child stands among everyone at their level, not just
 * in their class ("Position in J.H.S. 2: 1/16" on the school's template).
 *
 * The cohort is the class being generated (whose averages are still in memory, not yet written)
 * plus every OTHER class at the same level that already has stored reports for this term. Sister
 * classes contribute their stored averages rather than being recomputed: those are the figures
 * their own cards were printed from, and ranking against anything else would put two children in
 * the same position.
 */
async function rankAcrossLevel(
  svc: ReturnType<typeof createServiceClient>,
  args: {
    schoolId: string;
    classId: string;
    level: string | null;
    termId: string;
    cohort: readonly { student_id: string; average_score: number | null }[];
  },
): Promise<{ positionByStudent: Map<string, number | null>; size: number }> {
  const empty = { positionByStudent: new Map<string, number | null>(), size: args.cohort.length };
  if (!args.level) return empty;

  // Read the sibling classes' stored reports with the service role: under a class teacher's own RLS
  // (tr_teacher_read) only their own class's reports are visible, which would silently size the level
  // rank against a single class ("1/16" when the level holds 48). Scoped to this school and level.
  const { data: siblings, error } = await svc
    .from("terminal_reports")
    .select("student_id, average_score, classes!inner(level)")
    .eq("school_id", args.schoolId)
    .eq("term_id", args.termId)
    .eq("classes.level", args.level)
    .neq("class_id", args.classId);
  // A level rank is a nicety on the card, not the record itself, a failed read leaves it blank
  // rather than aborting a generation the school is waiting on.
  if (error) return empty;

  const cohort = [
    ...args.cohort,
    ...(siblings ?? []).map((s) => ({
      student_id: s.student_id,
      average_score: s.average_score === null ? null : Number(s.average_score),
    })),
  ];
  const ranked = assignPositions(cohort);
  return {
    positionByStudent: new Map(ranked.map((r) => [r.student_id, r.position])),
    // Sized by the whole level, so "3/48" reads against the cohort the rank was taken over.
    size: cohort.length,
  };
}

/**
 * Save the human-written card fields for one report: the two remarks plus conduct, attitude,
 * interest and promoted-to. Only the keys the caller sent are written (omitted = untouched,
 * empty string = cleared), the teacher dialog and the admin dialog send different subsets and
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

    // Publication is the feed-worthy moment; it's when parents can suddenly see the reports.
    if (published && (data?.length ?? 0) > 0) {
      const { data: klass } = await ctx.db.from("classes").select("name").eq("id", class_id).maybeSingle();
      await logActivity(ctx, `published terminal reports for ${klass?.name ?? "a class"}`, "terminal_report");
    }

    revalidatePath("/terminal-reports");
    return { affected: data?.length ?? 0, published };
  });
}
