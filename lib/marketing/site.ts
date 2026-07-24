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
  /** Stable identifier — the component maps this to an icon (icons aren't stored here). */
  key: string;
  name: string;
  /** One-line, honest description — no invented facilities, stats or events. */
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
  contact: SiteContact;
  admissionsNote: string;
  hours: OfficeHours;
  programs: readonly ProgramLevel[];
  /** Co-curricular life beyond the academic ladder (shown in the "What we offer" home section). */
  offerings: readonly Offering[];
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
