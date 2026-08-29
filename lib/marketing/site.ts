/**
 * Kiddiewise site configuration, the single source of truth for the marketing site's copy.
 *
 * Every real-world fact about the client (name, motto, location, contact, programs) lives here
 * exactly once. Marketing pages and components import `SITE` instead of hardcoding strings, so
 * updating a phone number or a program's age range only ever happens in one place.
 *
 * SOURCE: the school's crest badge, plus the school's own site at kiddiewise.vercel.app (contact
 * details, office hours, program ladder, tagline). Facts not present in either source (a specific
 * admissions discount, social handles) are intentionally left out rather than invented, see
 * `socials` below and the "honesty guard" pattern this file follows throughout.
 *
 * SANITY: six of these fields are now editable by the school in the Studio at /studio, which makes the
 * values here their FALLBACK rather than the last word, `contact`, `hours`, `admissionsYear`,
 * `admissionsNote` (derived) and `earlyBird`. Anything rendering one of those must read
 * `getMarketingSettings()` from `lib/marketing/cms/read.ts`, not this constant, or it will show stale
 * copy while the page beside it shows the edited copy. Each field is marked below. Everything unmarked
 *, the name, motto, tagline, address, programs, offerings, is code-owned and safe to import directly.
 *
 * This module must stay importable from CLIENT components (`site-header.tsx` and
 * `app/(auth)/layout.tsx` both import it), so it must never gain `import "server-only"`.
 */

import { BRAND } from "@/lib/brand";

/**
 * The school year currently being admitted for. Kiddiewise's own site does not name a specific
 * intake year (no flyer with a printed year exists yet), so this follows Ghana's school-year
 * convention relative to today's date rather than a fabricated one. Declared once here because
 * `admissionsNote` embeds it and page copy names it inline, a `const` object cannot reference its
 * own fields, so the alternative is writing the year twice.
 */
const ADMISSIONS_YEAR = "2026/2027";

/**
 * The admissions banner sentence, derived from the year rather than authored beside it.
 *
 * Exported because Sanity lets the school edit `admissionsYear` and this sentence renders in eight
 * places including the site's `<meta description>`. If the note were a second editable field, bumping
 * the year and forgetting the note would put one wrong fact on all eight surfaces. One function, one
 * fact.
 */
export function admissionsNoteFor(year: string): string {
  return `Admission open for ${year}`;
}

export interface ProgramLevel {
  /** Stable identifier, e.g. for `MEDIA.programs` lookups. */
  key: string;
  name: string;
  ageRange: string;
  /** Short, honest, non-fabricated description, no invented stats or history. */
  blurb: string;
}

export interface SiteLocation {
  /** Address lines, most specific first (e.g. landmark, then neighborhood). */
  lines: readonly string[];
  /** City/region/country. */
  area: string;
}

export interface SiteContact {
  email: string;
  /** Multiple lines are published for this school; first is the primary. */
  phones: readonly string[];
}

export interface OfficeHoursEntry {
  /** Human label for the day span, e.g. "Monday – Friday". */
  days: string;
  /** Human label for the time span, e.g. "6:00am – 8:00pm". */
  time: string;
}

export interface OfficeHours {
  /** One line per day span; order is preserved as displayed. */
  entries: readonly OfficeHoursEntry[];
  /** Short note shown under the hours (e.g. the weekend community drop-off). */
  note?: string;
}

export interface Offering {
  /** Stable identifier, the component maps this to an icon (icons aren't stored here). */
  key: string;
  name: string;
  /** One-line, honest description, no invented facilities, stats or events. */
  blurb: string;
  /** Short checklist of what the offering includes. */
  items: readonly string[];
}

export interface SocialLink {
  label: string;
  href: string;
}

