import { db, unwrapList } from "./_client";
import type { PeriodVM, TimetableEntryVM } from "@/lib/validators/timetable";

export async function listPeriods(): Promise<PeriodVM[]> {
  const rows = unwrapList(
    await db().from("periods").select("id, name, start_time, end_time, ordinal, is_break").order("ordinal"),
    "periods",
  );
  return rows;
}

interface EntryRow {
  id: string;
  class_id: string;
  day_of_week: TimetableEntryVM["day_of_week"];
  period_id: string;
  subject_id: string;
  subjects: { name: string } | null;
}

/**
 * One class's full grid. Two queries rather than one: timetable_entries has no direct FK to
 * class_subjects (the relationship is the compound (class_id, subject_id) pair, not a single
 * column PostgREST can embed), so the teacher per subject is looked up separately and merged here.
 */
export async function getClassTimetable(classId: string): Promise<TimetableEntryVM[]> {
  const [entriesRes, assignmentsRes] = await Promise.all([
    db()
      .from("timetable_entries")
      .select("id, class_id, day_of_week, period_id, subject_id, subjects(name)")
      .eq("class_id", classId),
    db()
      .from("class_subjects")
      .select("subject_id, teacher:profiles!class_subjects_teacher_id_fkey(first_name, last_name)")
      .eq("class_id", classId),
  ]);

  const entries = unwrapList<EntryRow>(entriesRes, "timetable entries");
  const assignments = unwrapList(assignmentsRes, "class subjects");
  const teacherBySubject = new Map(
    assignments.map((a) => [
      a.subject_id,
      a.teacher ? `${a.teacher.first_name} ${a.teacher.last_name}` : null,
    ]),
  );

  return entries.map((e) => ({
    id: e.id,
    class_id: e.class_id,
    day_of_week: e.day_of_week,
    period_id: e.period_id,
    subject_id: e.subject_id,
    subject_name: e.subjects?.name ?? "",
    teacher_name: teacherBySubject.get(e.subject_id) ?? null,
  }));
}
