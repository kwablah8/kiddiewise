/**
 * activity_log powers two feeds: the admin dashboard's "Recent Activities" (school-wide) and the
 * teacher dashboard's own recent actions. 0010 gave every role self-insert (`al_insert_self`) but
 * only admins a SELECT policy, so a teacher's own feed read silently returned nothing. 0027 adds
 * the self-read; these tests pin both directions.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { seedTwoSchools, signInAs, type Seeded } from "./helpers";

let s: Seeded;

beforeAll(async () => {
  s = await seedTwoSchools();
});

describe("activity_log access", () => {
  it("a teacher logs their own action and can read it back", async () => {
    const teacher = await signInAs(s.teacherAEmail);

    const { error } = await teacher.from("activity_log").insert({
      school_id: s.schoolA,
      actor_id: s.teacherA,
      action: "marked attendance for Basic 1",
      entity_type: "attendance",
    });
    expect(error).toBeNull();

    const { data } = await teacher
      .from("activity_log")
      .select("action")
      .eq("actor_id", s.teacherA);
    expect(data?.length).toBeGreaterThan(0);
  });

  it("a teacher CANNOT log an action as someone else", async () => {
    const teacher = await signInAs(s.teacherAEmail);
    const { error } = await teacher.from("activity_log").insert({
      school_id: s.schoolA,
      actor_id: s.adminA, // forged actor
      action: "recorded a fee payment",
      entity_type: "payment",
    });
    expect(error).not.toBeNull();
  });

  it("the admin reads the school-wide feed", async () => {
    const admin = await signInAs(s.adminAEmail);
    const { data } = await admin.from("activity_log").select("action, actor_id");
    expect(data?.some((r) => r.actor_id === s.teacherA)).toBe(true);
  });
});
