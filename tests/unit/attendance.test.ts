import { describe, expect, it } from "vitest";
import { buildRoster, applyAttendanceUpsert } from "@/lib/attendance";
import type { AttendanceRecord } from "@/lib/mock/attendance-records";

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
  });
});

describe("applyAttendanceUpsert", () => {
  const meta = { class_id: "cls-1", date: "2026-07-24", term_id: "trm-3", marked_by: null };
  const existing: AttendanceRecord[] = [
    { student_id: "stu-01", class_id: "cls-1", term_id: "trm-3", date: "2026-07-24", status: "present", marked_by: null },
    { student_id: "stu-09", class_id: "cls-2", term_id: "trm-3", date: "2026-07-24", status: "present", marked_by: null },
  ];

  it("updates an existing (student,date) record in place", () => {
    const next = applyAttendanceUpsert(existing, [{ student_id: "stu-01", status: "late" }], meta);
    expect(next.filter((r) => r.student_id === "stu-01" && r.date === "2026-07-24")).toHaveLength(1);
    expect(next.find((r) => r.student_id === "stu-01")?.status).toBe("late");
  });
  it("inserts a new record for an unmarked student", () => {
    const next = applyAttendanceUpsert(existing, [{ student_id: "stu-02", status: "absent" }], meta);
    expect(next.find((r) => r.student_id === "stu-02")?.status).toBe("absent");
    expect(next).toHaveLength(existing.length + 1);
  });
  it("leaves other students' records untouched", () => {
    const next = applyAttendanceUpsert(existing, [{ student_id: "stu-01", status: "absent" }], meta);
    expect(next.find((r) => r.student_id === "stu-09")?.status).toBe("present");
  });
  it("does not mutate the input array", () => {
    applyAttendanceUpsert(existing, [{ student_id: "stu-01", status: "absent" }], meta);
    expect(existing.find((r) => r.student_id === "stu-01")?.status).toBe("present");
  });
});
