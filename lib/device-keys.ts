import "server-only";
import { createHash, randomBytes } from "node:crypto";

/**
 * Keys that let a school's gate computer post scans.
 *
 * The key is shown to the admin once, when the device is added, and only its sha256 is stored, so a
 * database read can't be replayed as a device. A random 32-byte key needs no slow hash: there is
 * nothing to brute-force.
 */
export function generateDeviceKey(): string {
  return `kwd_${randomBytes(32).toString("base64url")}`;
}

export function hashDeviceKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}
