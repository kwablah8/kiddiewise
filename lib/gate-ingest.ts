import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { localParts, summarizeDay, wallTimeToInstant, type DayScan } from "@/lib/gate";
import type { DeviceScanPayload } from "@/lib/validators/gate";

/**
 * Store a batch of scans from a gate device and act on them: mark each student's register and tell
 * their guardians when they arrived and left.
 *
 * Runs with the service role (the device has no user session), so every read and write is scoped to
 * the device's school here rather than by RLS. The caller has already authenticated the device.
 *
 * Safe to repeat. The agent re-sends after an outage, and a request can fail half way, so nothing
 * here depends on a scan being new: the day is re-read from every stored scan, the register is only
 * ever raised (unmarked or absent becomes present/late, nothing else is touched) and a guardian's
 * notice is unique per child, event and day.
 */

export interface GateDevice {
  id: string;
  school_id: string;
  created_at: string;
}

export interface IngestResult {
  received: number;
  /** Device numbers in this batch not yet linked to anyone. */
  unknown_user_ids: string[];
}

type Db = SupabaseClient<Database>;

function fail(context: string, error: { message: string }): never {
  throw new Error(`gate ingest, ${context}: ${error.message}`);
}

export async function ingestScans(
  db: Db,
  device: GateDevice,
  payload: DeviceScanPayload,
  now: Date = new Date(),
): Promise<IngestResult> {
  const schoolRes = await db
    .from("schools")
    .select("timezone, late_after, leaving_from, active_term_id, active_academic_year_id")
    .eq("id", device.school_id)
    .single();
  if (schoolRes.error) fail("school", schoolRes.error);
  const school = schoolRes.data;

  if (payload.scans.length === 0) {
    await touchDevice(db, device, now);
    return { received: 0, unknown_user_ids: [] };
  }

  const rows = payload.scans.map((s) => ({
    school_id: device.school_id,
    device_id: device.id,
    device_user_id: s.user_id,
    scanned_at: wallTimeToInstant(s.time, school.timezone).toISOString(),
    // The device's clock is the school's clock, so its date is the school day.
    local_date: s.time.slice(0, 10),
  }));

  const stored = await db
    .from("device_scans")
    .upsert(rows, { onConflict: "device_id,device_user_id,scanned_at", ignoreDuplicates: true });
  if (stored.error) fail("store scans", stored.error);

  const userIds = [...new Set(rows.map((r) => r.device_user_id))];
  const peopleRes = await db
    .from("device_people")
    .select("device_user_id, student_id, staff_id")
    .eq("school_id", device.school_id)
    .in("device_user_id", userIds);
  if (peopleRes.error) fail("people", peopleRes.error);
  const linked = new Map(peopleRes.data.map((p) => [p.device_user_id, p]));
  const unknown = userIds.filter((id) => !linked.has(id));

  // Scans from before the device was added (its stored history, read on first connection) are kept
  // for the record but not acted on: nobody should be told today that their child arrived last term.
  const firstDay = localParts(new Date(device.created_at), school.timezone).date;
  const studentDays = new Map<string, { studentId: string; userId: string; date: string }>();
  for (const r of rows) {
    const studentId = linked.get(r.device_user_id)?.student_id;
    if (!studentId || r.local_date < firstDay) continue;
    studentDays.set(`${studentId}|${r.local_date}`, { studentId, userId: r.device_user_id, date: r.local_date });
  }

  if (studentDays.size > 0) {
    await actOnStudentDays(db, device.school_id, school, [...studentDays.values()]);
  }

  await touchDevice(db, device, now);
  return { received: rows.length, unknown_user_ids: unknown };
}

async function touchDevice(db: Db, device: GateDevice, now: Date) {
  const res = await db.from("attendance_devices").update({ last_seen_at: now.toISOString() }).eq("id", device.id);
  if (res.error) fail("device last seen", res.error);
}

interface SchoolGate {
  timezone: string;
  late_after: string;
  leaving_from: string;
  active_term_id: string | null;
  active_academic_year_id: string | null;
}