export interface SiteConfig {
  name: string;
  shortName: string;
  motto: string;
  tagline: string;
  location: SiteLocation;
  /** SANITY-EDITABLE: read via `getMarketingSettings()`, not `SITE`. */
  contact: SiteContact;
  /** The school year admissions are open for, e.g. "2026/2027", for copy that names it inline.
   *  SANITY-EDITABLE: read via `getMarketingSettings()`, not `SITE`. */
  admissionsYear: string;
  /** derived from `admissionsYear` by `admissionsNoteFor()`, never authored on its own.
   *  SANITY-EDITABLE (indirectly): read via `getMarketingSettings()`, not `SITE`. */
  admissionsNote: string;
  /** The early-bird offer as one standalone sentence. The flyer advertises that a discount exists
   * but states neither an amount nor a deadline, so this says exactly that and no more.
   * SANITY-EDITABLE: read via `getMarketingSettings()`, not `SITE`. */
  earlyBird: string;
  /** SANITY-EDITABLE: read via `getMarketingSettings()`, not `SITE`. */
  hours: OfficeHours;
  programs: readonly ProgramLevel[];
  /** Co-curricular life beyond the academic ladder (shown in the "What we offer" home section). */
  offerings: readonly Offering[];
  /** TODO: real handles unknown at integration time; populate once the school confirms them. */
  socials: readonly SocialLink[];
}

export const SITE: SiteConfig = {
  // Identity is derived from `lib/brand.ts`, not re-authored: the portal shows the same name and
  // motto now, and it must not import this marketing config to get them.
  name: BRAND.fullName,
  shortName: BRAND.shortName,
  motto: BRAND.motto,
  tagline: "Daycare to JHS, nurturing excellence in Adenta – Oyarifa.",
  location: {
    lines: ["Oyarifa Road (Off Container Junction)"],
    area: "Accra, Ghana",
  },
  contact: {
    email: "kiddiewise2012@gmail.com",
    phones: ["+233 54 179 0780"],
  },
  admissionsYear: ADMISSIONS_YEAR,
  admissionsNote: admissionsNoteFor(ADMISSIONS_YEAR),
  earlyBird: "Spaces are limited each term, so early registration is encouraged.",
  hours: {
    entries: [
      { days: "Monday – Friday", time: "8:00am – 6:00pm" },
      { days: "Saturday", time: "9:00am – 2:00pm" },
      { days: "Sunday", time: "Closed" },
    ],
  },
  programs: [
    {
      key: "creche",
      name: "Daycare",
      ageRange: "6 months – 2 years",
      blurb:
        "A safe, nurturing start for our youngest learners — sensory play, social skills and early cognitive growth, built on trust from day one.",
    },
    {
      key: "nursery",
      name: "Preschool (Nursery)",
      ageRange: "2 – 4 years",
      blurb:
        "Foundational skills through structured play, early literacy, numeracy and creative expression in a warm, engaging environment.",
    },
    {
      key: "kindergarten",
      name: "Kindergarten (KG 1 & 2)",
      ageRange: "4 – 6 years",
      blurb:
        "Preparing children for primary school with a balanced curriculum in reading, writing, mathematics and character development.",
    },
    {
      key: "primary",
      name: "Primary School",
      ageRange: "6 – 12 years",
      blurb:
        "Comprehensive elementary education on the Ghana Education Service curriculum, with emphasis on critical thinking and problem-solving.",
    },
    {
      key: "jhs",
      name: "Junior High School (JHS)",
      ageRange: "12 – 15 years",
      blurb:
        "Rigorous preparation for BECE, pairing core academic depth with leadership and career guidance.",
    },
  ],
  offerings: [
    {
      key: "holiday",
      name: "Holiday & Weekend Programs",
      blurb: "Fun-filled learning during school breaks, open to ages 4–15.",
      items: [
        "Remedial classes",
        "Coding & robotics",
        "Arts & crafts camp",
        "Sports clinics",
        "Excursions & field trips",
        "Public speaking workshop",
      ],
    },
    {
      key: "transport",
      name: "Transport Service",
      blurb: "Safe, reliable school bus service for daily pick-up and drop-off.",
      items: ["Supervised daily rides", "Reliable, fixed schedule", "Familiar drivers and staff"],
    },
    {
      key: "meals",
      name: "Meals & Nutrition",
      blurb: "Healthy, balanced meals provided daily.",
      items: ["Daily hot meals", "Balanced, age-appropriate menus", "Dietary care for young learners"],
    },
  ],
  socials: [],
} as const;
