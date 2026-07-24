import { describe, expect, it } from "vitest";
import { subjectStats } from "@/lib/academics";

describe("subjectStats", () => {
  it("counts total, assigned, unassigned, and total class assignments", () => {
    const s = subjectStats([
      { id: "1", name: "Mathematics", code: "MATH", class_count: 6 },
      { id: "2", name: "English", code: "ENG", class_count: 4 },
      { id: "3", name: "French", code: null, class_count: 0 },
    ]);
    expect(s).toEqual({ total: 3, assigned: 2, unassigned: 1, classAssignments: 10 });
  });
  it("handles an empty list", () => {
    expect(subjectStats([])).toEqual({ total: 0, assigned: 0, unassigned: 0, classAssignments: 0 });
  });
});
