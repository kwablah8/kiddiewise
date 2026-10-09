"use server";

import { attempt, UserFacingError, type ActionResult } from "./result";
import { tenant, assertOk, assertWrite, type TenantContext } from "./_server";
import { generateDeviceKey, hashDeviceKey } from "@/lib/device-keys";
import {
  createDeviceSchema,
  deviceIdSchema,
  gateSettingsSchema,
  markNotificationsReadSchema,
  setDeviceUserIdSchema,
  type CreateDeviceInput,
  type DeviceIdInput,
  type GateSettingsInput,
  type MarkNotificationsReadInput,
  type SetDeviceUserIdInput,
} from "@/lib/validators/gate";

/**
 * Writes for the gate device: registering it, linking people to their device numbers, the school's
 * late and leaving times, and a guardian marking their notices read. RLS (migration 0044) is what
 * confines each of these to an admin, or to the guardian's own rows; the role check here only turns
 * a refusal into a sentence.
 */

function requireAdmin(ctx: TenantContext) {
  if (ctx.profile.role !== "school_admin" && ctx.profile.role !== "super_admin") {
    throw new UserFacingError("Only an administrator can manage the gate device.");
  }
}

/** Register a device. Its key is returned once, here, and never again. */
export async function createDevice(
  input: CreateDeviceInput,
): Promise<ActionResult<{ id: string; key: string }>> {
  return attempt(async () => {
    const data = createDeviceSchema.parse(input);
    const ctx = await tenant();
    requireAdmin(ctx);

    const key = generateDeviceKey();
    const row = assertWrite(
      await ctx.db
        .from("attendance_devices")
        .insert({ school_id: ctx.schoolId, name: data.name, key_hash: hashDeviceKey(key) })
        .select("id")
        .single(),
      "device",
      "A device with this name already exists.",
    );
    return { id: row.id, key };
  });
}

/** Issue a new key, which stops the old one working immediately. */
export async function rotateDeviceKey(input: DeviceIdInput): Promise<ActionResult<{ key: string }>> {
  return attempt(async () => {
    const data = deviceIdSchema.parse(input);
    const ctx = await tenant();
    requireAdmin(ctx);

    const key = generateDeviceKey();
    assertWrite(
      await ctx.db
        .from("attendance_devices")
        .update({ key_hash: hashDeviceKey(key) })
        .eq("id", data.id)
        .select("id")
        .single(),
      "device",
    );
    return { key };
  });
}

/** Remove a device that has never sent a scan. Its scans are the record, so one that has is kept. */
export async function deleteDevice(input: DeviceIdInput): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = deviceIdSchema.parse(input);
    const ctx = await tenant();
    requireAdmin(ctx);

    const row = assertWrite(
      await ctx.db.from("attendance_devices").delete().eq("id", data.id).select("id").single(),
      "device",
      "This device has sent scans, so it can't be removed. Issue a new key instead to stop it.",
    );
    return { id: row.id };
  });
}

/** Link a student or staff member to the number they are enrolled under, or unlink them. */
export async function setDeviceUserId(
  input: SetDeviceUserIdInput,
): Promise<ActionResult<{ device_user_id: string | null }>> {
  return attempt(async () => {
    const { person, device_user_id } = setDeviceUserIdSchema.parse(input);
    const ctx = await tenant();
    requireAdmin(ctx);
    const column = person.kind === "student" ? "student_id" : "staff_id";

    if (device_user_id === null) {
      assertOk(await ctx.db.from("device_people").delete().eq(column, person.id), "device number");
      return { device_user_id: null };
    }

    if (person.kind === "staff") {
      const { data: profile } = await ctx.db.from("profiles").select("role").eq("id", person.id).maybeSingle();
      if (!profile || (profile.role !== "teacher" && profile.role !== "school_admin")) {
        throw new UserFacingError("Only staff members can be linked to the device.");
      }
    }

    // Name whoever already holds the number, rather than a bare "already exists".
    const { data: holder } = await ctx.db
      .from("device_people")
      .select("student_id, staff_id, students(first_name, last_name), profiles(first_name, last_name)")
      .eq("device_user_id", device_user_id)
      .maybeSingle();
    if (holder && holder[column] !== person.id) {
      const who = holder.students ?? holder.profiles;
      throw new UserFacingError(
        `Number ${device_user_id} is already linked to ${who ? `${who.first_name} ${who.last_name}` : "someone else"}.`,
      );
    }

    assertOk(
      await ctx.db
        .from("device_people")
        .upsert(
          {
            school_id: ctx.schoolId,
            device_user_id,
            student_id: person.kind === "student" ? person.id : null,
            staff_id: person.kind === "staff" ? person.id : null,
          },
          { onConflict: column },
        ),
      "device number",
      `Number ${device_user_id} is already linked to someone else.`,
    );
    return { device_user_id };
  });
}

/** The school's late and leaving times. */
export async function updateGateSettings(
  input: GateSettingsInput,
): Promise<ActionResult<{ ok: true }>> {
  return attempt(async () => {
    const data = gateSettingsSchema.parse(input);
    const ctx = await tenant();
    requireAdmin(ctx);

    assertWrite(
      await ctx.db
        .from("schools")
        .update({ late_after: data.late_after, leaving_from: data.leaving_from })
        .eq("id", ctx.schoolId)
        .select("id")
        .single(),
      "school settings",
    );
    return { ok: true };
  });
}

/** A guardian marks gate notices read. RLS limits it to their own; read_at is the only column they may set. */
export async function markNotificationsRead(
  input: MarkNotificationsReadInput,
): Promise<ActionResult<{ ok: true }>> {
  return attempt(async () => {
    const { ids } = markNotificationsReadSchema.parse(input);
    if (ids.length === 0) return { ok: true };
    const ctx = await tenant();

    assertOk(
      await ctx.db
        .from("parent_notifications")
        .update({ read_at: new Date().toISOString() })
        .in("id", ids)
        .is("read_at", null),
      "notifications",
    );
    return { ok: true };
  });
}
