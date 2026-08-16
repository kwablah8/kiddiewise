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
    total_score: round1(total),
    average_score: round1(total / subjects.length),
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

export interface ComponentResultInput {
  subject: string | null;
  score: number;
  max_score: number;
  /** From the result's assessment type — the GES split's dividing line. */
  is_exam: boolean;
}

export interface SubjectComponents {
  subject_name: string;
  /** The template's "Short Code" column — CAD, ENG, MAT. Null for a subject with no code set. */
  short_code: string | null;
  class_score: number | null;
  exam_score: number | null;
  total: number | null;
}

/** One line of the class's subject list: what the class is timetabled to be taught. */
export interface SubjectRosterEntry {
  name: string;
  code: string | null;
}

/** The report card carries one decimal throughout — 877.7, not 878. */
export const round1 = (n: number): number => Math.round(n * 10) / 10;

/**
 * The GES report-card split: per subject, continuous assessment (every non-exam result) scaled to
 * the school's CA weight, the end-of-term examination scaled to the remainder, summed into the
 * Total column (spec 2026-07-31 §1).
 *
 * A missing component is NULL, never zero — a child whose exam sheet hasn't been marked yet has a
 * blank cell, not half their marks confiscated. The total is whatever components exist, so a
 * CA-only subject tops out at the CA weight, which is exactly what the paper form would show.
 *
 * The ROSTER (the class's `class_subjects`) drives which rows exist, not the marks. The school's
 * template prints an empty line for a subject nobody has been marked in yet — the paper form lists
 * what the class is taught, and a subject silently missing from a card reads as "not offered"
 * rather than "not marked". Marks for a subject outside the roster still appear, because a mark
 * that exists is a fact about the child regardless of how the timetable was configured.
 */
export function computeSubjectComponents(
  results: readonly ComponentResultInput[],
  caWeight: number,
  roster: readonly SubjectRosterEntry[] = [],
): SubjectComponents[] {
  const codeByName = new Map(roster.map((s) => [s.name, s.code]));
  const bySubject = new Map<string, { ca: number[]; exam: number[] }>();
  for (const s of roster) bySubject.set(s.name, { ca: [], exam: [] });
  for (const r of results) {
    if (!r.subject || r.max_score <= 0) continue;
    const bucket = bySubject.get(r.subject) ?? { ca: [], exam: [] };
    (r.is_exam ? bucket.exam : bucket.ca).push((r.score / r.max_score) * 100);
    bySubject.set(r.subject, bucket);
  }

  const mean = (xs: number[]): number | null =>
    xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length;

  return [...bySubject.entries()]
    .map(([subject_name, { ca, exam }]): SubjectComponents => {
      const caMean = mean(ca);
      const examMean = mean(exam);
      const class_score = caMean === null ? null : round1((caMean * caWeight) / 100);
      const exam_score = examMean === null ? null : round1((examMean * (100 - caWeight)) / 100);
      const total =
        class_score === null && exam_score === null
          ? null
          : round1((class_score ?? 0) + (exam_score ?? 0));
      return {
        subject_name,
        short_code: codeByName.get(subject_name) ?? null,
        class_score,
        exam_score,
        total,
      };
    })
    .sort((a, b) => a.subject_name.localeCompare(b.subject_name));
}

/** The template's "Class Ave. / Class Low. / Class High. Score" columns for one subject. */
export interface SpreadStats {
  average: number | null;
  lowest: number | null;
  highest: number | null;
}

/**
 * The spread of a set of scores — used twice on the card: across one subject's totals (the three
 * per-row columns) and across the class's overall averages (the summary line).
 *
 * Unscored entries are excluded rather than counted as zero, so a class where half the exam sheets
 * are still unmarked does not report a collapsed average that makes every marked child look strong.
 */
export function spreadStats(scores: readonly (number | null)[]): SpreadStats {
  const marked = scores.filter((s): s is number => s !== null);
  if (marked.length === 0) return { average: null, lowest: null, highest: null };
  return {
    average: round1(marked.reduce((a, b) => a + b, 0) / marked.length),
    lowest: round1(Math.min(...marked)),
    highest: round1(Math.max(...marked)),
  };
}

/**
 * "Number Of Passes" — how many of the child's subjects reached the school's pass mark.
 *
 * Counted over MARKED subjects only. An unmarked subject is not a failure; counting it as one
 * would make an incomplete mark sheet look like a struggling child.
 */
export function countPasses(
  subjects: readonly { total: number | null }[],
  passMark: number,
): number {
  return subjects.filter((s) => s.total !== null && s.total >= passMark).length;
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
