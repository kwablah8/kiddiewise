import { z } from "zod";
import { weekday, WEEKDAY_ORDER, WEEKDAY_LABEL, type Weekday } from "./weekday";

export { WEEKDAY_ORDER, WEEKDAY_LABEL, type Weekday };

/**
 * The school's shared period structure (migration 0041): defined once, reused by every class's
 * timetable — the same "define once, reuse everywhere" shape as assessment types and grade bands.
 */
export const periodVM = z.object({
  id: z.string(),
  name: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  ordinal: z.number(),
  is_break: z.boolean(),
});
export type PeriodVM = z.infer<typeof periodVM>;

// Native time input yields "HH:MM"; the column is `time`, which Postgres accepts directly.
const timeOfDay = z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM");

export const periodCreateSchema = z
  .object({
    name: z.string().trim().min(1, "Required").max(50, "Keep this under 50 characters"),
    start_time: timeOfDay,
    end_time: timeOfDay,
    ordinal: z.coerce.number().int().positive("Must be at least 1"),
    is_break: z.boolean().default(false),
  })
  .refine((v) => v.start_time < v.end_time, {
    message: "End time must be after start time",
    path: ["end_time"],
  });
export type PeriodCreateInput = z.infer<typeof periodCreateSchema>;

export const periodUpdateSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1, "Required").max(50, "Keep this under 50 characters"),
    start_time: timeOfDay,
    end_time: timeOfDay,
    ordinal: z.coerce.number().int().positive("Must be at least 1"),
    is_break: z.boolean(),
  })
  .refine((v) => v.start_time < v.end_time, {
    message: "End time must be after start time",
    path: ["end_time"],
  });
export type PeriodUpdateInput = z.infer<typeof periodUpdateSchema>;

export const periodIdSchema = z.object({ id: z.string().min(1) });
export type PeriodIdInput = z.infer<typeof periodIdSchema>;

/**
 * One filled cell in a class's timetable grid. `teacher_name` is derived by joining
 * class_subjects, not stored, the teacher for a (class, subject) pair is that table's fact, never
 * duplicated onto this row (see migration 0041's comment) — null means the subject was scheduled
 * before anyone was assigned to teach it in this class.
 */
export const timetableEntryVM = z.object({
  id: z.string(),
  class_id: z.string(),
  day_of_week: weekday,
  period_id: z.string(),
  subject_id: z.string(),
  subject_name: z.string(),
  teacher_name: z.string().nullable(),
});
export type TimetableEntryVM = z.infer<typeof timetableEntryVM>;

/**
 * The whole grid for one class saved in one submit, same "one form, one save" shape the canteen
 * menu settled on: every rendered cell is represented, `subject_id: null` clears that slot rather
 * than needing a separate delete call.
 */
export const timetableCellSchema = z.object({
  day_of_week: weekday,
  period_id: z.string().min(1),
  subject_id: z.string().min(1).nullable(),
});
export type TimetableCellInput = z.infer<typeof timetableCellSchema>;

export const saveClassTimetableSchema = z.object({
  class_id: z.string().min(1),
  cells: z.array(timetableCellSchema),
});
export type SaveClassTimetableInput = z.infer<typeof saveClassTimetableSchema>;
