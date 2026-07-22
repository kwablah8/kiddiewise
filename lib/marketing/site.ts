/**
 * SLIS site configuration — the single source of truth for the marketing site's copy.
 *
 * Every real-world fact about the client (name, motto, location, contact, programs) lives here
 * exactly once. Marketing pages and components import `SITE` instead of hardcoding strings, so
 * updating a phone number or a program's age range only ever happens in one place.
 *
 * SOURCE: the school's crest logo + admission flyer (`SNAB-Assets/`). Facts not present in that
 * source (e.g. a founding year, precise enrollment figures, social handles) are intentionally
 * left out rather than invented — see `socials` below and the M4 rebrand plan's "honesty guard".
 */

export interface ProgramLevel {
  /** Stable identifier, e.g. for `MEDIA.programs` lookups. */
  key: string;
  name: string;
  ageRange: string;
  /** Short, honest, non-fabricated description — no invented stats or history. */
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
  contact: SiteContact;
  admissionsNote: string;
  programs: readonly ProgramLevel[];
  /** SEAM: real handles are unknown at integration time — populate once the school confirms them. */
  socials: readonly SocialLink[];
}

export const SITE: SiteConfig = {
  name: "SNAB Learners International School",
  shortName: "SLIS",
  motto: "Nurturing, Growing & Leading with Excellence.",
  tagline: "Creche to JHS, nurtured with excellence in Oyarifa.",
  location: {
    lines: ["Oyarifa, near the Ghana Flag", "Behind Rehoboth Estate"],
    area: "Accra, Ghana",
  },
  contact: {
    email: "snab.learner@gmail.com",
    phones: ["0256855366", "0244210139"],
  },
  admissionsNote: "Admission open for 2026",
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
  socials: [],
} as const;
