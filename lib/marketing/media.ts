/**
 * Media manifest: the single source of truth for optimised asset paths and alt text.
 *
 * Components import `MEDIA` rather than hardcoding paths under `public/kiddiewise/`, so swapping a
 * photo only ever happens here.
 *
 * TEMPORARY: Kiddiewise has no campus photography yet, and its own reference site
 * (kiddiewise.vercel.app) turned out to have none either — its "About" photo is a mismatched stock
 * shot of adults in an office, and every other image there is a stock headshot captioned with a
 * fictional staff name, neither fits this product or is honest to reuse. Every photo slot below is
 * instead a free-licence stock photo (Pexels/Unsplash, no attribution required), chosen and
 * visually verified — not just caption-matched — for tone: African school children, tidy uniforms,
 * a well-kept setting, nothing that reads as a rival institution's own marketing (a couple of
 * strong candidates were rejected for exactly that: one had a competing school's name spelled out
 * across the building behind the kids). None of these depict Kiddiewise's actual campus, staff or
 * pupils — alt text describes only what each photo shows, never claims it's real. Swap each one for
 * the school's own photography as it arrives.
 */

import { BRAND } from "@/lib/brand";

export interface MediaAsset {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /**
   * A tiny base64 preview to show while the real image loads, passed to `next/image` as
   * `placeholder="blur"`. Only ever set on assets that came from Sanity, which extracts one (an
   * "LQIP") for every upload. The committed files under `public/kiddiewise/` leave this
   * `undefined`, Next generates their blur placeholder at build time from the local file, so they
   * need nothing here.
   */
  blurDataURL?: string;
}

/** A `MediaAsset` whose intrinsic size is known, for `next/image` without `fill`. */
export interface SizedMediaAsset extends MediaAsset {
  width: number;
  height: number;
}

export type ProgramKey = "creche" | "nursery" | "kindergarten" | "primary" | "jhs";

export interface MediaManifest {
  logo: MediaAsset;
  heroPhoto: MediaAsset;
  aboutPhoto: MediaAsset;
  /** A warm human portrait (a pupil in uniform) for portrait-friendly slots, e.g. the Home intro. */
  introPhoto: MediaAsset;
  community: MediaAsset;
  programs: Record<ProgramKey, MediaAsset>;
  /** All real photos, for the Gallery page. Additional licensed photos append here. */
  gallery: readonly MediaAsset[];
  promoVideo: { src: string };
  promoPoster: MediaAsset;
  /** The school's own admission flyer graphic: not a photo, kept out of `gallery`. Rendered
   * verbatim by `FlyerPoster` on Home and Admissions, and served as-is to the poster's download
   * link, so it is the one asset here that reaches parents as a file rather than as a page. */
  flyer: SizedMediaAsset;
}

const heroTile: MediaAsset = {
  src: "/kiddiewise/photos/hero-v2.jpg",
  alt: "Four African schoolchildren in tidy uniforms laughing together against a painted wall",
  width: 1920,
  height: 1280,
};

const aboutTile: MediaAsset = {
  src: "/kiddiewise/photos/about-v2.jpg",
  alt: "Four Junior High School-age boys in matching uniforms reading a book together in a landscaped courtyard in front of a two-storey building",
  width: 1920,
  height: 1280,
};

const introTile: MediaAsset = {
  src: "/kiddiewise/photos/intro-v2.jpg",
  alt: "A joyful young child smiling broadly with arms raised overhead in warm outdoor light",
  width: 1280,
  height: 1920,
};

const communityTile: MediaAsset = {
  src: "/kiddiewise/photos/community-v2.jpg",
  alt: "Rows of schoolchildren in colour-grouped uniforms lined up in a school courtyard for assembly",
  width: 1920,
  height: 1440,
};

const programDaycareTile: MediaAsset = {
  src: "/kiddiewise/photos/program-daycare-v2.jpg",
  alt: "A caregiver sits with a toddler in a colourful daycare playroom, the child raising both hands",
  width: 1440,
  height: 960,
};

const programNurseryTile: MediaAsset = {
  src: "/kiddiewise/photos/program-nursery-v2.jpg",
  alt: "A toddler concentrating while stacking colourful toy blocks at a play table",
  width: 1440,
  height: 2154,
};

const programKindergartenTile: MediaAsset = {
  src: "/kiddiewise/photos/program-kindergarten-v2.jpg",
  alt: "A group of kindergarten-age children in matching plaid uniforms in a bright, tidy classroom",
  width: 1920,
  height: 1589,
};

const programPrimaryTile: MediaAsset = {
  src: "/kiddiewise/photos/program-primary-v2.jpg",
  alt: "A primary school boy in a green uniform writing in his notebook at a wooden desk, classmates around him",
  width: 1920,
  height: 1278,
};

const programJhsTile: MediaAsset = {
  src: "/kiddiewise/photos/program-jhs-v2.jpg",
  alt: "Two Junior High School-age boys in matching uniform shirts with backpacks, smiling at each other outdoors",
  width: 1920,
  height: 1080,
};

export const MEDIA: MediaManifest = {
  // derived from `lib/brand.ts`, the crest is shared with the portal sidebar and auth screens now,
  // so its path and alt text live in one place rather than here and there.
  logo: BRAND.crest,
  heroPhoto: heroTile,
  aboutPhoto: aboutTile,
  introPhoto: introTile,
  community: communityTile,
  programs: {
    creche: programDaycareTile,
    nursery: programNurseryTile,
    kindergarten: programKindergartenTile,
    primary: programPrimaryTile,
    jhs: programJhsTile,
  },
  gallery: [heroTile, aboutTile, communityTile, programDaycareTile, programNurseryTile,
    programKindergartenTile, programPrimaryTile, programJhsTile],
  // No promo video exists yet (Kiddiewise's own site does not have one either) — `HomeStory` is
  // not rendered on the home page for that reason, so neither field here is actually shown. Left
  // populated with a real generated poster (rather than left broken) so the type stays satisfied
  // and the fields are ready the moment a real video exists.
  promoVideo: { src: "" },
  promoPoster: {
    src: "/kiddiewise/photos/promo-poster.jpg",
    alt: "Kiddiewise School Complex brand mark on a crimson gradient field",
    width: 1280,
    height: 720,
  },
  // Generated from real, verified facts only (crest, programs and their age ranges, contact
  // details, address, motto — all sourced from the crest and kiddiewise.vercel.app), not designed
  // artwork from the school. Swap this file for the school's own admission flyer once they have
  // one; nothing else references the path.
  flyer: {
    src: "/kiddiewise/flyer-admission-2026-2027.jpg",
    alt: "Kiddiewise School Complex admission flyer: admissions open for the 2026/2027 school year. It lists the five levels — Daycare (6 months–2 years), Preschool/Nursery (2–4), Kindergarten (4–6), Primary (6–12) and JHS (12–15) — plus the school's address, phone and email.",
    width: 1023,
    height: 1537,
  },
} as const;
