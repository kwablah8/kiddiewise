import { z } from "zod";

/**
 * The pupil's daily report (SNAB "Child's Daily Report" form, migration 0026).
 *
 * Two sections with two authors: the parent's morning report and the teacher's day report. Each
 * is one row per (student, date) in its own table — see the migration for why they are split.
 * Every field is nullable on purpose: this is a paper form transcribed, and half-filled is a
 * valid state at any point of the day. "Not answered" must stay distinguishable from "No".
 */

export const dailySleep = z.enum(["good", "ok", "not_well"]);
export const dailyChildMood = z.enum(["happy", "funny", "other"]);
export const dailyPortion = z.enum(["all", "some", "none"]);
export const dailyLessonMood = z.enum(["attentive", "fidgeting", "unwell"]);
export const dailyPlayMood = z.enum(["mingled", "did_not_mingle", "unwell"]);

export const DAILY_SLEEP_LABEL: Record<z.infer<typeof dailySleep>, string> = {
  good: "Good", ok: "Ok", not_well: "Not well",
};
export const DAILY_CHILD_MOOD_LABEL: Record<z.infer<typeof dailyChildMood>, string> = {
  happy: "Happy", funny: "Funny", other: "Other",
};
export const DAILY_PORTION_LABEL: Record<z.infer<typeof dailyPortion>, string> = {
  all: "All", some: "Some", none: "None",
};
export const DAILY_LESSON_MOOD_LABEL: Record<z.infer<typeof dailyLessonMood>, string> = {
  attentive: "Attentive", fidgeting: "Fidgeting", unwell: "Unwell",
};
export const DAILY_PLAY_MOOD_LABEL: Record<z.infer<typeof dailyPlayMood>, string> = {
  mingled: "Mingled", did_not_mingle: "Did not mingle", unwell: "Unwell",
};

/** The form's fixed "Today's activities" vocabulary. */
export const dailyActivity = z.enum([
  "music_rhymes_songs",
  "reading_books",
  "literacy",
  "physical_activity",
  "montessori",
  "numeracy",
  "science",
  "other",
]);
export type DailyActivity = z.infer<typeof dailyActivity>;
export const DAILY_ACTIVITY_LABEL: Record<DailyActivity, string> = {
  music_rhymes_songs: "Music / Rhymes & Songs",
  reading_books: "Reading / Use of Books",
  literacy: "Literacy",
  physical_activity: "Physical Activity",
  montessori: "Montessori Activity",
  numeracy: "Numeracy",
  science: "Science",
  other: "Other",
};

export const toiletingEntry = z.object({
  time: z.string(),
  wet: z.boolean(),
  dry: z.boolean(),
  description: z.string(),
});
export type ToiletingEntry = z.infer<typeof toiletingEntry>;

// ---- write contracts --------------------------------------------------------

export const parentDailyReportSchema = z.object({
  student_id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  slept: dailySleep.nullable(),
  seems: dailyChildMood.nullable(),
  comments: z.string().nullable(),
  ate_before_school: z.boolean().nullable(),
  feeding_time: z.string().nullable(),
  food: z.string().nullable(),
  portion: z.string().nullable(),
  had_medication: z.boolean().nullable(),
  medication_details: z.string().nullable(),
  medication_reason: z.string().nullable(),
  special_requests: z.string().nullable(),
  pickup_info: z.string().nullable(),
  parent_comments: z.string().nullable(),
});
export type ParentDailyReportInput = z.infer<typeof parentDailyReportSchema>;

export const teacherDailyReportSchema = z.object({
  student_id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  // A creche day tops out at a handful of changes; 12 is a generous ceiling, not a target.
  toileting: z.array(toiletingEntry).max(12),
  nap_start: z.string().nullable(),
  nap_wake: z.string().nullable(),
  activities: z.array(dailyActivity),
  breakfast: dailyPortion.nullable(),
  lunch: dailyPortion.nullable(),
  snack: dailyPortion.nullable(),
  medication_given: z.string().nullable(),
  mood_lessons: dailyLessonMood.nullable(),
  mood_play: dailyPlayMood.nullable(),
  teacher_comments: z.string().nullable(),
});
export type TeacherDailyReportInput = z.infer<typeof teacherDailyReportSchema>;

// ---- view-models ------------------------------------------------------------

export const parentDailySectionVM = parentDailyReportSchema
  .omit({ student_id: true, date: true })
  .extend({ updated_at: z.string() });
export type ParentDailySectionVM = z.infer<typeof parentDailySectionVM>;

export const teacherDailySectionVM = teacherDailyReportSchema
  .omit({ student_id: true, date: true })
  .extend({ updated_at: z.string() });
export type TeacherDailySectionVM = z.infer<typeof teacherDailySectionVM>;

/** One child's report for one day: either side may not exist yet. */
export interface DailyReportVM {
  student_id: string;
  date: string;
  parent: ParentDailySectionVM | null;
  teacher: TeacherDailySectionVM | null;
}

/** One roster row on the teacher's daily-report screen. */
export interface DailyStatusRowVM {
  student_id: string;
  student_name: string;
  admission_no: string;
  parent_submitted: boolean;
  teacher_submitted: boolean;
}