async function actOnStudentDays(
  db: Db,
  schoolId: string,
  school: SchoolGate,
  days: { studentId: string; userId: string; date: string }[],
) {
  const userIds = [...new Set(days.map((d) => d.userId))];
  const dates = [...new Set(days.map((d) => d.date))];
  const studentIds = [...new Set(days.map((d) => d.studentId))];

  // Every scan these people made on these days, from any of the school's devices.
  const [scansRes, guardiansRes, existingRes, enrolRes] = await Promise.all([
    db
      .from("device_scans")
      .select("device_user_id, scanned_at, local_date")
      .eq("school_id", schoolId)
      .in("device_user_id", userIds)
      .in("local_date", dates),
    db.from("student_guardians").select("student_id, parent_profile_id").in("student_id", studentIds),
    db.from("attendance").select("student_id, date, status").in("student_id", studentIds).in("date", dates),
    school.active_academic_year_id
      ? db
          .from("enrollments")
          .select("student_id, class_id")
          .eq("academic_year_id", school.active_academic_year_id)
          .eq("status", "active")
          .in("student_id", studentIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (scansRes.error) fail("day scans", scansRes.error);
  if (guardiansRes.error) fail("guardians", guardiansRes.error);
  if (existingRes.error) fail("existing attendance", existingRes.error);
  if (enrolRes.error) fail("enrollments", enrolRes.error);

  const guardians = new Map<string, string[]>();
  for (const g of guardiansRes.data) {
    guardians.set(g.student_id, [...(guardians.get(g.student_id) ?? []), g.parent_profile_id]);
  }
  const existing = new Map(existingRes.data.map((a) => [`${a.student_id}|${a.date}`, a.status]));
  const classOf = new Map(enrolRes.data.map((e) => [e.student_id, e.class_id]));

  const register: Database["public"]["Tables"]["attendance"]["Insert"][] = [];
  const notices: Database["public"]["Tables"]["parent_notifications"]["Insert"][] = [];

  for (const day of days) {
    const scans: DayScan[] = scansRes.data
      .filter((s) => s.device_user_id === day.userId && s.local_date === day.date)
      .map((s) => {
        const at = new Date(s.scanned_at);
        return { at, time: localParts(at, school.timezone).time };
      });
    const { arrival, departure } = summarizeDay(scans, school);

    const classId = classOf.get(day.studentId);
    const current = existing.get(`${day.studentId}|${day.date}`);
    // Raise the register, never lower or overrule it: a teacher's own mark stands, and only an
    // unmarked or absent child is changed by a scan.
    if (arrival && classId && school.active_term_id && (current === undefined || current === "absent")) {
      register.push({
        school_id: schoolId,
        student_id: day.studentId,
        class_id: classId,
        term_id: school.active_term_id,
        date: day.date,
        status: arrival.late ? "late" : "present",
        marked_by: null,
        updated_at: new Date().toISOString(),
      });
    }

    for (const parentId of guardians.get(day.studentId) ?? []) {
      if (arrival) {
        notices.push({
          school_id: schoolId,
          parent_profile_id: parentId,
          student_id: day.studentId,
          event: "arrived",
          occurred_at: arrival.at.toISOString(),
          local_date: day.date,
          late: arrival.late,
        });
      }
      if (departure) {
        notices.push({
          school_id: schoolId,
          parent_profile_id: parentId,
          student_id: day.studentId,
          event: "left",
          occurred_at: departure.at.toISOString(),
          local_date: day.date,
          // Spelled out: a multi-row upsert sends one column list, so a column only the arrivals
          // carried would reach the departures as an explicit null.
          late: false,
        });
      }
    }
  }

  if (register.length > 0) {
    const res = await db.from("attendance").upsert(register, { onConflict: "student_id,date" });
    if (res.error) fail("register", res.error);
  }
  if (notices.length > 0) {
    const res = await db.from("parent_notifications").upsert(notices, {
      onConflict: "parent_profile_id,student_id,event,local_date",
      ignoreDuplicates: true,
    });
    if (res.error) fail("notifications", res.error);
  }
}
