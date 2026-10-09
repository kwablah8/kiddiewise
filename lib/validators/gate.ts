import { z } from "zod";
import { isWallTime } from "@/lib/gate";

// The number a person is enrolled under on the device. Mirrors device_people's check (0044).
const deviceUserId = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9]{1,24}$/, "Use letters and numbers only, up to 24");

// ---- What the school computer posts ----

// One request carries at most this many scans. The agent sends a catch-up in batches of this size.
export const MAX_SCANS_PER_REQUEST = 500;

export const deviceScanPayload = z.object({
  scans: z
    .array(
      z.object({
        user_id: deviceUserId,
        // Device wall-clock time, "YYYY-MM-DD HH:MM:SS", read in the school's timezone.
        time: z.string().refine(isWallTime, "Expected YYYY-MM-DD HH:MM:SS"),
      }),
    )
    .max(MAX_SCANS_PER_REQUEST),
});
export type DeviceScanPayload = z.infer<typeof deviceScanPayload>;

// ---- Admin writes ----

export const createDeviceSchema = z.object({
  name: z.string().trim().min(1, "Give the device a name").max(60),
});
export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;

export const deviceIdSchema = z.object({ id: z.string().min(1) });
export type DeviceIdInput = z.infer<typeof deviceIdSchema>;

// Link a person to their device number, or unlink them with `device_user_id: null`.
export const setDeviceUserIdSchema = z
  .object({
    person: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("student"), id: z.string().min(1) }),
      z.object({ kind: z.literal("staff"), id: z.string().min(1) }),
    ]),
    device_user_id: deviceUserId.nullable(),
  });
export type SetDeviceUserIdInput = z.infer<typeof setDeviceUserIdSchema>;

const clockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Enter a time");

export const gateSettingsSchema = z
  .object({ late_after: clockTime, leaving_from: clockTime })
  .refine((v) => v.late_after.slice(0, 5) < v.leaving_from.slice(0, 5), {
    message: "The late time must be before the leaving time",
    path: ["leaving_from"],
  });
export type GateSettingsInput = z.infer<typeof gateSettingsSchema>;

export const markNotificationsReadSchema = z.object({ ids: z.array(z.string().min(1)).max(200) });
export type MarkNotificationsReadInput = z.infer<typeof markNotificationsReadSchema>;

// ---- View models ----

export interface DeviceVM {
  id: string;
  name: string;
  last_seen_at: string | null;
  created_at: string;
}

export interface GateSettingsVM {
  timezone: string;
  /** "HH:MM" */
  late_after: string;
  /** "HH:MM" */
  leaving_from: string;
}

export type PersonKind = "student" | "staff";

/** One person, with the number they are enrolled under on the device (if linked). */
export interface DevicePersonVM {
  kind: PersonKind;
  id: string;
  name: string;
  /** Class for a student, role for staff. */
  detail: string | null;
  /** A student's class this year; null for staff. */
  class_id: string | null;
  device_user_id: string | null;
}

/** One person's day at the gate. Unlinked device numbers come through with `person: null`. */
export interface PresenceVM {
  device_user_id: string;
  person: { kind: PersonKind; id: string; name: string; detail: string | null } | null;
  arrived_at: string | null;
  left_at: string | null;
  late: boolean;
}

export interface ParentNotificationVM {
  id: string;
  student_id: string;
  student_name: string;
  event: "arrived" | "left";
  occurred_at: string;
  late: boolean;
  read: boolean;
}
