import type { AttendanceRecordVM, AttendanceSummaryVM } from "@/lib/validators/parent";

/** Summarise a child's attendance. `pct` is the attendance rate, the days the child showed up
 *  (present OR late) over the total recorded days, rounded to a whole percent; `null` when there
 *  are no records. Pure so it can be unit-tested and reused wherever a summary is needed. */
export function summarizeAttendance(
  records: readonly AttendanceRecordVM[],
): AttendanceSummaryVM {
  let present = 0;
  let absent = 0;
  let late = 0;
  for (const r of records) {
    if (r.status === "present") present += 1;
    else if (r.status === "absent") absent += 1;
    else late += 1;
  }
  const total = records.length;
  const attended = present + late;
  const pct = total === 0 ? null : Math.round((attended / total) * 100);
  return { present, absent, late, total, pct };
}
