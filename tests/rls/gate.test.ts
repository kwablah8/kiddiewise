/**
 * The gate device (migration 0044): scans posted by the school computer become the register and
 * guardians' notices, and every table it writes stays inside its school and its audience.
 *
 * The ingest runs through the real route handler, with only `server-only` stubbed, so the device-key
 * check, the payload validation and the service-role writes are the production code paths.
 */
import { beforeAll, describe, expect, it, vi } from "vitest";
import { admin, seedTwoSchools, signInAs, type Seeded } from "./helpers";

vi.mock("server-only", () => ({}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/attendance-device/scans/route";
import { createHash } from "node:crypto";

const KEY = `kwd_test_${crypto.randomUUID()}`;
let s: Seeded;
let yearA: string;
let termA: string;
let today: string;

function post(scans: { user_id: string; time: string }[], key = KEY) {
  return POST(
    new NextRequest("http://localhost/api/attendance-device/scans", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ scans }),
    }),
  );
}

const attendanceOf = async (studentId: string, date: string) =>
  (await admin().from("attendance").select("status").eq("student_id", studentId).eq("date", date).maybeSingle())
    .data?.status ?? null;

beforeAll(async () => {
  s = await seedTwoSchools();
  const svc = admin();
  yearA = (await svc.from("academic_years").select("id").eq("school_id", s.schoolA).single()).data!.id;
  termA = (await svc.from("terms").select("id").eq("school_id", s.schoolA).single()).data!.id;
  await svc.from("schools").update({ active_academic_year_id: yearA, active_term_id: termA }).eq("id", s.schoolA);

  // Registered yesterday, so today's scans are acted on and last month's are not.
  const yesterday = new Date(Date.now() - 86_400_000).toISOString();
  today = new Date().toISOString().slice(0, 10);
  await svc.from("attendance_devices").insert({
    school_id: s.schoolA,
    name: "Gate",
    key_hash: createHash("sha256").update(KEY).digest("hex"),
    created_at: yesterday,
  });
  await svc.from("device_people").insert([
    { school_id: s.schoolA, device_user_id: "1001", student_id: s.studentA1 },
    { school_id: s.schoolA, device_user_id: "1002", student_id: s.studentA2 },
    { school_id: s.schoolA, device_user_id: "1", staff_id: s.teacherA },
  ]);
});

describe("the device endpoint", () => {
  it("refuses a missing or unknown key", async () => {
    expect((await post([], "")).status).toBe(401);
    expect((await post([], "kwd_not_a_real_key")).status).toBe(401);
  });

  it("refuses a malformed payload", async () => {
    const res = await post([{ user_id: "1001", time: "yesterday" }]);
    expect(res.status).toBe(400);
  });

  it("marks the register, tells the guardian, and reports unknown numbers", async () => {
    const res = await post([
      { user_id: "1001", time: `${today} 07:42:10` },
      { user_id: "1001", time: `${today} 07:43:00` },
      { user_id: "1", time: `${today} 06:55:00` },
      { user_id: "4242", time: `${today} 07:00:00` },
    ]);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: 4, unknown_user_ids: ["4242"] });

    expect(await attendanceOf(s.studentA1, today)).toBe("present");
    const { data: notices } = await admin()
      .from("parent_notifications")
      .select("parent_profile_id, event, late")
      .eq("student_id", s.studentA1)
      .eq("local_date", today);
    expect(notices).toEqual([{ parent_profile_id: s.parentA, event: "arrived", late: false }]);
  });

  it("is safe to repeat: re-sending changes nothing", async () => {
    await post([{ user_id: "1001", time: `${today} 07:42:10` }]);
    const { count } = await admin()
      .from("device_scans")
      .select("id", { count: "exact", head: true })
      .eq("school_id", s.schoolA)
      .eq("device_user_id", "1001")
      .eq("local_date", today);
    expect(count).toBe(2);
    const { data } = await admin().from("parent_notifications").select("id").eq("student_id", s.studentA1).eq("event", "arrived");
    expect(data).toHaveLength(1);
  });

  it("records leaving after the leaving time, once", async () => {
    await post([
      { user_id: "1001", time: `${today} 14:05:00` },
      { user_id: "1001", time: `${today} 14:06:00` },
    ]);
    const { data } = await admin()
      .from("parent_notifications")
      .select("occurred_at")
      .eq("student_id", s.studentA1)
      .eq("event", "left");
    expect(data).toHaveLength(1);
    expect(data![0]!.occurred_at).toBe(`${today}T14:05:00+00:00`);
  });

  it("raises an absent mark to late, but never overrules a teacher's own mark", async () => {
    const svc = admin();
    await svc.from("attendance").upsert(
      {
        school_id: s.schoolA,
        student_id: s.studentA2,
        class_id: s.classA_untaught,
        term_id: termA,
        date: today,
        status: "absent",
        marked_by: s.adminA,
      },
      { onConflict: "student_id,date" },
    );
    await post([{ user_id: "1002", time: `${today} 09:30:00` }]);
    expect(await attendanceOf(s.studentA2, today)).toBe("late");

    // A teacher corrects it to present; a later re-send must not put "late" back.
    await svc.from("attendance").update({ status: "present" }).eq("student_id", s.studentA2).eq("date", today);
    await post([{ user_id: "1002", time: `${today} 09:30:00` }]);
    expect(await attendanceOf(s.studentA2, today)).toBe("present");
  });

  it("keeps but does not act on scans from before the device was added", async () => {
    await post([{ user_id: "1001", time: "2026-01-05 07:30:00" }]);
    expect(await attendanceOf(s.studentA1, "2026-01-05")).toBeNull();
    const { data } = await admin()
      .from("parent_notifications")
      .select("id")
      .eq("school_id", s.schoolA)
      .eq("local_date", "2026-01-05");
    expect(data).toHaveLength(0);
  });
});

