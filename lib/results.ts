import { scoreToGrade } from "@/lib/grading";
import type { GradeBandVM } from "@/lib/validators/grading";
import type { SubjectResultVM } from "@/lib/validators/parent";
import type { ScoreSheetEntryVM } from "@/lib/validators/assessments";

/** One submitted result row, flattened out of the results→assessments join. */
export interface ResultRowForAggregation {
  subject: string | null;
  score: number;
  /** The assessment's own maximum — assessments are not all marked out of 100. */
  max_score: number;
  teacher_comment: string | null;
  /** Used only to pick the most recent teacher comment. */
  recorded_at: string;
}

/**
 * Collapse many assessment results into ONE row per subject.
 *
 * A student sits several assessments per subject per term, but every screen that shows "results"
 * shows a single standing per subject. The score is the mean of that subject's submitted results,
 * each first converted to a percentage of its OWN max_score — averaging raw marks would let a
 * 20-mark class test count the same as a 100-mark exam.
 *
 * Grade and remark are derived from the school's current bands rather than read from the stored
 * `results.grade`, so editing the grading scale re-grades every view at once (golden rule 9). The
 * teacher's comment is taken from the most recent result, so this week's note outranks last month's.
 *
 * Pure, so both the admin's student view and the parent portal share it and can be unit-tested
 * without a database.
 */
export function aggregateSubjectResults(
  rows: readonly ResultRowForAggregation[],
  bands: GradeBandVM[],
): SubjectResultVM[] {
  const bySubject = new Map<string, { pcts: number[]; comment: string | null; at: string }>();

  for (const r of rows) {
    // A result with no subject or a non-positive max can't be scored as a percentage.
    if (!r.subject || r.max_score <= 0) continue;
    const pct = (r.score / r.max_score) * 100;

    const existing = bySubject.get(r.subject);
    if (!existing) {
      bySubject.set(r.subject, { pcts: [pct], comment: r.teacher_comment, at: r.recorded_at });
      continue;
    }
    existing.pcts.push(pct);
    if (r.recorded_at > existing.at) {
      existing.comment = r.teacher_comment;
      existing.at = r.recorded_at;
    }
  }

  return [...bySubject.entries()]
    .map(([subject, agg]) => {
      const mean = Math.round(agg.pcts.reduce((a, b) => a + b, 0) / agg.pcts.length);
      const g = scoreToGrade(mean, 100, bands);
      return {
        subject,
        score: mean,
        // An unbanded score means the grading scale has a gap — show a dash rather than invent a grade.
        grade: g?.grade ?? "—",
        remark: g?.remark ?? "—",
        teacher_comment: agg.comment,
      };
    })
    .sort((a, b) => a.subject.localeCompare(b.subject));
}

/** The mean of the per-subject standings — the figure a terminal report calls the overall average. */
export function overallAverage(subjects: readonly SubjectResultVM[]): number | null {
  if (subjects.length === 0) return null;
  return Math.round(subjects.reduce((sum, s) => sum + s.score, 0) / subjects.length);
}

/** A student on the mark sheet, before their existing mark (if any) is merged in. */
export interface ScoreSheetStudent {
  id: string;
  first_name: string;
  last_name: string;
  admission_no: string;
}

/** A mark already recorded against this assessment. */
export interface ExistingResult {
  student_id: string;
  score: number;
  teacher_comment: string | null;
  is_submitted: boolean;
}

/**
 * Merge a class's enrolled students with whatever marks already exist for one assessment.
 *
 * Mirrors `buildRoster` for attendance, and for the same reason: the sheet must be driven by the
 * ENROLMENT, not by the rows that happen to exist. A student who joined after the first marks were
 * entered has to appear (unmarked) rather than be invisible, and a student who has left must not
 * reappear just because an old result row survives.
 *
 * Pure, so the merge is unit-testable without a database.
 */
export function buildScoreSheet(
  students: readonly ScoreSheetStudent[],
  existing: readonly ExistingResult[],
): ScoreSheetEntryVM[] {
  const byStudent = new Map(existing.map((r) => [r.student_id, r]));
  return students
    .map((s): ScoreSheetEntryVM => {
      const mark = byStudent.get(s.id);
      return {
        student_id: s.id,
        student_name: `${s.first_name} ${s.last_name}`,
        admission_no: s.admission_no,
        score: mark?.score ?? null,
        teacher_comment: mark?.teacher_comment ?? null,
        is_submitted: mark?.is_submitted ?? false,
      };
    })
    .sort((a, b) => a.student_name.localeCompare(b.student_name));
}
