/**
 * Canonical school identity: the crest, the names, the motto.
 *
 * This exists because brand identity is no longer marketing-only: the authenticated portal's
 * sidebar, the auth screens and the parent shell all show the crest and the school's name now that
 * this build is tailored to Kiddiewise. Those surfaces must not import `lib/marketing/*` (a portal
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
  /** Darkest brand hue, headings on white. The raw brand hue looks thin at display sizes. */
  deep: string;
  /** Brand hue, darkened, figures and rules. Same value as `--primary`. */
  strong: string;
  /** Accent hue, accents and rules only. It fails contrast as text on white. */
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
   * near-opaque brand-colour scrim as pure decoration, so it is rendered with `alt=""` and needs no
   * description. Shown from `lg` up only, phones get a flat brand-colour band, so this never costs
   * mobile data. The same file also appears in the marketing gallery manifest with descriptive alt
   * text; that is the gallery's fact to own, not a duplicate of this one.
   */
  authPanelPhoto: { src: string };
}

export const BRAND: Brand = {
  shortName: "Kiddiewise",
  fullName: "Kiddiewise School Complex",
  descriptor: "Adenta – Oyarifa",
  motto: "The Name of the Lord is our Strong Tower.",
  palette: {
    deep: "#710129",
    strong: "#a4013b",
    accent: "#ffb605",
    tint: "#f8ebef",
  },
  crest: {
    src: "/kiddiewise/logo.jpg",
    alt: "Kiddiewise School Complex crest — a crimson shield with an open book, a lit torch and a pen, above the motto 'The Name of the Lord is our Strong Tower', established 2012",
    width: 447,
    height: 700,
  },
  // TEMPORARY: a brand-colour gradient standing in for a real campus/pupil photo. Swap this one
  // line for a portrait-orientation photo once the school sends one — see the SLIS build's own
  // note on what makes a good crop (portrait aspect, properly photographed, subject in school
  // colours) for what to look for.
  authPanelPhoto: { src: "/kiddiewise/photos/brand-gradient-placeholder.jpg" },
} as const;
