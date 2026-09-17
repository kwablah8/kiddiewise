import { db } from "./_client";
import type { Database } from "@/lib/supabase/types";

/** One line of "here's what goes with them" shown before an irreversible delete. */
export interface DeletionImpact {
  label: string;
  count: number;
}

type TableName = keyof Database["public"]["Tables"];

async function countWhere(table: TableName, column: string, value: string): Promise<number> {
  const { count } = await db()
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, value);
  return count ?? 0;
}

/**
 * What a staff deletion takes with it. Every one of these is `on delete set null` at the database
 * level, so nothing here BLOCKS the delete (see lib/actions/academics.ts#deleteStaff), it only
 * informs the admin: proceeding strips this person's name off everything they authored.
 */
export async function getStaffDeletionImpact(id: string): Promise<DeletionImpact[]> {
  const [classes, assignments, attendance, assessments, results, payments, announcements, events] =
    await Promise.all([
      countWhere("classes", "class_teacher_id", id),
      countWhere("class_subjects", "teacher_id", id),
      countWhere("attendance", "marked_by", id),
      countWhere("assessments", "created_by", id),
      countWhere("results", "entered_by", id),
      countWhere("payments", "recorded_by", id),
      countWhere("announcements", "created_by", id),
      countWhere("events", "created_by", id),
    ]);
  return [
    { label: "classes they lead", count: classes },
    { label: "subject assignments", count: assignments },
    { label: "attendance records they marked", count: attendance },
    { label: "assessments they created", count: assessments },
    { label: "scores they entered", count: results },
    { label: "payments they recorded", count: payments },
    { label: "announcements they published", count: announcements },
    { label: "events they published", count: events },
  ].filter((x) => x.count > 0);
}

/**
 * What a student deletion takes with it. Unlike staff, these all `on delete cascade`, so this is
 * not informational trivia, it is the actual list of rows that disappear: attendance, scores,
 * invoices, payments (real money), terminal reports and guardian links, permanently.
 */
export async function getStudentDeletionImpact(id: string): Promise<DeletionImpact[]> {
  const [attendance, results, invoices, payments, reports, guardians] = await Promise.all([
    countWhere("attendance", "student_id", id),
    countWhere("results", "student_id", id),
    countWhere("invoices", "student_id", id),
    countWhere("payments", "student_id", id),
    countWhere("terminal_reports", "student_id", id),
    countWhere("student_guardians", "student_id", id),
  ]);
  return [
    { label: "attendance records", count: attendance },
    { label: "scores on record", count: results },
    { label: "invoices", count: invoices },
    { label: "recorded payments", count: payments },
    { label: "terminal reports", count: reports },
    { label: "guardian links", count: guardians },
  ].filter((x) => x.count > 0);
}

/**
 * What a parent deletion takes with it. `student_guardians` cascades (the LINK, not the child, see
 * migration 0005), so a linked student stays in the system with one fewer guardian.
 */
export async function getParentDeletionImpact(id: string): Promise<DeletionImpact[]> {
  const [children, dailyReports] = await Promise.all([
    countWhere("student_guardians", "parent_profile_id", id),
    countWhere("daily_reports_parent", "created_by", id),
  ]);
  return [
    { label: "linked children (the guardian link only, their record stays)", count: children },
    { label: "daily report entries they submitted", count: dailyReports },
  ].filter((x) => x.count > 0);
}
