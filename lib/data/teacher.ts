import { db, unwrapList, unwrapMaybe } from "./_client";
import { deriveTeacherDashboard, teacherClassIds } from "@/lib/teacher";
import type { TeacherDashboardVM } from "@/lib/validators/teacher";

/**
 * The teacher's own dashboard.
 *
 * RLS already narrows `students` and `attendance` to the classes this teacher is assigned to, but
 * `classes` and `class_subjects` are readable school-wide (any staff member may see the timetable).
 * So the shape of "mine" is decided by `deriveTeacherDashboard` filtering on teacherId — RLS is the
 * boundary for the sensitive rows, the derivation is what makes the page personal.
 */
export async function getTeacherDashboard(teacherId: string): Promise<TeacherDashboardVM> {
  const [classesRes, assignmentsRes, subjectsRes, termRes] = await Promise.all([
    db().from("classes").select("id, name, level, class_teacher_id"),
    db().from("class_subjects").select("class_id, subject_id, teacher_id"),
    db().from("subjects").select("id, name"),
    db()
      .from("terms")
      .select("id, academic_year_id, name, ordinal, start_date, end_date, is_active")
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  const classes = unwrapList(classesRes, "classes");
  const assignments = unwrapList(assignmentsRes, "assignments");
  const subjects = unwrapList(subjectsRes, "subjects");
  const activeTerm = unwrapMaybe(termRes, "active term");

  const myClassIds = teacherClassIds(teacherId, classes, assignments);

  // Only fetch the dependent rows once we know which classes are the teacher's — an empty set means
  // a newly hired teacher with no assignments, and there is nothing to ask for.
  const classIdList = [...myClassIds];
  const [enrollmentsRes, attendanceRes, activityRes] = await Promise.all([
    classIdList.length
      ? db().from("enrollments").select("class_id").eq("status", "active").in("class_id", classIdList)
      : Promise.resolve({ data: [], error: null }),
    classIdList.length && activeTerm
      ? db().from("attendance").select("status").eq("term_id", activeTerm.id).in("class_id", classIdList)
      : Promise.resolve({ data: [], error: null }),
    db()
      .from("activity_log")
      .select("id, action, created_at")
      .eq("actor_id", teacherId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const enrollments = unwrapList(enrollmentsRes, "enrollments");
  const attendance = unwrapList(attendanceRes, "attendance");
  const activities = unwrapList(activityRes, "teacher activity");

  // The derivation counts students per class off `class_id`, so hand it one entry per enrollment.
  const students = enrollments.map((e) => ({ class_id: e.class_id }));

  // Attendance rate across the teacher's own classes this term. Null (not zero) when nothing has
  // been marked yet — "no register taken" and "nobody attended" are very different facts.
  const attendanceRate =
    attendance.length === 0
      ? null
      : Math.round(
          (attendance.filter((a) => a.status === "present" || a.status === "late").length /
            attendance.length) *
            100,
        );

  return deriveTeacherDashboard({
    teacherId,
    classes,
    assignments,
    subjects,
    students,
    activeTerm,
    attendanceRate,
    recentActivities: activities.map((a) => ({
      id: a.id,
      description: a.action,
      at: a.created_at,
    })),
  });
}

/** The classes this teacher may mark or grade — the class picker on attendance and grading. */
export async function listTeacherClasses(
  teacherId: string,
): Promise<{ id: string; name: string; level: string }[]> {
  const [classesRes, assignmentsRes] = await Promise.all([
    db().from("classes").select("id, name, level, class_teacher_id").order("name"),
    db().from("class_subjects").select("class_id, teacher_id"),
  ]);

  const classes = unwrapList(classesRes, "classes");
  const ids = teacherClassIds(teacherId, classes, unwrapList(assignmentsRes, "assignments"));

  return classes
    .filter((c) => ids.has(c.id))
    .map((c) => ({ id: c.id, name: c.name, level: c.level }));
}
