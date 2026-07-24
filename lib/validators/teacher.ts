import { z } from "zod";
import { termVM } from "./academics";

export const myClassVM = z.object({
  id: z.string(),
  name: z.string(),
  level: z.string(),
  isClassTeacher: z.boolean(),
  studentCount: z.number(),
});
export type MyClassVM = z.infer<typeof myClassVM>;

export const mySubjectVM = z.object({
  id: z.string(),
  name: z.string(),
  classCount: z.number(), // how many of MY classes cover this subject
});
export type MySubjectVM = z.infer<typeof mySubjectVM>;

export const teacherActivityVM = z.object({
  id: z.string(),
  description: z.string(),
  at: z.string(),
});
export type TeacherActivityVM = z.infer<typeof teacherActivityVM>;

export const teacherDashboardVM = z.object({
  totals: z.object({
    classes: z.number(),
    subjects: z.number(),
    students: z.number(),
    attendanceRate: z.number().nullable(), // null until M5 Slice 2 wires attendance
  }),
  myClasses: z.array(myClassVM),
  mySubjects: z.array(mySubjectVM),
  activeTerm: termVM.nullable(),
  recentActivities: z.array(teacherActivityVM),
});
export type TeacherDashboardVM = z.infer<typeof teacherDashboardVM>;
