/**
 * SLIS site configuration, the single source of truth for the marketing site's copy.
 *
 * Every real-world fact about the client (name, motto, location, contact, programs) lives here
 * exactly once. Marketing pages and components import `SITE` instead of hardcoding strings, so
 * updating a phone number or a program's age range only ever happens in one place.
 *
 * SOURCE: the school's crest logo + admission flyer (`SNAB-Assets/`). Facts not present in that
 * source (e.g. a founding year, precise enrollment figures, social handles) are intentionally
 * left out rather than invented, see `socials` below and the M4 rebrand plan's "honesty guard".
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
 * The school year currently being admitted for, from the 2026/2027 admission flyer. Declared once
 * here because `admissionsNote` embeds it and page copy names it inline, a `const` object cannot
 * reference its own fields, so the alternative is writing the year twice.
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
  tagline: "Creche to JHS, nurtured with excellence in Oyarifa.",
  location: {
    lines: ["Oyarifa, near the Ghana Flag", "Behind Rehoboth Estate"],
    area: "Accra, Ghana",
  },
  contact: {
    email: "snab.learner@gmail.com",
    phones: ["0256855366", "0244210139"],
  },
  admissionsYear: ADMISSIONS_YEAR,
  admissionsNote: admissionsNoteFor(ADMISSIONS_YEAR),
  earlyBird: "An early-bird discount applies to families who register early.",
  hours: {
    entries: [
      { days: "Monday – Friday", time: "6:00am – 8:00pm" },
      { days: "Saturday – Sunday", time: "6:00am – 6:00pm" },
    ],
    note: "Weekend drop-off service is open to the wider community — not only SNAB learners.",
  },
  programs: [
    {
      key: "creche",
      name: "Creche",
      ageRange: "6 months – 2 years",
      blurb:
        "A warm, attentive start for our youngest learners — safe, home-like care that builds trust from day one.",
    },
    {
      key: "nursery",
      name: "Nursery",
      ageRange: "3 – 4 years",
      blurb:
        "Play-based learning that grows curiosity, language and social confidence through guided discovery.",
    },
    {
      key: "kindergarten",
      name: "Kindergarten",
      ageRange: "4 – 5 years",
      blurb:
        "Early literacy and numeracy foundations, built through hands-on activities and structured routine.",
    },
    {
      key: "primary",
      name: "Primary",
      ageRange: "6+ years",
      blurb:
        "A strong academic foundation across the core subjects, taught with care, structure and high expectation.",
    },
    {
      key: "jhs",
      name: "Junior High School (JHS)",
      ageRange: "Basic 7 – 9",
      blurb:
        "Rigorous preparation for BECE and beyond, pairing academic depth with character and leadership.",
    },
  ],
  offerings: [
    {
      key: "drop-off",
      name: "Weekend Drop-off Service",
      blurb:
        "Safe, supervised weekend care — open to the whole community, not only our own learners.",
      items: [
        "Saturday & Sunday, 6:00am – 6:00pm",
        "Open to children from the wider community",
        "Familiar, caring staff on hand",
      ],
    },
    {
      key: "sports",
      name: "Sports & Athletics",
      blurb: "Movement, teamwork and healthy play for every age.",
      items: [
        "Football and team games",
        "Athletics and physical education",
        "Friendly, confidence-building play",
      ],
    },
    {
      key: "arts",
      name: "Creative Arts & Music",
      blurb: "Room to imagine, make and perform.",
      items: [
        "Drawing, painting and crafts",
        "Singing and music",
        "Creative expression and performance",
      ],
    },
    {
      key: "ict",
      name: "ICT & Computing",
      blurb: "Confident, age-appropriate digital skills from an early start.",
      items: [
        "Age-appropriate basic computing",
        "Keyboard and digital literacy",
        "Guided, screen-smart learning",
      ],
    },
  ],
  socials: [],
} as const;
