/**
 * Daily reports (migration 0026) are split into a parent-written and a teacher-written table
 * precisely so RLS can hold the line between the two authors, these tests are that line.
 * PostgREST rejects out-of-policy INSERTs loudly but filters out-of-policy UPDATEs silently
 * (0 rows), so negative update cases assert the row is unchanged rather than expecting an error.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { admin, seedTwoSchools, signInAs, type Seeded } from "./helpers";

let s: Seeded;

beforeAll(async () => {
  s = await seedTwoSchools();
});

const DATE = "2026-09-15";

describe("parent side of the daily report", () => {
  it("parent writes and reads their own child's morning section", async () => {
    const parent = await signInAs(s.parentAEmail);
    const { error } = await parent.from("daily_reports_parent").insert({
      school_id: s.schoolA,
      student_id: s.studentA1, // their child
      date: DATE,
      slept: "good",
      pickup_info: "3:30pm, Grandma",
    });
    expect(error).toBeNull();

    const { data } = await parent
      .from("daily_reports_parent")
      .select("slept")
      .eq("student_id", s.studentA1)
      .eq("date", DATE);
    expect(data).toHaveLength(1);
  });

  it("parent CANNOT write a report for a child that is not theirs", async () => {
    const parent = await signInAs(s.parentAEmail);
    const { error } = await parent.from("daily_reports_parent").insert({
      school_id: s.schoolA,
      student_id: s.studentA2, // not their child
      date: DATE,
      slept: "ok",
    });
    expect(error).not.toBeNull();
  });

  it("the child's teacher reads the parent section but cannot write it", async () => {
    const teacher = await signInAs(s.teacherAEmail);
    const { data } = await teacher
      .from("daily_reports_parent")
      .select("slept")
      .eq("student_id", s.studentA1)
      .eq("date", DATE);
    expect(data).toHaveLength(1); // studentA1 is in the class they teach

    const { error } = await teacher.from("daily_reports_parent").insert({
      school_id: s.schoolA,
      student_id: s.studentA1,
      date: "2026-09-16",
      slept: "good",
    });
    expect(error).not.toBeNull(); // no teacher insert policy on the parent table
  });
});

describe("teacher side of the daily report", () => {
  it("teacher writes the day section for a student in their class", async () => {
    const teacher = await signInAs(s.teacherAEmail);
    const { error } = await teacher.from("daily_reports_teacher").insert({
      school_id: s.schoolA,
      student_id: s.studentA1,
      date: DATE,
      breakfast: "all",
      mood_lessons: "attentive",
    });
    expect(error).toBeNull();
  });

  it("teacher CANNOT write for a student in a class they do not teach", async () => {
    const teacher = await signInAs(s.teacherAEmail);
    const { error } = await teacher.from("daily_reports_teacher").insert({
      school_id: s.schoolA,
      student_id: s.studentA2, // enrolled in the untaught class
      date: DATE,
      breakfast: "some",
    });
    expect(error).not.toBeNull();
  });

  it("parent reads the teacher section but cannot alter it", async () => {
    const parent = await signInAs(s.parentAEmail);
    const { data } = await parent
      .from("daily_reports_teacher")
      .select("breakfast")
      .eq("student_id", s.studentA1)
      .eq("date", DATE);
    expect(data).toHaveLength(1);
    expect(data![0]!.breakfast).toBe("all");

    // Silently filtered by RLS, assert the row survived untouched.
    await parent
      .from("daily_reports_teacher")
      .update({ breakfast: "none" })
      .eq("student_id", s.studentA1)
      .eq("date", DATE);
    const { data: after } = await admin()
      .from("daily_reports_teacher")
      .select("breakfast")
      .eq("student_id", s.studentA1)
      .eq("date", DATE);
    expect(after![0]!.breakfast).toBe("all");
  });
});
