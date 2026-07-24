import type { TermVM } from "@/lib/validators/academics";
import type { MyClassVM, MySubjectVM, TeacherDashboardVM } from "@/lib/validators/teacher";

export interface ClassInput {
  id: string;
  name: string;
  level: string;
  class_teacher_id: string | null;
}
export interface AssignmentInput {
  class_id: string;
  subject_id: string;
  teacher_id: string | null;
}
export interface SubjectInput {
  id: string;
  name: string;
}
export interface StudentInput {
  class_id: string | null; // null = not currently enrolled in a class
}

/**
 * Derive a teacher's dashboard from academic data. "My classes" = classes I'm the class teacher of ∪
 * classes I teach a subject in (same union as lib/data/academics.ts#toStaffVM). Read-only this slice:
 * attendanceRate is null and recentActivities is empty until M5 Slices 2–3.
 */
export function deriveTeacherDashboard(params: {
  teacherId: string;
  classes: ClassInput[];
  assignments: AssignmentInput[];
  subjects: SubjectInput[];
  students: StudentInput[];
  activeTerm: TermVM | null;
}): TeacherDashboardVM {
  const { teacherId, classes, assignments, subjects, students, activeTerm } = params;

  const myAssignments = assignments.filter((a) => a.teacher_id === teacherId);

  const myClassIds = new Set<string>();
  for (const c of classes) if (c.class_teacher_id === teacherId) myClassIds.add(c.id);
  for (const a of myAssignments) myClassIds.add(a.class_id);

  const studentCountByClass = new Map<string, number>();
  for (const s of students) {
    if (s.class_id !== null && myClassIds.has(s.class_id)) {
      studentCountByClass.set(s.class_id, (studentCountByClass.get(s.class_id) ?? 0) + 1);
    }
  }

  const myClasses: MyClassVM[] = classes
    .filter((c) => myClassIds.has(c.id))
    .map((c) => ({
      id: c.id,
      name: c.name,
      level: c.level,
      isClassTeacher: c.class_teacher_id === teacherId,
      studentCount: studentCountByClass.get(c.id) ?? 0,
    }));

  const myClassesBySubject = new Map<string, Set<string>>();
  for (const a of myAssignments) {
    const set = myClassesBySubject.get(a.subject_id) ?? new Set<string>();
    set.add(a.class_id);
    myClassesBySubject.set(a.subject_id, set);
  }
  const mySubjects: MySubjectVM[] = subjects.flatMap((s) => {
    const set = myClassesBySubject.get(s.id);
    return set ? [{ id: s.id, name: s.name, classCount: set.size }] : [];
  });

  const totalStudents = myClasses.reduce((sum, c) => sum + c.studentCount, 0);

  return {
    totals: {
      classes: myClasses.length,
      subjects: mySubjects.length,
      students: totalStudents,
      attendanceRate: null,
    },
    myClasses,
    mySubjects,
    activeTerm,
    recentActivities: [],
  };
}
