import { describe, expect, it } from "vitest";
import { aggregateSubjectResults, overallAverage, type ResultRowForAggregation } from "@/lib/results";
import type { GradeBandVM } from "@/lib/validators/grading";

const bands: GradeBandVM[] = [
  { id: "1", min_score: 80, max_score: 100, grade: "A", remark: "Excellent" },
  { id: "2", min_score: 70, max_score: 79, grade: "B", remark: "Very Good" },
  { id: "3", min_score: 60, max_score: 69, grade: "C", remark: "Good" },
  { id: "4", min_score: 0, max_score: 59, grade: "F", remark: "Fail" },
];

const row = (over: Partial<ResultRowForAggregation> = {}): ResultRowForAggregation => ({
  subject: "Mathematics",
  score: 80,
  max_score: 100,
  teacher_comment: null,
  recorded_at: "2026-05-01T00:00:00Z",
  ...over,
});

describe("aggregateSubjectResults", () => {
  it("collapses many assessments into one row per subject", () => {
    const out = aggregateSubjectResults(
      [row({ score: 70 }), row({ score: 90 }), row({ subject: "English", score: 60 })],
      bands,
    );
    expect(out.map((r) => r.subject)).toEqual(["English", "Mathematics"]); // sorted
    expect(out.find((r) => r.subject === "Mathematics")?.score).toBe(80); // mean of 70 and 90
  });

  it("normalises each result to a percentage of its OWN max before averaging", () => {
    // 18/20 = 90% and 70/100 = 70% → 80%. Averaging raw marks would give (18+70)/2 = 44.
    const out = aggregateSubjectResults(
      [row({ score: 18, max_score: 20 }), row({ score: 70, max_score: 100 })],
      bands,
    );
    expect(out[0]!.score).toBe(80);
    expect(out[0]!.grade).toBe("A");
  });

  it("derives grade and remark from the supplied bands", () => {
    expect(aggregateSubjectResults([row({ score: 75 })], bands)[0]).toMatchObject({
      grade: "B",
      remark: "Very Good",
    });
  });

  it("shows a dash when the scale has a gap rather than inventing a grade", () => {
    const gapped: GradeBandVM[] = [
      { id: "1", min_score: 90, max_score: 100, grade: "A", remark: "Excellent" },
    ];
    expect(aggregateSubjectResults([row({ score: 50 })], gapped)[0]).toMatchObject({
      grade: "—",
      remark: "—",
    });
  });

  it("keeps the most recent teacher comment, regardless of input order", () => {
    const out = aggregateSubjectResults(
      [
        row({ teacher_comment: "Older note", recorded_at: "2026-05-01T00:00:00Z" }),
        row({ teacher_comment: "Newer note", recorded_at: "2026-06-01T00:00:00Z" }),
      ],
      bands,
    );
    expect(out[0]!.teacher_comment).toBe("Newer note");

    // Reversed input must not change the answer: the comparison is on the timestamp, not arrival.
    const reversed = aggregateSubjectResults(
      [
        row({ teacher_comment: "Newer note", recorded_at: "2026-06-01T00:00:00Z" }),
        row({ teacher_comment: "Older note", recorded_at: "2026-05-01T00:00:00Z" }),
      ],
      bands,
    );
    expect(reversed[0]!.teacher_comment).toBe("Newer note");
  });

  it("skips rows that cannot be scored", () => {
    // No subject to group under, and a zero max would divide by zero.
    const out = aggregateSubjectResults(
      [row({ subject: null }), row({ max_score: 0 }), row({ score: 65 })],
      bands,
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.score).toBe(65);
  });

  it("returns nothing for no results", () => {
    expect(aggregateSubjectResults([], bands)).toEqual([]);
  });
});

describe("overallAverage", () => {
  it("means the per-subject standings", () => {
    const subjects = aggregateSubjectResults(
      [row({ score: 90 }), row({ subject: "English", score: 70 })],
      bands,
    );
    expect(overallAverage(subjects)).toBe(80);
  });

  it("is null with no subjects — not zero, which would read as total failure", () => {
    expect(overallAverage([])).toBeNull();
  });
});
