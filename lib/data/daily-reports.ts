import { activeYearId, db, unwrapList, unwrapMaybe } from "./_client";
import {
  toiletingEntry,
  dailyActivity,
  type DailyReportVM,
  type DailyStatusRowVM,
  type ParentDailySectionVM,
  type TeacherDailySectionVM,
} from "@/lib/validators/daily-reports";
import { z } from "zod";

/**
 * Daily reports are the JOIN of two writer-scoped tables on (student_id, date) — see migration
 * 0026. RLS decides who resolves rows at all: a parent reaches only their own children, a teacher
 * only students enrolled in classes they teach, so neither read re-checks the relationship here.
 */

// jsonb/text[] columns come back untyped; parse rather than cast so a malformed row fails loudly
// instead of rendering nonsense on a form about a child's day.
const toiletingList = z.array(toiletingEntry).catch([]);
const activityList = z.array(dailyActivity).catch([]);

const PARENT_SELECT =
  "slept, seems, comments, ate_before_school, feeding_time, food, portion, had_medication, medication_details, medication_reason, special_requests, pickup_info, parent_comments, updated_at";
const TEACHER_SELECT =
  "toileting, nap_start, nap_wake, activities, breakfast, lunch, snack, medication_given, mood_lessons, mood_play, teacher_comments, updated_at";

export async function getDailyReport(studentId: string, date: string): Promise<DailyReportVM> {
  const [parentRes, teacherRes] = await Promise.all([
    db()
      .from("daily_reports_parent")
      .select(PARENT_SELECT)
      .eq("student_id", studentId)
      .eq("date", date)
      .maybeSingle(),
    db()
      .from("daily_reports_teacher")
      .select(TEACHER_SELECT)
      .eq("student_id", studentId)
      .eq("date", date)
      .maybeSingle(),
  ]);

  const parent = unwrapMaybe(parentRes, "parent daily report");
  const teacher = unwrapMaybe(teacherRes, "teacher daily report");

  return {
    student_id: studentId,
    date,
    parent: parent ? (parent as ParentDailySectionVM) : null,
    teacher: teacher
      ? ({
          ...teacher,
          toileting: toiletingList.parse(teacher.toileting),
          activities: activityList.parse(teacher.activities),
        } as TeacherDailySectionVM)
      : null,
  };
}

/**
 * The teacher's roster for one class and day, with each child's fill state. Driven by the
 * ACTIVE year's enrolment like the attendance register — promotion leaves last year's rows in
 * place, and yesterday's cohort must not appear on today's sheet.
 */
export async function getClassDailyStatus(
  classId: string,
  date: string,
): Promise<DailyStatusRowVM[]> {
  const yearId = await activeYearId();
  let rosterQuery = db()
    .from("enrollments")
    .select("students!inner(id, first_name, last_name, admission_no)")
    .eq("class_id", classId)
    .eq("status", "active");
  if (yearId) rosterQuery = rosterQuery.eq("academic_year_id", yearId);

  const enrolled = unwrapList(await rosterQuery, "class roster");
  const students = enrolled
    .map((e) => e.students)
    .filter((s): s is NonNullable<typeof s> => s !== null);
  if (students.length === 0) return [];

  const ids = students.map((s) => s.id);
  const [parentRes, teacherRes] = await Promise.all([
    db().from("daily_reports_parent").select("student_id").eq("date", date).in("student_id", ids),
    db().from("daily_reports_teacher").select("student_id").eq("date", date).in("student_id", ids),
  ]);
  const parentSet = new Set(unwrapList(parentRes, "parent reports").map((r) => r.student_id));
  const teacherSet = new Set(unwrapList(teacherRes, "teacher reports").map((r) => r.student_id));

  return students
    .map((s) => ({
      student_id: s.id,
      student_name: `${s.first_name} ${s.last_name}`,
      admission_no: s.admission_no,
      parent_submitted: parentSet.has(s.id),
      teacher_submitted: teacherSet.has(s.id),
    }))
    .sort((a, b) => a.student_name.localeCompare(b.student_name));
}
