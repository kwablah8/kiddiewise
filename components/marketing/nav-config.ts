/**
 * Marketing shell navigation — nav items, the Apply CTA, and a LEGACY identity/contact object.
 *
 * As of the M4 SLIS rebrand (Unit A / Task S1), `lib/marketing/site.ts` is the canonical site
 * config — new code should import `SITE` from there, not here. The `SITE`/`SOCIAL_LINKS` exports
 * below are kept ONLY because the not-yet-rebranded shell components (site-header, site-footer,
 * stats-band, contact-details, the admissions page — Unit B/C's job) still read them; they're
 * derived from the canonical config so at least the facts (name, address, phone, email) are
 * correct today, ahead of those components' full blue/gold recolor.
 */

import { SITE as SLIS } from "@/lib/marketing/site";

export interface NavItem {
  label: string;
  href: string;
}

/** Primary navigation — the 6 public sections (docs/01-REQ Marketing website). */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Admissions", href: "/admissions" },
  { label: "News", href: "/news" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
] as const;

/** The always-visible conversion action that sits beside the nav. */
export const APPLY_CTA = { label: "Apply Now", href: "/admissions" } as const;

/**
 * The way in for people who already belong to the school — parents checking results and fees,
 * teachers marking attendance, admins running the office.
 *
 * Deliberately the QUIETER of the two header actions. Admissions is what the public site is for, so
 * `APPLY_CTA` keeps the solid gold treatment and this renders as a ghost link to its left: two
 * competing pills would split attention and cost conversions. Returning users are looking for this
 * link and will find it; first-time visitors should see "Apply Now" first.
 */
export const PORTAL_CTA = { label: "Portal Login", href: "/login" } as const;

/**
 * LEGACY identity/contact shape — DERIVED from `lib/marketing/site.ts`, not re-authored, so the
 * two never drift. `kind` has no real-world source (the crest + flyer don't state one beyond the
 * program range) and is consumed today only by not-yet-rebranded components.
 */
export const SITE = {
  name: SLIS.name,
  short: SLIS.shortName,
  kind: "Creche to JHS",
  tagline: SLIS.motto,
  place: `${SLIS.location.lines[0]} · ${SLIS.location.area}`,
  address: `${SLIS.location.lines.join(", ")}, ${SLIS.location.area}`,
  phoneDisplay: SLIS.contact.phones.join(" / "),
  phoneHref: `tel:${SLIS.contact.phones[0]}`,
  email: SLIS.contact.email,
} as const;

/** SEAM: real social handles are unknown — empty until the school confirms them (lib/marketing/site.ts `socials`). */
export const SOCIAL_LINKS: readonly NavItem[] = [];
