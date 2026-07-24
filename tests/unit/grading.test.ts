import { describe, expect, it } from "vitest";
import { scoreToGrade, assessmentTypeWeightTotal, gradeBandWarnings } from "@/lib/grading";
import type { GradeBandVM } from "@/lib/validators/grading";

const BANDS: GradeBandVM[] = [
  { id: "a", min_score: 80, max_score: 100, grade: "A", remark: "Excellent" },
  { id: "b", min_score: 70, max_score: 79, grade: "B", remark: "Very Good" },
  { id: "c", min_score: 60, max_score: 69, grade: "C", remark: "Good" },
  { id: "f", min_score: 0, max_score: 59, grade: "F", remark: "Fail" },
];

describe("scoreToGrade", () => {
  it("maps a raw score over max to the right band by percentage", () => {
    expect(scoreToGrade(30, 30, BANDS)).toEqual({ grade: "A", remark: "Excellent" }); // 100%
    expect(scoreToGrade(24, 30, BANDS)).toEqual({ grade: "A", remark: "Excellent" }); // 80%
    expect(scoreToGrade(23, 30, BANDS)).toEqual({ grade: "B", remark: "Very Good" }); // 77% → 77
    expect(scoreToGrade(0, 30, BANDS)).toEqual({ grade: "F", remark: "Fail" });
  });
  it("rounds the percentage so contiguous integer bands have no gap", () => {
    // 79.5% rounds up to 80 → A
    expect(scoreToGrade(79.5, 100, BANDS)).toEqual({ grade: "A", remark: "Excellent" });
    expect(scoreToGrade(79.4, 100, BANDS)).toEqual({ grade: "B", remark: "Very Good" });
  });
  it("returns null for a zero/negative max or an unmatched percentage", () => {
    expect(scoreToGrade(10, 0, BANDS)).toBeNull();
    const gapped: GradeBandVM[] = [{ id: "x", min_score: 90, max_score: 100, grade: "A", remark: "!" }];
    expect(scoreToGrade(50, 100, gapped)).toBeNull();
  });
});

describe("assessmentTypeWeightTotal", () => {
  it("sums weights", () => {
    expect(assessmentTypeWeightTotal([{ weight: 20 }, { weight: 30 }, { weight: 50 }])).toBe(100);
    expect(assessmentTypeWeightTotal([])).toBe(0);
  });
});

describe("gradeBandWarnings", () => {
  it("returns no warnings for contiguous bands covering 0–100", () => {
    expect(gradeBandWarnings(BANDS)).toEqual([]);
  });
  it("flags an overlap", () => {
    const overlap: GradeBandVM[] = [
      { id: "a", min_score: 70, max_score: 100, grade: "A", remark: "!" },
      { id: "b", min_score: 60, max_score: 75, grade: "B", remark: "!" },
    ];
    expect(gradeBandWarnings(overlap).some((w) => w.includes("overlap"))).toBe(true);
  });
  it("flags incomplete coverage", () => {
    const gapped: GradeBandVM[] = [{ id: "a", min_score: 50, max_score: 90, grade: "A", remark: "!" }];
    const w = gradeBandWarnings(gapped);
    expect(w.length).toBeGreaterThanOrEqual(2); // below 50 and above 90 uncovered
  });
});
