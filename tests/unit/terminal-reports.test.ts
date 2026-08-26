import { describe, expect, it } from "vitest";
import {
  reportTotals,
  assignPositions,
  overallGrade,
  attendanceTotals,
  computeSubjectComponents,
  countPasses,
  spreadStats,
  type ComponentResultInput,
} from "@/lib/terminal-reports";
import type { GradeBandVM } from "@/lib/validators/grading";
import type { SubjectResultVM } from "@/lib/validators/parent";

const subject = (score: number, name = "Mathematics"): SubjectResultVM => ({
  subject: name,
  score,
  grade: "B",
  remark: "Very Good",
  teacher_comment: null,
});

const bands: GradeBandVM[] = [
  { id: "1", min_score: 80, max_score: 100, grade: "A", remark: "Excellent" },
  { id: "2", min_score: 70, max_score: 79, grade: "B", remark: "Very Good" },
  { id: "3", min_score: 0, max_score: 69, grade: "F", remark: "Fail" },
];

describe("reportTotals", () => {
  it("sums the subjects and means them", () => {
    expect(reportTotals([subject(80), subject(70, "English")])).toEqual({
      total_score: 150,
      average_score: 75,
      subject_count: 2,
    });
  });

  it("is null — not zero — when nothing has been submitted", () => {
    // A zero average would rank an unassessed child bottom of the class and read as a fail on their
    // report card. "Not assessed" and "scored nothing" are different facts.
    expect(reportTotals([])).toEqual({
      total_score: null,
      average_score: null,
      subject_count: 0,
    });
  });

  it("keeps one decimal, like the printed card", () => {
    // The card prints "Total Score 877.7 / Average Score 87.8". Rounding to whole percents here
    // would make the two lines disagree with the subject totals they are summed from.
    expect(reportTotals([subject(70), subject(75)]).average_score).toBe(72.5);
    expect(reportTotals([subject(86.7), subject(73.4), subject(96.5)])).toEqual({
      total_score: 256.6,
      average_score: 85.5,
      subject_count: 3,
    });
  });
});

describe("assignPositions", () => {
  it("ranks highest average first", () => {
    const out = assignPositions([
      { student_id: "a", average_score: 61 },
      { student_id: "b", average_score: 88 },
      { student_id: "c", average_score: 74 },
    ]);
    expect(out.find((r) => r.student_id === "b")!.position).toBe(1);
    expect(out.find((r) => r.student_id === "c")!.position).toBe(2);
    expect(out.find((r) => r.student_id === "a")!.position).toBe(3);
  });

  it("gives tied students the same position and skips the next (competition ranking)", () => {
    // 1, 2, 2, 4, how a report card reads. Dense ranking (1, 2, 2, 3) would understate how many
    // children are ahead of the fourth student.
    const out = assignPositions([
      { student_id: "a", average_score: 90 },
      { student_id: "b", average_score: 82 },
      { student_id: "c", average_score: 82 },
      { student_id: "d", average_score: 70 },
    ]);
    expect(out.find((r) => r.student_id === "a")!.position).toBe(1);
    expect(out.find((r) => r.student_id === "b")!.position).toBe(2);
    expect(out.find((r) => r.student_id === "c")!.position).toBe(2);
    expect(out.find((r) => r.student_id === "d")!.position).toBe(4);
  });

  it("leaves an unassessed student UNRANKED rather than last", () => {
    const out = assignPositions([
      { student_id: "a", average_score: 70 },
      { student_id: "b", average_score: null },
    ]);
    expect(out.find((r) => r.student_id === "a")!.position).toBe(1);
    expect(out.find((r) => r.student_id === "b")!.position).toBeNull();
  });

  it("preserves every input row, ranked or not", () => {
    const out = assignPositions([
      { student_id: "a", average_score: null },
      { student_id: "b", average_score: null },
    ]);
    expect(out).toHaveLength(2);
    expect(out.every((r) => r.position === null)).toBe(true);
  });

  it("handles a single student and an empty class", () => {
    expect(assignPositions([{ student_id: "a", average_score: 50 }])[0]!.position).toBe(1);
    expect(assignPositions([])).toEqual([]);
  });
});

describe("overallGrade", () => {
  it("bands the average", () => {
    expect(overallGrade(85, bands)?.grade).toBe("A");
    expect(overallGrade(72, bands)?.grade).toBe("B");
  });

  it("is null with no average", () => {
    expect(overallGrade(null, bands)).toBeNull();
  });
});

describe("attendanceTotals", () => {
  it("counts LATE as attended", () => {
    // A child who arrived late was at school. A report card saying otherwise will be contested by the
    // parent, correctly.
    expect(
      attendanceTotals([
        { status: "present" },
        { status: "late" },
        { status: "absent" },
      ]),
    ).toEqual({ present: 2, total: 3 });
  });

  it("is 0/0 with no records, not a divide-by-zero", () => {
    expect(attendanceTotals([])).toEqual({ present: 0, total: 0 });
  });
});

