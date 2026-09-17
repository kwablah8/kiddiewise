import { z } from "zod";

/**
 * The school's weekly canteen menu (migration 0039): one row per school day, edited in place — not
 * a dated, ever-growing list like attendance or lesson notes. `is_published` gates parent
 * visibility and is fully reversible, unlike lesson notes' one-way submit.
 */

export const weekday = z.enum(["monday", "tuesday", "wednesday", "thursday", "friday"]);
export type Weekday = z.infer<typeof weekday>;

/** Monday-first display order — the enum's own declaration order matches this, but don't rely on
 *  that implicitly elsewhere; sort against this array. */
export const WEEKDAY_ORDER: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
};

// ---- view-model ---------------------------------------------------------------

export const canteenMenuItemVM = z.object({
  id: z.string(),
  day_of_week: weekday,
  description: z.string(),
  is_published: z.boolean(),
  published_at: z.string().nullable(),
});
export type CanteenMenuItemVM = z.infer<typeof canteenMenuItemVM>;

// ---- write contract ------------------------------------------------------------

/**
 * The whole week saved in one submit, one field per day. An empty string clears that day (deletes
 * its row) rather than being rejected, leaving Wednesday blank is how a day drops off the menu —
 * there is no separate delete action to call for that.
 */
export const canteenMenuFormSchema = z.object({
  monday: z.string().trim().max(500, "Keep this under 500 characters"),
  tuesday: z.string().trim().max(500, "Keep this under 500 characters"),
  wednesday: z.string().trim().max(500, "Keep this under 500 characters"),
  thursday: z.string().trim().max(500, "Keep this under 500 characters"),
  friday: z.string().trim().max(500, "Keep this under 500 characters"),
});
export type CanteenMenuFormInput = z.infer<typeof canteenMenuFormSchema>;
