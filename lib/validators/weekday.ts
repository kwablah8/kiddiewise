import { z } from "zod";

/**
 * The school week (Monday-Friday). Backs the Postgres `weekday` enum (migration 0039), shared by
 * canteen_menu_items and timetable_entries — pulled out here once a second feature needed it,
 * rather than each redefining its own copy that could drift apart.
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