describe("computeSubjectComponents", () => {
  const r = (
    subject: string | null,
    score: number,
    max: number,
    isExam: boolean,
  ): ComponentResultInput => ({ subject, score, max_score: max, is_exam: isExam });

  it("splits a subject into CA and exam components at 50/50", () => {
    const rows = computeSubjectComponents(
      [r("Maths", 8, 10, false), r("Maths", 6, 10, false), r("Maths", 60, 100, true)],
      50,
    );
    // CA mean = (80 + 60) / 2 = 70% → 35.0 of 50; exam = 60% → 30.0 of 50.
    expect(rows).toEqual([
      { subject_name: "Maths", short_code: null, class_score: 35, exam_score: 30, total: 65 },
    ]);
  });

  it("leaves a missing component blank, never zero, and totals what exists", () => {
    const caOnly = computeSubjectComponents([r("English", 90, 100, false)], 50);
    expect(caOnly[0]).toEqual({
      subject_name: "English",
      short_code: null,
      class_score: 45,
      exam_score: null,
      total: 45,
    });

    const examOnly = computeSubjectComponents([r("Science", 40, 50, true)], 50);
    expect(examOnly[0]).toEqual({
      subject_name: "Science",
      short_code: null,
      class_score: null,
      exam_score: 40,
      total: 40,
    });
  });

  it("respects a non-even school weighting (30% CA / 70% exam)", () => {
    const rows = computeSubjectComponents(
      [r("Maths", 100, 100, false), r("Maths", 50, 100, true)],
      30,
    );
    expect(rows[0]).toEqual({
      subject_name: "Maths",
      short_code: null,
      class_score: 30,
      exam_score: 35,
      total: 65,
    });
  });

  it("rounds each component and the total to one decimal place", () => {
    const rows = computeSubjectComponents(
      [r("RME", 1, 3, false), r("RME", 2, 3, true)],
      50,
    );
    // CA: 33.333...% → 16.7 of 50; exam: 66.666...% → 33.3 of 50.
    expect(rows[0]).toEqual({
      subject_name: "RME",
      short_code: null,
      class_score: 16.7,
      exam_score: 33.3,
      total: 50,
    });
  });

  it("lists every subject on the class ROSTER, marked or not, and carries its short code", () => {
    // The paper card prints an empty line for a subject nobody has been marked in yet. A subject
    // silently missing from the table reads as "not offered" rather than "not marked".
    const rows = computeSubjectComponents([r("English Language", 80, 100, false)], 50, [
      { name: "English Language", code: "ENG" },
      { name: "Physical Health and Education", code: "PHE" },
    ]);
    expect(rows).toEqual([
      {
        subject_name: "English Language",
        short_code: "ENG",
        class_score: 40,
        exam_score: null,
        total: 40,
      },
      {
        subject_name: "Physical Health and Education",
        short_code: "PHE",
        class_score: null,
        exam_score: null,
        total: null,
      },
    ]);
  });

  it("still reports a mark for a subject the roster does not list", () => {
    // A mark that exists is a fact about the child, however the timetable was configured.
    const rows = computeSubjectComponents([r("French", 60, 100, true)], 50, [
      { name: "Twi", code: "TWI" },
    ]);
    expect(rows.map((x) => x.subject_name)).toEqual(["French", "Twi"]);
    expect(rows.find((x) => x.subject_name === "French")!.exam_score).toBe(30);
  });

  it("drops results with no subject or a non-positive max score, sorts by subject", () => {
    const rows = computeSubjectComponents(
      [
        r("Computing", 5, 10, false),
        r(null, 9, 10, false),
        r("Art", 5, 0, false),
        r("Art", 7, 10, false),
      ],
      50,
    );
    expect(rows.map((x) => x.subject_name)).toEqual(["Art", "Computing"]);
    expect(rows[0]!.class_score).toBe(35);
  });

  it("returns nothing for no results", () => {
    expect(computeSubjectComponents([], 50)).toEqual([]);
  });
});

describe("spreadStats", () => {
  it("gives the card's Class Ave. / Low. / High. columns", () => {
    expect(spreadStats([78.6, 58.2, 91.4])).toEqual({
      average: 76.1,
      lowest: 58.2,
      highest: 91.4,
    });
  });

  it("ignores unmarked entries rather than counting them as zero", () => {
    // Half a class still unmarked must not drag the class average toward zero and make every
    // marked child look strong by comparison.
    expect(spreadStats([80, null, 60])).toEqual({ average: 70, lowest: 60, highest: 80 });
  });

  it("is all-null when nothing is marked", () => {
    expect(spreadStats([null, null])).toEqual({ average: null, lowest: null, highest: null });
    expect(spreadStats([])).toEqual({ average: null, lowest: null, highest: null });
  });
});

describe("countPasses", () => {
  const at = (total: number | null) => ({ total });

  it("counts subjects at or above the school's pass mark", () => {
    expect(countPasses([at(50), at(49.9), at(86.7)], 50)).toBe(2);
  });

  it("does not count an unmarked subject as a failure", () => {
    expect(countPasses([at(70), at(null)], 50)).toBe(1);
  });
});
