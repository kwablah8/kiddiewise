/**
 * Generated temporary passwords for admin-issued portal credentials.
 *
 * Generated rather than admin-chosen on purpose: given a free text field, an admin will use the same
 * password for every parent in the school. That is not cynicism about admins; it is what a repetitive
 * task at a busy admission desk produces, and one leaked credential would then open every account.
 *
 * Optimised to be READ ALOUD and TYPED, because it travels by handwriting on an admission slip and
 * then over WhatsApp:
 *   - Words, not character soup: "Cocoa-4172-River" survives a phone call; "xK9#mQ2v" does not.
 *   - No ambiguous characters. 0/O and 1/l/I are the classic transcription failures, so the digits
 *     come from a reduced alphabet that excludes them.
 *   - Capitalised words plus digits satisfy any sensible password policy without needing symbols,
 *     which are awkward on phone keyboards and easy to mishear.
 */

import type { PortalAccessStatus } from "@/lib/validators/people";

// Ghanaian and school-familiar nouns: recognisable to the people typing them, which is the point.
// The list length matters: see TEMP_PASSWORD_COMBINATIONS below.
export const TEMP_PASSWORD_WORDS = [
  "Cocoa",
  "Kente",
  "Baobab",
  "Harmattan",
  "Adinkra",
  "Volta",
  "Ashanti",
  "Tamale",
  "Sankofa",
  "Akwaaba",
  "Palm",
  "Mango",
  "Cassava",
  "Plantain",
  "Zebra",
  "Falcon",
  "River",
  "Sunrise",
  "Thunder",
  "Marble",
  "Copper",
  "Cedar",
  "Anchor",
  "Compass",
  "Lagoon",
  "Savanna",
  "Kumasi",
  "Elmina",
  "Shea",
  "Millet",
  "Papaya",
  "Guava",
  "Antelope",
  "Leopard",
  "Heron",
  "Kingfisher",
  "Granite",
  "Amber",
  "Indigo",
  "Saffron",
  "Lantern",
  "Harbour",
  "Meadow",
  "Summit",
  "Beacon",
  "Cobalt",
  "Juniper",
  "Quartz",
] as const;

const DIGITS = "23456789";
const DIGIT_COUNT = 5;

/** A cryptographically random integer in [0, max). */
function randomInt(max: number): number {
  // Rejection sampling, so the modulo doesn't skew the distribution towards low values.
  const limit = Math.floor(0xffffffff / max) * max;
  const buf = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buf);
    value = buf[0]!;
  } while (value >= limit);
  return value % max;
}

const pickWord = (): string => TEMP_PASSWORD_WORDS[randomInt(TEMP_PASSWORD_WORDS.length)]!;

/**
 * How many distinct passwords `generateTempPassword` can produce.
 *
 * Asserted in the unit tests rather than left implicit, because it is the one property that makes this
 * safe to hand over: ~74 million (~26 bits) combined with a 30-day expiry, single use, and Supabase's
 * login rate limiting. An earlier 24-word / 4-digit version gave only ~2 million, which a collision
 * test caught by flaking, two parents can never be issued the same credential.
 */
export const TEMP_PASSWORD_COMBINATIONS =
  TEMP_PASSWORD_WORDS.length * (TEMP_PASSWORD_WORDS.length - 1) * DIGITS.length ** DIGIT_COUNT;

/**
 * A temporary password of the form `Word-5digits-Word`, e.g. `Cocoa-42736-River`.
 *
 * Long enough to resist guessing, short enough to write on an admission slip and read down a phone.
 */
export function generateTempPassword(): string {
  const first = pickWord();
  let second = pickWord();
  // Two identical words reads like a bug and halves the apparent entropy.
  while (second === first) second = pickWord();

  const digits = Array.from({ length: DIGIT_COUNT }, () => DIGITS[randomInt(DIGITS.length)]).join(
    "",
  );
  return `${first}-${digits}-${second}`;
}

/**
 * Credentials an admin has just issued, as returned to the UI.
 *
 * Declared here rather than beside the Server Action that produces it: this module is client-safe,
 * whereas lib/actions/_server.ts is `server-only`. A client component importing a type from a
 * server-only module happens to survive type erasure, but it makes the import graph a lie.
 */
export interface IssuedCredentials {
  profileId: string;
  personName: string;
  email: string;
  /** Shown to the admin ONCE. Never stored in plaintext, so it cannot be shown again. */
  tempPassword: string;
  expiresAt: string;
}

/** How long an unused temporary credential stays valid. */
export const TEMP_PASSWORD_DAYS = 30;

export function tempPasswordExpiry(from: Date): string {
  const d = new Date(from);
  d.setDate(d.getDate() + TEMP_PASSWORD_DAYS);
  return d.toISOString();
}

/**
 * Whether an issued temporary password has lapsed.
 *
 * Lives here rather than inline in the login page for two reasons: reading the clock inside a
 * component body is impure (React may re-run it at any time), and the rule deserves a unit test,
 * getting it inverted would either lock out valid users or leave credentials alive forever.
 *
 * A null expiry means "no deadline recorded", which is treated as not expired: it is the state of
 * accounts that predate this feature, and locking those out would be a regression.
 */
export function isTempPasswordExpired(expiresAt: string | null, now: number = Date.now()): boolean {
  if (!expiresAt) return false;
  return Date.parse(expiresAt) < now;
}

/**
 * Derive whether someone has taken ownership of their portal account.
 *
 * Derived, never stored: the three underlying columns already say everything, and a
 * fourth "status" column would be one more thing to keep in sync on every password change.
 *
 * Lives here rather than beside either read: staff and parents are the same `profiles` rows with the
 * same credential lifecycle, so the two lists must answer "has this person taken over their account?"
 * identically, a second copy of this rule is a second chance to get it wrong.
 */
export function derivePortalStatus(
  p: {
    must_change_password: boolean;
    temp_password_expires_at: string | null;
    password_changed_at: string | null;
  },
  now: number = Date.now(),
): PortalAccessStatus {
  // They replaced the temporary password, the account is genuinely theirs.
  if (!p.must_change_password && p.password_changed_at) return "active";
  if (p.must_change_password) {
    return isTempPasswordExpired(p.temp_password_expires_at, now) ? "expired" : "pending";
  }
  // No temp password outstanding and never changed one: an account that exists but has never been
  // handed over (invited by link and not completed, say).
  return "no_access";
}

/**
 * The message an admin pastes into WhatsApp. Assembled here rather than in the component so the
 * wording is identical wherever credentials are handed over, and so it can be unit-tested.
 */
export function credentialsMessage(params: {
  schoolName: string;
  personName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}): string {
  return [
    `Hello ${params.personName},`,
    ``,
    `Your ${params.schoolName} portal account is ready.`,
    ``,
    `Sign in here: ${params.loginUrl}`,
    `Email: ${params.email}`,
    `Temporary password: ${params.tempPassword}`,
    ``,
    `You'll be asked to choose your own password the first time you sign in.`,
    `This temporary password expires in ${TEMP_PASSWORD_DAYS} days.`,
  ].join("\n");
}
