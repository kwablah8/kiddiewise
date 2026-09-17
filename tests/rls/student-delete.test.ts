/**
 * students_admin_all: only a school admin may delete a student, and only within their own school.
 * Every table keyed on student_id is `on delete cascade` (migration 0005 onward), so this exercises
 * the cascade too, not just the row itself. Teachers have no delete policy on `students` at all
 * (students_teacher_read is select-only); PostgREST deletes silently affect zero rows when RLS
 * filters them out, so those cases assert the row SURVIVES rather than expecting an error.
 *
 * Staff and parent deletion (lib/actions/people.ts#deleteStaff / #deleteParent) are NOT covered
 * here: both delete through the service-role auth admin API rather than a PostgREST delete on
 * `profiles`, so there is no RLS policy governing the delete itself to test. Their tenant boundary
 * is the same RLS-scoped `profiles` select every other cross-tenant lookup in lib/actions/_server.ts
 * relies on.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { admin, seedTwoSchools, signInAs, type Seeded } from "./helpers";

let s: Seeded;

beforeAll(async () => {
  s = await seedTwoSchools();
});

describe("admin deletion of students", () => {
  it("deletes a student in their own school, cascading attendance", async () => {
    const svc = admin();
    const { data: student, error } = await svc
      .from("students")
      .insert({
        school_id: s.schoolA,
        admission_no: `DEL-${Date.now()}`,
        first_name: "Kwame",
        last_name: "Delete-Me",
        date_of_birth: "2016-01-01",
        gender: "male",
      })
      .select("id")
      .single();
    if (error) throw new Error(`student seed: ${error.message}`);
    const studentId = student!.id;

    await svc.from("attendance").insert({
      school_id: s.schoolA,
      student_id: studentId,
      class_id: s.classA_taught,
      date: "2026-09-15",
      status: "present",
      marked_by: s.teacherA,
    });

    const adminClient = await signInAs(s.adminAEmail);
    const { error: deleteError } = await adminClient.from("students").delete().eq("id", studentId);
    expect(deleteError).toBeNull();

    const { data: goneStudent } = await svc.from("students").select("id").eq("id", studentId);
    expect(goneStudent).toHaveLength(0);
    const { data: goneAttendance } = await svc
      .from("attendance")
      .select("id")
      .eq("student_id", studentId);
    expect(goneAttendance).toHaveLength(0);
  });

  it("teacher CANNOT delete a student", async () => {
    const teacher = await signInAs(s.teacherAEmail);
    const { error } = await teacher.from("students").delete().eq("id", s.studentA1);
    expect(error).toBeNull(); // RLS filters silently — no error, no effect

    const { data: survivor } = await admin().from("students").select("id").eq("id", s.studentA1);
    expect(survivor).toHaveLength(1);
  });

  it("admin CANNOT delete a student in another school", async () => {
    const svc = admin();
    const { data: studentB, error } = await svc
      .from("students")
      .insert({
        school_id: s.schoolB,
        admission_no: `B-DEL-${Date.now()}`,
        first_name: "Ama",
        last_name: "OtherSchool",
        date_of_birth: "2016-02-02",
        gender: "female",
      })
      .select("id")
      .single();
    if (error) throw new Error(`student seed: ${error.message}`);

    const adminA = await signInAs(s.adminAEmail);
    const { error: deleteError } = await adminA.from("students").delete().eq("id", studentB!.id);
    expect(deleteError).toBeNull();

    const { data: survivor } = await svc.from("students").select("id").eq("id", studentB!.id);
    expect(survivor).toHaveLength(1);
  });
});
