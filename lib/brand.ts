/**
 * Canonical school identity — the crest, the names, the motto.
 *
 * This exists because brand identity is no longer marketing-only: the authenticated portal's
 * sidebar, the auth screens and the parent shell all show the crest and the school's name now that
 * this build is tailored to SLIS. Those surfaces must not import `lib/marketing/*` (a portal
 * reaching into the public site's config is exactly the seam CLAUDE.md §10 asks us to respect), so
 * the shared facts live here and `lib/marketing/site.ts` + `lib/marketing/media.ts` DERIVE from
 * them rather than re-declaring them. One fact, one home (golden rule 9).
 *
 * SEAM: single-tenant by design, for now. True per-school branding reads the name from the
 * `schools` row and the logo from Storage — both unbuilt, see CLAUDE.md §5. When that lands, this
 * module becomes the fallback for a school that hasn't uploaded its own identity yet.
 */

export interface BrandCrest {
  src: string;
  /**
   * Descriptive alt for the rare slot where the crest stands alone. Most placements sit beside the
   * school's name in text, where the image is decorative and callers pass `alt=""` instead — a
   * screen reader announcing the crest AND the adjacent wordmark would just say it twice.
   */
  alt: string;
  width: number;
  height: number;
}

export interface Brand {
  /** Initialism used in tight chrome — sidebar, auth panel, nav. */
  shortName: string;
  /** Full registered name, for titles, footers and formal contexts. */
  fullName: string;
  /** The words under the short name in the identity lock. */
  descriptor: string;
  motto: string;
  crest: BrandCrest;
  /**
   * Backdrop for the auth screens' desktop side panel. `src` only, deliberately: it sits under a
   * near-opaque navy scrim as pure decoration, so it is rendered with `alt=""` and needs no
   * description. Shown from `lg` up only — phones get a flat navy band, so this never costs mobile
   * data. The same file also appears in the marketing gallery manifest with descriptive alt text;
   * that is the gallery's fact to own, not a duplicate of this one.
   */
  authPanelPhoto: { src: string };
}

export const BRAND: Brand = {
  shortName: "SLIS",
  fullName: "SNAB Learners International School",
  descriptor: "Learners International",
  motto: "Nurturing, Growing & Leading with Excellence.",
  crest: {
    src: "/slis/logo.jpg",
    alt: "SNAB Learners International School (SLIS) crest — a blue and gold shield with an open book and torch",
    width: 512,
    height: 512,
  },
  // A calm, architectural frame — a busy group shot turns to mud under the scrim.
  // SEAM: swap this one line to change the login artwork.
  authPanelPhoto: { src: "/slis/photos/campus-exterior-garden.jpg" },
} as const;
