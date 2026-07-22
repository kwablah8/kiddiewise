/**
 * Marketing site configuration — the single source of truth for the public shell.
 *
 * This is the PUBLIC visual system (docs/06-UI §8): it shares only the brand colour and the
 * Geist typeface with the authenticated app, not the sidebar/portal chrome. Keeping the nav,
 * identity and contact details here means the header, footer and every page stay in sync.
 *
 * The school ("Kwahu Ridge Academy") is fictional placeholder content standing in for the real
 * client. Copy, contact details and social handles are SEAMs — swap for the real institution.
 */

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
export const APPLY_CTA = { label: "Apply", href: "/admissions" } as const;

/** School identity + contact details. SEAM: real institution data at integration. */
export const SITE = {
  name: "Kwahu Ridge Academy",
  short: "Kwahu Ridge",
  kind: "An independent K–12 school",
  tagline: "A modern education, rooted in character.",
  foundedYear: 1998,
  place: "Kwahu Plateau · Eastern Region · Ghana",
  address: "Ridge Road, Obo, Kwahu · Eastern Region, Ghana",
  phoneDisplay: "+233 34 200 1998",
  phoneHref: "tel:+233342001998",
  email: "admissions@kwahuridge.edu.gh",
} as const;

/** Social presence rendered as editorial text links (this lucide build ships no brand marks). */
export const SOCIAL_LINKS: readonly NavItem[] = [
  { label: "Instagram", href: "https://instagram.com/kwahuridge" },
  { label: "Facebook", href: "https://facebook.com/kwahuridge" },
  { label: "YouTube", href: "https://youtube.com/@kwahuridge" },
  { label: "LinkedIn", href: "https://linkedin.com/school/kwahuridge" },
] as const;
