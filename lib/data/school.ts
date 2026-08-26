import { db, unwrapMaybe } from "./_client";

/**
 * The caller's own school. RLS (`schools_select`) confines this to their tenant, so no id is passed.
 *
 * Exists so nothing in the UI hardcodes the school's name. This is a multi-tenant product, a literal
 * "Kiddiewise School Complex" in a credentials message or an email would be wrong for every school
 * except one, and would silently stay wrong after a rebrand.
 */
export interface SchoolVM {
  id: string;
  name: string;
  /** Short form for tight spaces; falls back to the full name when unset. */
  short_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  /** Continuous-assessment weight on the report card; exam weight is always 100 − this. */
  ca_weight: number;
  /** The mark a subject must reach to count on the card's "Number Of Passes" line. */
  pass_mark: number;
}

interface SchoolRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  ca_weight: number;
  pass_mark: number;
}

/** Initials-style short name: "SNAB Learners International School" → "SLIS". */
function shortNameFor(name: string): string {
  const words = name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w));
  // Only worth abbreviating a genuinely long name; "Volta Academy" reads better in full than "VA".
  if (words.length < 3) return name;
  return words.map((w) => w[0]!.toUpperCase()).join("");
}

export async function getSchool(): Promise<SchoolVM | null> {
  const row = unwrapMaybe<SchoolRow>(
    await db()
      .from("schools")
      .select("id, name, email, phone, address, logo_url, ca_weight, pass_mark")
      .limit(1)
      .maybeSingle(),
    "school",
  );
  if (!row) return null;
  return { ...row, short_name: shortNameFor(row.name) };
}
