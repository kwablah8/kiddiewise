/**
 * Canonical school identity: the crest, the names, the motto.
 *
 * This exists because brand identity is no longer marketing-only: the authenticated portal's
 * sidebar, the auth screens and the parent shell all show the crest and the school's name now that
 * this build is tailored to SLIS. Those surfaces must not import `lib/marketing/*` (a portal
 * reaching into the public site's config crosses a layer boundary), so the shared facts live here
 * and `lib/marketing/site.ts` and `lib/marketing/media.ts` derive from them rather than
 * re-declaring them. One fact, one home.
 *
 * Single-tenant by design for now. True per-school branding reads the name from the `schools` row
 * and the logo from Storage, neither of which is built yet. When that lands; this
 * module becomes the fallback for a school that hasn't uploaded its own identity yet.
 */

export interface BrandCrest {
  src: string;
  /**
   * Descriptive alt for the rare slot where the crest stands alone. Most placements sit beside the
   * school's name in text, where the image is decorative and callers pass `alt=""` instead, a
   * screen reader announcing the crest and the adjacent wordmark would just say it twice.
   */
  alt: string;
  width: number;
  height: number;
}

/**
 * The brand's hexes, for surfaces that cannot read a CSS variable.
 *
 * MIRRORS the `--m-*` block in `app/globals.css`, which is the visual source of truth and documents
 * where each hue was sampled from the crest. This is a deliberate second REPRESENTATION of one fact,
 * not a duplicate of it: jsPDF takes literal RGB, and reading
 * `getComputedStyle(document.documentElement)` would couple `lib/pdf/*` to the DOM, precisely the
 * coupling `renderReceipt` is split apart to avoid. Change one, change the other.
 */
export interface BrandPalette {
  /** Deep navy, headings on white. The lighter royal looks thin at display sizes. */
  deep: string;
  /** Royal blue, darkened, figures and rules. Same value as `--primary`. */
  strong: string;
  /** Gold, accents and rules only. It fails contrast as text on white. */
  accent: string;
  /** A ~8% `strong` wash over white, emphasis-block fills. */
  tint: string;
}

export interface Brand {
  /** Initialism used in tight chrome: sidebar, auth panel, nav. */
  shortName: string;
  /** Full registered name, for titles, footers and formal contexts. */
  fullName: string;
  /** The words under the short name in the identity lock. */
  descriptor: string;
  motto: string;
  palette: BrandPalette;
  crest: BrandCrest;
  /**
   * Backdrop for the auth screens' desktop side panel. `src` only, deliberately: it sits under a
   * near-opaque navy scrim as pure decoration, so it is rendered with `alt=""` and needs no
   * description. Shown from `lg` up only, phones get a flat navy band, so this never costs mobile
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
  palette: {
    deep: "#1d2f65",
    strong: "#2a4bc8",
    accent: "#ffd700",
    tint: "#edf0fb",
  },
  crest: {
    src: "/slis/logo.jpg",
    alt: "SNAB Learners International School (SLIS) crest — a blue and gold shield with an open book and torch",
    width: 512,
    height: 512,
  },
  // Chosen over the campus exteriors for three concrete reasons: it is PORTRAIT (1440x1920), so it
  // crops into the tall panel with almost no loss where a 4:3 exterior would centre-crop to sky;
  // it is properly photographed rather than WhatsApp-quality; and the pupil's uniform is royal blue
  // with the school crest on it, so the frame carries the brand by itself. The exteriors all share
  // flat overcast sky, overhead power lines and orange pillars that fight the navy/gold palette.
  // Swap this one line to change the login artwork.
  authPanelPhoto: { src: "/slis/photos/student-portrait-uniform.jpg" },
} as const;
