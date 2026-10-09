import { NextResponse, type NextRequest } from "next/server";

import { hashDeviceKey } from "@/lib/device-keys";
import { ingestScans } from "@/lib/gate-ingest";
import { createServiceClient } from "@/lib/supabase/service";
import { deviceScanPayload } from "@/lib/validators/gate";

/**
 * Scans from a school's gate device, posted by the agent on the school computer
 * (tools/attendance-agent).
 *
 * The agent has no user session, so the session guard in lib/auth/access.ts lets this path through
 * and the request is authenticated here instead, by the device key in `Authorization: Bearer`. Only
 * the key's hash is stored; a match identifies the device and therefore its school, and everything
 * written is scoped to that school. Nothing in the body can name a different one.
 */
export async function POST(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  const key = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (!key) {
    return NextResponse.json({ error: "missing device key" }, { status: 401 });
  }

  const db = createServiceClient();
  const deviceRes = await db
    .from("attendance_devices")
    .select("id, school_id, created_at")
    .eq("key_hash", hashDeviceKey(key))
    .maybeSingle();
  if (deviceRes.error) {
    console.error("[attendance-device] device lookup failed:", deviceRes.error.message);
    return NextResponse.json({ error: "unavailable" }, { status: 500 });
  }
  if (!deviceRes.data) {
    return NextResponse.json({ error: "unknown device key" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "body must be JSON" }, { status: 400 });
  }
  const parsed = deviceScanPayload.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid payload" },
      { status: 400 },
    );
  }

  try {
    const result = await ingestScans(db, deviceRes.data, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    // A 5xx makes the agent keep the scans and retry, which ingestScans is built to tolerate.
    console.error("[attendance-device] ingest failed:", error);
    return NextResponse.json({ error: "could not store scans" }, { status: 500 });
  }
}
