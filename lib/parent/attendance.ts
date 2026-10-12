import type {
  AttendanceRecordVM,
  AttendanceStatus,
  AttendanceSummaryVM,
} from "@/lib/validators/parent";

/** Parents see two outcomes, present or absent: a late arrival is a present day. Teachers and the
 *  admin still see late; only the parent-facing view folds it away. */
export function parentStatus(status: AttendanceStatus): "present" | "absent" {
  return status === "absent" ? "absent" : "present";
}

/** Summarise a child's attendance. `pct` is the attendance rate, present days over the total
 *  recorded days, rounded to a whole percent; `null` when there are no records. Pure so it can be
 *  unit-tested and reused wherever a summary is needed. */
export function summarizeAttendance(
  records: readonly AttendanceRecordVM[],
): AttendanceSummaryVM {
  let present = 0;
  let absent = 0;
  for (const r of records) {
    if (parentStatus(r.status) === "present") present += 1;
    else absent += 1;
  }
  const total = records.length;
  const pct = total === 0 ? null : Math.round((present / total) * 100);
  return { present, absent, total, pct };
}
