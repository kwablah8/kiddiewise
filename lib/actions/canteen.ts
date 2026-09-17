"use server";

import { attempt, type ActionResult } from "./result";
import { tenant, assertAdmin, assertOk } from "./_server";
import { canteenMenuFormSchema, WEEKDAY_ORDER, type CanteenMenuFormInput } from "@/lib/validators/canteen";

/**
 * Save the whole week in one submit. Each day is either upserted (non-empty) or removed (blank),
 * as two bulk statements rather than five per-day round trips — one save button, one write.
 *
 * `is_published` is left out of the upsert payload on purpose: Postgres upsert only touches the
 * columns it's given, so re-saving an already-published day's text does not unpublish it, only a
 * day's very first save defaults it to false.
 */
export async function saveCanteenMenu(
  input: CanteenMenuFormInput,
): Promise<ActionResult<{ ok: true }>> {
  return attempt(async () => {
    const data = canteenMenuFormSchema.parse(input);
    const ctx = await tenant();
    assertAdmin(ctx);

    const toClear = WEEKDAY_ORDER.filter((day) => data[day] === "");
    const toSave = WEEKDAY_ORDER.filter((day) => data[day] !== "");

    if (toClear.length > 0) {
      assertOk(
        await ctx.db
          .from("canteen_menu_items")
          .delete()
          .eq("school_id", ctx.schoolId)
          .in("day_of_week", toClear),
        "canteen menu",
      );
    }

    if (toSave.length > 0) {
      assertOk(
        await ctx.db.from("canteen_menu_items").upsert(
          toSave.map((day) => ({
            school_id: ctx.schoolId,
            day_of_week: day,
            description: data[day],
            created_by: ctx.profile.id,
            updated_at: new Date().toISOString(),
          })),
          { onConflict: "school_id,day_of_week" },
        ),
        "canteen menu",
      );
    }

    return { ok: true };
  });
}

/** Publishes every currently-saved day at once. Reversible — see unpublishCanteenMenu. */
export async function publishCanteenMenu(): Promise<ActionResult<{ ok: true }>> {
  return attempt(async () => {
    const ctx = await tenant();
    assertAdmin(ctx);

    assertOk(
      await ctx.db
        .from("canteen_menu_items")
        .update({ is_published: true, published_at: new Date().toISOString() })
        .eq("school_id", ctx.schoolId),
      "canteen menu",
    );
    return { ok: true };
  });
}

/** Pulls the whole menu back out of parent view without deleting any of it. */
export async function unpublishCanteenMenu(): Promise<ActionResult<{ ok: true }>> {
  return attempt(async () => {
    const ctx = await tenant();
    assertAdmin(ctx);

    assertOk(
      await ctx.db
        .from("canteen_menu_items")
        .update({ is_published: false, published_at: null })
        .eq("school_id", ctx.schoolId),
      "canteen menu",
    );
    return { ok: true };
  });
}
