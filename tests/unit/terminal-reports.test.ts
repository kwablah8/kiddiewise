import { describe, expect, it } from "vitest";
import {
  reportTotals,
  assignPositions,
  overallGrade,
  attendanceTotals,
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

  it("rounds the average to a whole percent", () => {
    expect(reportTotals([subject(70), subject(75)]).average_score).toBe(73); // 72.5 → 73
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
    // 1, 2, 2, 4 — how a report card reads. Dense ranking (1, 2, 2, 3) would understate how many
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
