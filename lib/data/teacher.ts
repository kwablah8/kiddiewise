import { simulate } from "./_devState";
import { store } from "@/lib/mock/store";
import { deriveTeacherDashboard } from "@/lib/teacher";
import type { TeacherDashboardVM } from "@/lib/validators/teacher";

const EMPTY_DASHBOARD: TeacherDashboardVM = {
  totals: { classes: 0, subjects: 0, students: 0, attendanceRate: null },
  myClasses: [],
  mySubjects: [],
  activeTerm: null,
  recentActivities: [],
};

export function getTeacherDashboard(teacherId: string): Promise<TeacherDashboardVM> {
  const activeTerm = store.terms.find((t) => t.is_active) ?? null;
  const vm = deriveTeacherDashboard({
    teacherId,
    classes: store.classes,
    assignments: store.classSubjects,
    subjects: store.subjects,
    students: store.students,
    activeTerm: activeTerm ? { ...activeTerm } : null,
  });
  return simulate(vm, EMPTY_DASHBOARD);
}
