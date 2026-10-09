import { z } from "zod";

export const attendanceStatusSchema = z.enum(["present", "absent", "late"]);
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;

export const rosterEntryVM = z.object({
  student_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  admission_no: z.string(),
  status: attendanceStatusSchema.nullable(), // null = unmarked
  // When the student scanned in at the gate that day, if they did. Evidence beside the mark, not
  // the mark itself: the teacher can still change it.
  scanned_at: z.string().nullable(),
});
export type RosterEntryVM = z.infer<typeof rosterEntryVM>;

export const attendanceRosterVM = z.object({
  class_id: z.string(),
  date: z.string(),
  entries: z.array(rosterEntryVM),
});
export type AttendanceRosterVM = z.infer<typeof attendanceRosterVM>;

export const saveAttendanceSchema = z.object({
  class_id: z.string().min(1),
  date: z.string().min(1),
  entries: z
    .array(z.object({ student_id: z.string().min(1), status: attendanceStatusSchema }))
    .min(1, "Mark at least one student"),
});
export type SaveAttendanceInput = z.infer<typeof saveAttendanceSchema>;
