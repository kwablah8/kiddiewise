import { describe, expect, it } from "vitest";
import { computeStudentStats, studentsToCsv } from "@/lib/students";
import type { StudentListItemVM } from "@/lib/validators/people";

function stu(over: Partial<StudentListItemVM>): StudentListItemVM {
  return {
    id: "s", admission_no: "KID-0001", first_name: "A", last_name: "B",
    gender: "male", enrollment_status: "active", photo_url: null,
    class_id: "c1", class_name: "Basic 1", guardian_names: [],
    ...over,
  };
}

describe("computeStudentStats", () => {
  it("counts total, active, class-assigned, and gender split", () => {
    const list = [
      stu({ id: "1", gender: "male", enrollment_status: "active", class_id: "c1" }),
      stu({ id: "2", gender: "female", enrollment_status: "active", class_id: null }),
      stu({ id: "3", gender: "female", enrollment_status: "withdrawn", class_id: "c2" }),
      stu({ id: "4", gender: "other", enrollment_status: "active", class_id: "c1" }),
    ];
    expect(computeStudentStats(list)).toEqual({ total: 4, active: 3, assigned: 3, male: 1, female: 2 });
  });
  it("handles an empty roster", () => {
    expect(computeStudentStats([])).toEqual({ total: 0, active: 0, assigned: 0, male: 0, female: 0 });
  });
});

describe("studentsToCsv", () => {
  it("writes a header row plus one row per student", () => {
    const list = [
      stu({ id: "1", admission_no: "KID-0001", first_name: "Ama", last_name: "Owusu", class_name: "Basic 1", guardian_names: ["Kofi Owusu"] }),
      stu({ id: "2", admission_no: "KID-0002", first_name: "Kwame", last_name: "Boateng", class_name: null, guardian_names: [] }),
    ];
    const csv = studentsToCsv(list);
    const lines = csv.replace(/^﻿/, "").split("\r\n");
    expect(lines[0]).toBe("Admission No.,Name,Class,Gender,Status,Guardian(s)");
    expect(lines[1]).toBe("KID-0001,Ama Owusu,Basic 1,Male,Active,Kofi Owusu");
    expect(lines[2]).toBe("KID-0002,Kwame Boateng,,Male,Active,");
  });

  it("quotes a cell that contains a comma, such as multiple guardian names", () => {
    const csv = studentsToCsv([stu({ guardian_names: ["Kofi Owusu", "Ama Owusu"] })]);
    const lines = csv.replace(/^﻿/, "").split("\r\n");
    expect(lines[1]).toBe('KID-0001,A B,Basic 1,Male,Active,"Kofi Owusu, Ama Owusu"');
  });
});
