import { describe, expect, it } from "vitest";
import { columnsToCsv, pdfRows } from "@/lib/export";
import { buildStaffAttendance, staffAttendanceColumns, staffAttendanceDetails } from "@/lib/staff/attendance";
import type { StaffVM } from "@/lib/validators/academics";

const staff = (over: Partial<StaffVM> & { id: string }): StaffVM => ({
  first_name: "Kofi",
  last_name: over.id,
  email: "x@school.test",
  phone: null,
  staff_no: `S-${over.id}`,
  role: "teacher",
  position: null,
  department: null,
  gender: null,
  date_of_birth: null,
  hire_date: null,
  qualification: null,
  is_active: true,
  class_count: 0,
  subject_count: 0,
  portal_status: "active",
  ...over,
});

// Four school days, taken from whoever scanned: a had all four, b three, nobody scanned the 5th.
const presence = [
  ...["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08"].map((date) => ({ date, staff_id: "a" })),
  ...["2026-10-05", "2026-10-06", "2026-10-08"].map((date) => ({ date, staff_id: "b" })),
];

describe("buildStaffAttendance", () => {
  const linked = new Set(["a", "b", "c"]);

  it("counts a day anyone scanned as a school day, and a missed one as absent", () => {
    const rows = buildStaffAttendance([staff({ id: "a" }), staff({ id: "b" })], linked, presence);
    expect(rows.find((r) => r.staff_id === "a")).toMatchObject({ present: 4, absent: 0, marked: 4, pct: 100 });
    expect(rows.find((r) => r.staff_id === "b")).toMatchObject({ present: 3, absent: 1, marked: 4, pct: 75 });
  });

  it("does not count days before someone was hired", () => {
    const [b] = buildStaffAttendance([staff({ id: "b", hire_date: "2026-10-07" })], linked, presence);
    expect(b).toMatchObject({ present: 1, absent: 1, marked: 2, pct: 50 });
  });

  it("lists staff with no device number without figures rather than 0%", () => {
    const [d] = buildStaffAttendance([staff({ id: "d" })], linked, presence);
    expect(d).toMatchObject({ tracked: false, present: 0, absent: 0, marked: 0, pct: null });
  });

  it("leaves out inactive staff, and orders by name", () => {
    const rows = buildStaffAttendance(
      [staff({ id: "b", first_name: "Zed" }), staff({ id: "a", first_name: "Abena" }), staff({ id: "c", is_active: false })],
      linked,
      presence,
    );
    expect(rows.map((r) => r.staff_id)).toEqual(["a", "b"]);
  });

  it("has no rate when nobody scanned in the period", () => {
    const [a] = buildStaffAttendance([staff({ id: "a" })], linked, []);
    expect(a).toMatchObject({ tracked: true, marked: 0, pct: null });
  });
});

describe("staff attendance export", () => {
  const linked = new Set(["a"]);
  const rows = buildStaffAttendance(
    [staff({ id: "a", role: "non_teaching" }), staff({ id: "z" })],
    linked,
    presence,
  );

  it("writes counts and blanks in the spreadsheet, and names the unmeasured on paper", () => {
    const csv = columnsToCsv(staffAttendanceColumns, rows);
    expect(csv).toContain("S-a,Kofi a,Non-teaching,4,0,4,100");
    expect(csv).toContain("S-z,Kofi z,Teacher,,,,");
    expect(pdfRows(staffAttendanceColumns, rows)[1]!.at(-1)).toBe("No device number");
  });

  it("summarises the measured staff and says how many are not measured", () => {
    expect(staffAttendanceDetails(["Term 1"], rows)).toEqual([
      "Term 1",
      "2 staff",
      "1 with no device number",
      "Staff attendance 100%",
    ]);
  });
});
