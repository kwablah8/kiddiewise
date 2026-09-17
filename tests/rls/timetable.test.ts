/**
 * periods / timetable_entries (migration 0041): admin writes, any authenticated same-school user
 * reads — same shape as classes/subjects/class_subjects (migration 0006), which already treat a
 * school's structure as non-sensitive within the tenant. Cross-school isolation is covered
 * generically elsewhere for that same reason; what's worth asserting here is the read/write split
 * itself and that a teacher (not just a parent) can read without being able to write.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { admin, seedTwoSchools, signInAs, type Seeded } from "./helpers";

let s: Seeded;
let periodId: string;

beforeAll(async () => {
  s = await seedTwoSchools();
  const { data, error } = await admin()
    .from("periods")
    .insert({
      school_id: s.schoolA,
      name: "Period 1",
      start_time: "08:00",
      end_time: "08:40",
      ordinal: 1,
    })
    .select("id")
    .single();
  if (error) throw new Error(`periods seed: ${error.message}`);
  periodId = data!.id;
});

describe("periods", () => {
  it("any same-school user reads periods (teacher)", async () => {
    const teacher = await signInAs(s.teacherAEmail);
    const { data, error } = await teacher.from("periods").select("id").eq("id", periodId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("teacher CANNOT write a period", async () => {
    const teacher = await signInAs(s.teacherAEmail);
    const { error } = await teacher
      .from("periods")
      .insert({ school_id: s.schoolA, name: "Period 2", start_time: "08:40", end_time: "09:20", ordinal: 2 });
    expect(error).not.toBeNull();
  });

  it("admin writes a period", async () => {
    const adminClient = await signInAs(s.adminAEmail);
    const { error } = await adminClient
      .from("periods")
      .insert({ school_id: s.schoolA, name: "Break", start_time: "10:00", end_time: "10:20", ordinal: 3, is_break: true });
    expect(error).toBeNull();
  });
});

describe("timetable_entries", () => {
  it("admin assigns a subject to a class-day-period", async () => {
    const adminClient = await signInAs(s.adminAEmail);
    const { error } = await adminClient.from("timetable_entries").insert({
      school_id: s.schoolA,
      class_id: s.classA_taught,
      day_of_week: "monday",
      period_id: periodId,
      subject_id: s.subjectA,
    });
    expect(error).toBeNull();
  });

  it("parent (of a student in that class) reads the entry", async () => {
    const parent = await signInAs(s.parentAEmail);
    const { data, error } = await parent
      .from("timetable_entries")
      .select("id")
      .eq("class_id", s.classA_taught)
      .eq("period_id", periodId);
    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThan(0);
  });

  it("teacher CANNOT write a timetable entry", async () => {
    const teacher = await signInAs(s.teacherAEmail);
    const { error } = await teacher.from("timetable_entries").insert({
      school_id: s.schoolA,
      class_id: s.classA_taught,
      day_of_week: "tuesday",
      period_id: periodId,
      subject_id: s.subjectA,
    });
    expect(error).not.toBeNull();
  });
});
