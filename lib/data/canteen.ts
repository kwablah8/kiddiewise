import { db, unwrapList } from "./_client";
import { WEEKDAY_ORDER, type CanteenMenuItemVM } from "@/lib/validators/canteen";

const SELECT = "id, day_of_week, description, is_published, published_at";

function byWeekday(a: CanteenMenuItemVM, b: CanteenMenuItemVM): number {
  return WEEKDAY_ORDER.indexOf(a.day_of_week) - WEEKDAY_ORDER.indexOf(b.day_of_week);
}

/** The admin's full view: every day that has an item, draft or published. */
export async function getCanteenMenu(): Promise<CanteenMenuItemVM[]> {
  const rows = unwrapList(await db().from("canteen_menu_items").select(SELECT), "canteen menu");
  return rows.sort(byWeekday);
}

/**
 * The parent's view. RLS (cmi_parent_select) already confines this to published rows, no filter
 * is applied here on purpose, same reasoning as listLessonNotes: a WHERE that duplicated the
 * policy would silently drift from it the next time one changes.
 */
export async function getPublishedCanteenMenu(): Promise<CanteenMenuItemVM[]> {
  const rows = unwrapList(await db().from("canteen_menu_items").select(SELECT), "canteen menu");
  return rows.sort(byWeekday);
}
