import { scoreToGrade } from "@/lib/grading";
import type { GradeBandVM } from "@/lib/validators/grading";
import type { SubjectResultVM } from "@/lib/validators/parent";

/**
 * Terminal report arithmetic.
 *
 * A terminal report is deliberately a STORED snapshot, unlike `results.grade` which must always be
 * derived. The difference is what each thing is: a result is live data, so correcting the grading
 * scale should re-grade it; a report is the official record of a term, so once it is published it must
 * not silently change because a teacher edited a mark afterwards. Freezing it is the point.
 *
 * Everything here is pure, so the arithmetic that ends up on a child's report card is unit-testable
 * without a database.
 */

export interface ReportSubjectInput {
  /** Per-subject standing, already normalised to a percentage by aggregateSubjectResults. */
  subjects: readonly SubjectResultVM[];
}

export interface ReportTotals {
  /** Sum of the per-subject percentages. `average = total / subject_count`. */
  total_score: number | null;
  average_score: number | null;
  subject_count: number;
}

/**
 * Totals for one student.
 *
 * Null rather than zero when a student has no submitted results: a child who sat nothing has no
 * average, and a zero would rank them bottom of the class instead of leaving them unranked.
 */
export function reportTotals(subjects: readonly SubjectResultVM[]): ReportTotals {
  if (subjects.length === 0) {
    return { total_score: null, average_score: null, subject_count: 0 };
  }
  const total = subjects.reduce((sum, s) => sum + s.score, 0);
  return {
    total_score: total,
    average_score: Math.round(total / subjects.length),
    subject_count: subjects.length,
  };
}

export interface RankableRow {
  student_id: string;
  average_score: number | null;
}

/**
 * Class positions by average, highest first.
 *
 * Competition ranking: two students tied on 82 are both 2nd and the next is 4th. That is how school
 * report cards read, and the alternative (dense ranking, where the next is 3rd) would understate how
 * many children are ahead of them.
 *
 * A student with no average is left UNRANKED (null) rather than placed last — they have not been
 * assessed, which is different from having done badly.
 */
export function assignPositions<T extends RankableRow>(rows: readonly T[]): (T & { position: number | null })[] {
  const ranked = rows
    .filter((r) => r.average_score !== null)
    .sort((a, b) => b.average_score! - a.average_score!);

  const positionByStudent = new Map<string, number>();
  ranked.forEach((row, index) => {
    const previous = index > 0 ? ranked[index - 1]! : null;
    // Same average as the student above → same position. Otherwise position is 1-based index, which
    // is what makes the sequence skip after a tie.
    const position =
      previous && previous.average_score === row.average_score
        ? positionByStudent.get(previous.student_id)!
        : index + 1;
    positionByStudent.set(row.student_id, position);
  });

  return rows.map((r) => ({ ...r, position: positionByStudent.get(r.student_id) ?? null }));
}

/** The overall grade for a report — the average put through the school's bands. */
export function overallGrade(
  average: number | null,
  bands: GradeBandVM[],
): { grade: string; remark: string } | null {
  if (average === null) return null;
  return scoreToGrade(average, 100, bands);
}

/**
 * Attendance as it appears on a report card.
 *
 * `present` counts late arrivals as attended — a child who came in late was at school that day, and a
 * report card that says otherwise will be contested by the parent, correctly.
 */
export function attendanceTotals(
  statuses: readonly { status: "present" | "absent" | "late" }[],
): { present: number; total: number } {
  return {
    present: statuses.filter((a) => a.status === "present" || a.status === "late").length,
    total: statuses.length,
  };
}
