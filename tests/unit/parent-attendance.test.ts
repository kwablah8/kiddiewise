import { describe, expect, it } from "vitest";
import { summarizeAttendance } from "@/lib/parent/attendance";

describe("summarizeAttendance", () => {
  it("counts statuses and computes the attendance rate (present + late over total)", () => {
    const s = summarizeAttendance([
      { date: "2026-07-01", status: "present" },
      { date: "2026-07-02", status: "present" },
      { date: "2026-07-03", status: "late" },
      { date: "2026-07-04", status: "absent" },
    ]);
    expect(s).toEqual({ present: 2, absent: 1, late: 1, total: 4, pct: 75 });
  });
  it("returns null pct for no records", () => {
    expect(summarizeAttendance([])).toEqual({
      present: 0,
      absent: 0,
      late: 0,
      total: 0,
      pct: null,
    });
  });
  it("rounds the percentage to a whole number (2 of 3 present → 67)", () => {
    const s = summarizeAttendance([
      { date: "d1", status: "present" },
      { date: "d2", status: "absent" },
      { date: "d3", status: "present" },
    ]);
    expect(s.pct).toBe(67);
  });
});
