import { describe, expect, it } from "vitest";
import { buildRoster } from "@/lib/attendance";

const students = [
  { id: "stu-02", first_name: "Bella", last_name: "Owusu", admission_no: "K2" },
  { id: "stu-01", first_name: "Ama", last_name: "Owusu", admission_no: "K1" },
];

describe("buildRoster", () => {
  it("merges existing statuses and marks the rest null, ordered by name", () => {
    const roster = buildRoster(students, [{ student_id: "stu-01", status: "present" }]);
    expect(roster.map((r) => r.student_id)).toEqual(["stu-01", "stu-02"]); // Ama before Bella
    expect(roster.find((r) => r.student_id === "stu-01")?.status).toBe("present");
    expect(roster.find((r) => r.student_id === "stu-02")?.status).toBeNull();
    expect(roster.every((r) => r.scanned_at === null)).toBe(true);
  });

  it("carries a gate scan-in time beside the mark, for the scanned student only", () => {
    const roster = buildRoster(
      students,
      [{ student_id: "stu-01", status: "late" }],
      [{ student_id: "stu-01", arrived_at: "2026-10-08T09:20:00+00:00" }],
    );
    expect(roster.find((r) => r.student_id === "stu-01")).toMatchObject({
      status: "late",
      scanned_at: "2026-10-08T09:20:00+00:00",
    });
    expect(roster.find((r) => r.student_id === "stu-02")?.scanned_at).toBeNull();
  });
});