describe("who can see and change what", () => {
  it("shows a guardian only their own notices, and lets them change nothing but read_at", async () => {
    const parent = await signInAs(s.parentAEmail);
    const { data } = await parent.from("parent_notifications").select("parent_profile_id, student_id");
    expect(data!.length).toBeGreaterThan(0);
    expect(data!.every((n) => n.parent_profile_id === s.parentA && n.student_id === s.studentA1)).toBe(true);

    const { error: readErr } = await parent
      .from("parent_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("parent_profile_id", s.parentA);
    expect(readErr).toBeNull();

    const { error: eventErr } = await parent
      .from("parent_notifications")
      .update({ event: "left" })
      .eq("parent_profile_id", s.parentA);
    expect(eventErr).not.toBeNull();
  });

  it("keeps scans, devices and device numbers from teachers and parents", async () => {
    for (const email of [s.teacherAEmail, s.parentAEmail]) {
      const c = await signInAs(email);
      for (const table of ["device_scans", "attendance_devices", "device_people", "daily_presence"] as const) {
        const { data } = await c.from(table).select("*");
        expect(data ?? []).toHaveLength(0);
      }
    }
  });

  it("gives a teacher the scan-in times of their own class's register, and nothing else", async () => {
    const teacher = await signInAs(s.teacherAEmail);
    const own = await teacher.rpc("class_gate_arrivals", { p_class_id: s.classA_taught, p_date: today });
    expect(own.error).toBeNull();
    expect(own.data).toEqual([{ student_id: s.studentA1, arrived_at: `${today}T07:42:10+00:00` }]);

    // studentA2 scanned in too, but teacherA doesn't teach their class.
    const other = await teacher.rpc("class_gate_arrivals", { p_class_id: s.classA_untaught, p_date: today });
    expect(other.data).toEqual([]);

    const parent = await signInAs(s.parentAEmail);
    const asParent = await parent.rpc("class_gate_arrivals", { p_class_id: s.classA_taught, p_date: today });
    expect(asParent.data ?? []).toEqual([]);
  });

  it("does not let a teacher write device numbers", async () => {
    const teacher = await signInAs(s.teacherAEmail);
    const { error } = await teacher
      .from("device_people")
      .insert({ school_id: s.schoolA, device_user_id: "777", student_id: s.studentA2 });
    expect(error).not.toBeNull();
  });

  it("shows the admin their own school's day, and another school's admin nothing", async () => {
    const adminA = await signInAs(s.adminAEmail);
    const { data } = await adminA.from("daily_presence").select("device_user_id, student_id, late").eq("local_date", today);
    expect(data!.find((r) => r.device_user_id === "1001")).toMatchObject({ student_id: s.studentA1, late: false });
    expect(data!.find((r) => r.device_user_id === "4242")).toMatchObject({ student_id: null });

    const svc = admin();
    const otherAdmin = `rls-gate-b-${crypto.randomUUID().slice(0, 8)}@test.dev`;
    const { data: user } = await svc.auth.admin.createUser({ email: otherAdmin, password: "Password123!", email_confirm: true });
    await svc.from("profiles").insert({
      id: user.user!.id,
      school_id: s.schoolB,
      role: "school_admin",
      first_name: "Ad",
      last_name: "B",
      email: otherAdmin,
    });
    const adminB = await signInAs(otherAdmin);
    for (const table of ["device_scans", "attendance_devices", "device_people", "daily_presence"] as const) {
      const { data: rows } = await adminB.from(table).select("*");
      expect(rows ?? []).toHaveLength(0);
    }
  });
});
