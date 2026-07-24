import { describe, expect, it } from "vitest";
import { deriveTeacherDashboard } from "@/lib/teacher";
import type { TermVM } from "@/lib/validators/academics";

const classes = [
  { id: "cls-1", name: "Basic 1", level: "Primary", class_teacher_id: "stf-01" },
  { id: "cls-3", name: "Basic 3", level: "Primary", class_teacher_id: "stf-03" },
  { id: "cls-5", name: "JHS 2", level: "JHS", class_teacher_id: null },
  { id: "cls-2", name: "Basic 2", level: "Primary", class_teacher_id: "stf-02" },
];
const assignments = [
  { class_id: "cls-1", subject_id: "sub-01", teacher_id: "stf-01" },
  { class_id: "cls-1", subject_id: "sub-02", teacher_id: "stf-01" },
  { class_id: "cls-3", subject_id: "sub-01", teacher_id: "stf-01" },
  { class_id: "cls-5", subject_id: "sub-01", teacher_id: "stf-01" },
  { class_id: "cls-2", subject_id: "sub-01", teacher_id: "stf-02" }, // another teacher
];
const subjects = [
  { id: "sub-01", name: "Mathematics" },
  { id: "sub-02", name: "English Language" },
  { id: "sub-03", name: "Integrated Science" },
];
// cls-1: 6, cls-3: 4, cls-5: 4, cls-2: 3
const students = [
  ...Array.from({ length: 6 }, () => ({ class_id: "cls-1" })),
  ...Array.from({ length: 4 }, () => ({ class_id: "cls-3" })),
  ...Array.from({ length: 4 }, () => ({ class_id: "cls-5" })),
  ...Array.from({ length: 3 }, () => ({ class_id: "cls-2" })),
];
const activeTerm: TermVM = {
  id: "trm-3", academic_year_id: "ay-1", name: "Third Term",
  ordinal: 3, start_date: "2026-04-20", end_date: "2026-07-31", is_active: true,
};

describe("deriveTeacherDashboard", () => {
  it("unions class-teacher and subject-assignment classes for stf-01", () => {
    const vm = deriveTeacherDashboard({ teacherId: "stf-01", classes, assignments, subjects, students, activeTerm });
    expect(vm.totals.classes).toBe(3);
    expect(vm.myClasses.map((c) => c.id)).toEqual(["cls-1", "cls-3", "cls-5"]); // classes-array order
    const basic1 = vm.myClasses.find((c) => c.id === "cls-1");
    expect(basic1?.isClassTeacher).toBe(true);
    expect(basic1?.studentCount).toBe(6);
    expect(vm.myClasses.find((c) => c.id === "cls-3")?.isClassTeacher).toBe(false);
  });
  it("counts distinct subjects with per-teacher class coverage", () => {
    const vm = deriveTeacherDashboard({ teacherId: "stf-01", classes, assignments, subjects, students, activeTerm });
    expect(vm.totals.subjects).toBe(2);
    expect(vm.mySubjects.find((s) => s.id === "sub-01")?.classCount).toBe(3); // cls-1, cls-3, cls-5
    expect(vm.mySubjects.find((s) => s.id === "sub-02")?.classCount).toBe(1); // cls-1
  });
  it("totals students across my classes and leaves attendance null", () => {
    const vm = deriveTeacherDashboard({ teacherId: "stf-01", classes, assignments, subjects, students, activeTerm });
    expect(vm.totals.students).toBe(14); // 6 + 4 + 4
    expect(vm.totals.attendanceRate).toBeNull();
    expect(vm.recentActivities).toEqual([]);
    expect(vm.activeTerm?.name).toBe("Third Term");
  });
  it("returns an all-empty dashboard for a teacher with no assignments", () => {
    const vm = deriveTeacherDashboard({ teacherId: "stf-99", classes, assignments, subjects, students, activeTerm: null });
    expect(vm.totals).toEqual({ classes: 0, subjects: 0, students: 0, attendanceRate: null });
    expect(vm.myClasses).toEqual([]);
    expect(vm.mySubjects).toEqual([]);
    expect(vm.activeTerm).toBeNull();
  });
});
