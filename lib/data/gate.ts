import { activeYearId, db, unwrap, unwrapList } from "./_client";
import type {
  DevicePersonVM,
  DeviceVM,
  GateSettingsVM,
  ParentNotificationVM,
  PresenceVM,
} from "@/lib/validators/gate";

/**
 * Reads for the gate device. The admin reads run under `adev_admin` / `dpeople_admin` /
 * `dscans_admin_read`; a guardian's notices under `pnotif_parent_read` (migration 0044).
 */

const hhmm = (time: string) => time.slice(0, 5);

export async function getGateSettings(): Promise<GateSettingsVM> {
  const row = unwrap<{ timezone: string; late_after: string; leaving_from: string }>(
    await db().from("schools").select("timezone, late_after, leaving_from").limit(1).single(),
    "gate settings",
  );
  return { timezone: row.timezone, late_after: hhmm(row.late_after), leaving_from: hhmm(row.leaving_from) };
}

export async function listDevices(): Promise<DeviceVM[]> {
  return unwrapList(
    await db().from("attendance_devices").select("id, name, last_seen_at, created_at").order("created_at"),
    "devices",
  );
}

interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
  enrollments: { status: string; classes: { name: string } | null }[];
}

interface StaffRow {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

/** Students on roll and active staff, each with their device number if linked. */
export async function listDevicePeople(): Promise<DevicePersonVM[]> {
  const yearId = await activeYearId();
  let students = db()
    .from("students")
    .select("id, first_name, last_name, enrollments(status, classes(name))")
    .eq("enrollment_status", "active")
    .order("first_name");
  if (yearId) students = students.eq("enrollments.academic_year_id", yearId);

  const [studentRows, staffRows, links] = await Promise.all([
    students.then((r) => unwrapList<StudentRow>(r, "students")),
    db()
      .from("profiles")
      .select("id, first_name, last_name, role, is_active")
      .in("role", ["teacher", "school_admin"])
      .eq("is_active", true)
      .order("first_name")
      .then((r) => unwrapList<StaffRow>(r, "staff")),
    db()
      .from("device_people")
      .select("device_user_id, student_id, staff_id")
      .then((r) => unwrapList(r, "device numbers")),
  ]);

  const byStudent = new Map(links.flatMap((l) => (l.student_id ? [[l.student_id, l.device_user_id] as const] : [])));
  const byStaff = new Map(links.flatMap((l) => (l.staff_id ? [[l.staff_id, l.device_user_id] as const] : [])));

  return [
    ...staffRows.map(
      (p): DevicePersonVM => ({
        kind: "staff",
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        detail: p.role === "school_admin" ? "Administrator" : "Teacher",
        device_user_id: byStaff.get(p.id) ?? null,
      }),
    ),
    ...studentRows.map(
      (s): DevicePersonVM => ({
        kind: "student",
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        detail: s.enrollments.find((e) => e.status === "active")?.classes?.name ?? null,
        device_user_id: byStudent.get(s.id) ?? null,
      }),
    ),
  ];
}

/** Everyone who scanned on a school day, earliest arrival first. */
export async function listPresence(date: string): Promise<PresenceVM[]> {
  const [rows, people] = await Promise.all([
    db()
      .from("daily_presence")
      .select("device_user_id, student_id, staff_id, arrived_at, left_at, late")
      .eq("local_date", date)
      .then((r) => unwrapList(r, "presence")),
    listDevicePeople(),
  ]);
  const byId = new Map(people.map((p) => [`${p.kind}:${p.id}`, p]));

  return rows
    .flatMap((r): PresenceVM[] => {
      if (!r.device_user_id) return [];
      const key = r.student_id ? `student:${r.student_id}` : r.staff_id ? `staff:${r.staff_id}` : null;
      const person = key ? byId.get(key) : undefined;
      return [
        {
          device_user_id: r.device_user_id,
          person: person ? { kind: person.kind, id: person.id, name: person.name, detail: person.detail } : null,
          arrived_at: r.arrived_at,
          left_at: r.left_at,
          late: r.late ?? false,
        },
      ];
    })
    .sort((a, b) => (a.arrived_at ?? a.left_at ?? "").localeCompare(b.arrived_at ?? b.left_at ?? ""));
}

/** A guardian's gate notices, newest first. RLS returns only their own. */
export async function listParentNotifications(limit = 50): Promise<ParentNotificationVM[]> {
  const rows = unwrapList(
    await db()
      .from("parent_notifications")
      .select("id, student_id, event, occurred_at, late, read_at, students(first_name, last_name)")
      .order("occurred_at", { ascending: false })
      .limit(limit),
    "notifications",
  );
  return rows.map((n) => ({
    id: n.id,
    student_id: n.student_id,
    student_name: n.students ? `${n.students.first_name} ${n.students.last_name}` : "Your child",
    event: n.event,
    occurred_at: n.occurred_at,
    late: n.late,
    read: n.read_at !== null,
  }));
}

export async function countUnreadNotifications(): Promise<number> {
  const res = await db()
    .from("parent_notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (res.error) throw new Error(`unread notifications: ${res.error.message}`);
  return res.count ?? 0;
}
