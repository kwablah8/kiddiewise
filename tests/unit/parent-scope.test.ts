import { describe, expect, it } from "vitest";
import { childrenOf, isGuardianOf, type StudentForScope } from "@/lib/parent/scope";

const students: StudentForScope[] = [
  {
    id: "stu-01",
    first_name: "Kwame",
    last_name: "Asante",
    photo_url: null,
    class_name: "Creche",
    guardians: [{ parent_profile_id: "prt-01" }, { parent_profile_id: "prt-02" }],
  },
  {
    id: "stu-02",
    first_name: "Ama",
    last_name: "Boateng",
    photo_url: null,
    class_name: "Creche",
    guardians: [{ parent_profile_id: "prt-01" }],
  },
  {
    id: "stu-09",
    first_name: "Other",
    last_name: "Child",
    photo_url: null,
    class_name: "Basic 3",
    guardians: [{ parent_profile_id: "prt-10" }],
  },
];

describe("isGuardianOf", () => {
  it("is true for a linked child and false for a non-linked one", () => {
    expect(isGuardianOf("prt-01", "stu-01", students)).toBe(true);
    expect(isGuardianOf("prt-01", "stu-02", students)).toBe(true);
    expect(isGuardianOf("prt-01", "stu-09", students)).toBe(false); // not this parent's child
    expect(isGuardianOf("prt-01", "does-not-exist", students)).toBe(false);
  });
});

describe("childrenOf", () => {
  it("returns only the parent's children as ChildSummaryVMs", () => {
    const kids = childrenOf("prt-01", students);
    expect(kids.map((k) => k.id)).toEqual(["stu-01", "stu-02"]);
    expect(kids[0]).toMatchObject({
      first_name: "Kwame",
      class_name: "Creche",
      attendance_pct: null,
      latest_result: null,
    });
  });
  it("returns an empty array for a parent with no linked students", () => {
    expect(childrenOf("prt-99", students)).toEqual([]);
  });
});
