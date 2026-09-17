/**
 * canteen_menu_items (migration 0039): only a school admin writes; a parent reads only published
 * rows in their own school. A teacher has no policy at all here — cmi_parent_select checks
 * current_role() = 'parent' specifically, not "any same-school authenticated user".
 */
import { beforeAll, describe, expect, it } from "vitest";
import { admin, seedTwoSchools, signInAs, type Seeded } from "./helpers";

let s: Seeded;

async function seedItem(day: string, published: boolean): Promise<string> {
  const { data, error } = await admin()
    .from("canteen_menu_items")
    .insert({
      school_id: s.schoolA,
      day_of_week: day,
      description: "Jollof rice, chicken, coleslaw",
      is_published: published,
      published_at: published ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (error) throw new Error(`canteen_menu_items seed: ${error.message}`);
  return data!.id;
}

beforeAll(async () => {
  s = await seedTwoSchools();
});

describe("admin writes to canteen_menu_items", () => {
  it("upserts a day's item in their own school", async () => {
    const adminClient = await signInAs(s.adminAEmail);
    const { error } = await adminClient
      .from("canteen_menu_items")
      .upsert(
        { school_id: s.schoolA, day_of_week: "monday", description: "Banku and okra soup" },
        { onConflict: "school_id,day_of_week" },
      );
    expect(error).toBeNull();
  });

  it("teacher CANNOT write a menu item", async () => {
    const teacher = await signInAs(s.teacherAEmail);
    const { error } = await teacher
      .from("canteen_menu_items")
      .insert({ school_id: s.schoolA, day_of_week: "tuesday", description: "Waakye" });
    expect(error).not.toBeNull();
  });
});

describe("publish gate", () => {
  it("parent CANNOT see an unpublished item", async () => {
    await seedItem("wednesday", false);
    const parent = await signInAs(s.parentAEmail);
    const { data, error } = await parent.from("canteen_menu_items").select("id, is_published");
    expect(error).toBeNull();
    expect(data!.every((r) => r.is_published)).toBe(true);
  });

  it("parent CAN see a published item", async () => {
    const id = await seedItem("thursday", true);
    const parent = await signInAs(s.parentAEmail);
    const { data, error } = await parent.from("canteen_menu_items").select("id").eq("id", id);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("teacher CANNOT see any menu item, published or not", async () => {
    const id = await seedItem("friday", true);
    const teacher = await signInAs(s.teacherAEmail);
    const { data, error } = await teacher.from("canteen_menu_items").select("id").eq("id", id);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });
});
