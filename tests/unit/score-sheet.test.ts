import { describe, expect, it } from "vitest";
import { buildScoreSheet, type ExistingResult, type ScoreSheetStudent } from "@/lib/results";

const students: ScoreSheetStudent[] = [
  { id: "s2", first_name: "Bella", last_name: "Owusu", admission_no: "KID-0002" },
  { id: "s1", first_name: "Ama", last_name: "Owusu", admission_no: "KID-0001" },
  { id: "s3", first_name: "Kofi", last_name: "Antwi", admission_no: "KID-0003" },
];

const existing: ExistingResult[] = [
  { student_id: "s1", score: 72, teacher_comment: "Good effort", is_submitted: true },
];

describe("buildScoreSheet", () => {
  it("merges existing marks and leaves the rest unmarked, ordered by name", () => {
    const sheet = buildScoreSheet(students, existing);
    // Sorted by FULL name, matching buildRoster for attendance — so a teacher reads the same order on
    // the register and the mark sheet: Ama Owusu, Bella Owusu, Kofi Antwi.
    expect(sheet.map((r) => r.student_id)).toEqual(["s1", "s2", "s3"]);

    const ama = sheet.find((r) => r.student_id === "s1")!;
    expect(ama.score).toBe(72);
    expect(ama.teacher_comment).toBe("Good effort");
    expect(ama.is_submitted).toBe(true);
  });

  it("uses null for an unmarked student, never 0", () => {
    // A zero is a mark the student earned; null is "not marked yet". Collapsing them would turn every
    // absence into a fail on the report card.
    const bella = buildScoreSheet(students, existing).find((r) => r.student_id === "s2")!;
    expect(bella.score).toBeNull();
    expect(bella.is_submitted).toBe(false);
  });

  it("preserves a legitimate score of 0", () => {
    const sheet = buildScoreSheet(students, [
      { student_id: "s2", score: 0, teacher_comment: null, is_submitted: false },
    ]);
    expect(sheet.find((r) => r.student_id === "s2")!.score).toBe(0);
  });

  it("includes a student who enrolled after the first marks were entered", () => {
    // The sheet is driven by the enrolment, so a late joiner must appear rather than be invisible.
    const sheet = buildScoreSheet(students, existing);
    expect(sheet).toHaveLength(3);
    expect(sheet.some((r) => r.student_id === "s3")).toBe(true);
  });

  it("ignores a result for someone no longer enrolled", () => {
    // A withdrawn student's old result row must not resurrect them onto the sheet.
    const sheet = buildScoreSheet(students, [
      ...existing,
      { student_id: "gone", score: 40, teacher_comment: null, is_submitted: true },
    ]);
    expect(sheet).toHaveLength(3);
    expect(sheet.some((r) => r.student_id === "gone")).toBe(false);
  });

  it("returns nothing for a class with no active enrolments", () => {
    expect(buildScoreSheet([], existing)).toEqual([]);
  });
});
