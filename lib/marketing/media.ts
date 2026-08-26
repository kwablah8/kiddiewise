/**
 * Media manifest: the single source of truth for optimised asset paths and alt text.
 *
 * Components import `MEDIA` rather than hardcoding paths under `public/slis/`, so swapping a photo
 * only ever happens here. The current photos came from the school over WhatsApp and are placeholders
 * for a licensed set. Each one was optimised out of `SNAB-Assets/` (the raw source, not committed)
 * with `sips` and `ffmpeg`.
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
   * "LQIP") for every upload. The committed files under `public/slis/` leave this `undefined`, Next
   * generates their blur placeholder at build time from the local file, so they need nothing here.
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

const campusExteriorBanners: MediaAsset = {
  src: "/slis/photos/campus-exterior-banners.jpg",
  alt: "SLIS campus exterior with Admission Open and Grand Opening banners on the perimeter wall",
  width: 1920,
  height: 1440,
};

const campusCourtyard: MediaAsset = {
  src: "/slis/photos/campus-courtyard.jpg",
  alt: "SLIS campus courtyard with covered walkway, gazebo seating and the front gate",
  width: 1920,
  height: 1440,
};

const campusExteriorGarden: MediaAsset = {
  src: "/slis/photos/campus-exterior-garden.jpg",
  alt: "Side view of the SLIS campus building with a landscaped garden and flower beds",
  width: 1920,
  height: 1440,
};

const communityGroup: MediaAsset = {
  src: "/slis/photos/community-group.jpg",
  alt: "SLIS staff and community members in yellow and blue polo shirts posing in front of the school building",
  width: 1920,
  height: 1440,
};

const communityGroupAlt: MediaAsset = {
  src: "/slis/photos/community-group-alt.jpg",
  alt: "SLIS staff and families gathered in front of the school building, a second view of the same moment",
  width: 1920,
  height: 1440,
};

const classroomCrecheMural: MediaAsset = {
  src: "/slis/photos/classroom-creche-mural.jpg",
  alt: "Creche playroom with a Mickey and Minnie Mouse wall mural and colourful children's tables and chairs",
  width: 1440,
  height: 1920,
};

const classroomNurseryCalendar: MediaAsset = {
  src: "/slis/photos/classroom-nursery-calendar.jpg",
  alt: "Nursery classroom with a hand-painted months-and-days tree mural and curved children's desks",
  width: 1920,
  height: 1440,
};

const classroomKindergartenCorner: MediaAsset = {
  src: "/slis/photos/classroom-kindergarten-corner.jpg",
  alt: "Kindergarten classroom corner with the days-of-the-week tree mural and a colourful storage shelf",
  width: 1920,
  height: 1440,
};

const classroomPrimaryReading: MediaAsset = {
  src: "/slis/photos/classroom-primary-reading.jpg",
  alt: "Primary classroom with rows of individual desks and a mural of a child reading a stack of books",
  width: 1440,
  height: 1920,
};

const classroomJhsDesks: MediaAsset = {
  src: "/slis/photos/classroom-jhs-desks.jpg",
  alt: "Junior High School classroom with a whiteboard and rows of blue desks with grey chairs",
  width: 1920,
  height: 1280,
};

const studentPortraitUniform: MediaAsset = {
  src: "/slis/photos/student-portrait-uniform.jpg",
  alt: "A young SLIS pupil in the school's blue sailor-collar uniform, seated at a play table",
  width: 1280,
  height: 1920,
};

const hallwayValuesMural: MediaAsset = {
  src: "/slis/photos/hallway-values-mural.jpg",
  alt: "School hallway with a hand-washing hygiene mural painted on the wall",
  width: 1440,
  height: 1920,
};

const eventKidsFuntime: MediaAsset = {
  src: "/slis/photos/event-kids-funtime.jpg",
  alt: "Children and staff at the SLIS Grand Opening kids' funtime event around an inflatable pool",
  width: 1440,
  height: 1920,
};

export const MEDIA: MediaManifest = {
  // derived from `lib/brand.ts`, the crest is shared with the portal sidebar and auth screens now,
  // so its path and alt text live in one place rather than here and there.
  logo: BRAND.crest,
  heroPhoto: campusExteriorBanners,
  aboutPhoto: campusCourtyard,
  introPhoto: studentPortraitUniform,
  community: communityGroup,
  programs: {
    creche: classroomCrecheMural,
    nursery: classroomNurseryCalendar,
    kindergarten: classroomKindergartenCorner,
    primary: classroomPrimaryReading,
    jhs: classroomJhsDesks,
  },
  gallery: [
    communityGroup,
    communityGroupAlt,
    campusExteriorBanners,
    campusCourtyard,
    campusExteriorGarden,
    classroomCrecheMural,
    classroomNurseryCalendar,
    classroomKindergartenCorner,
    classroomPrimaryReading,
    classroomJhsDesks,
    studentPortraitUniform,
    hallwayValuesMural,
    eventKidsFuntime,
  ],
  promoVideo: { src: "/slis/video/promo.mp4" }, // Swap for a hosted or streamed source if it grows.
  promoPoster: {
    src: "/slis/video/promo-poster.jpg",
    alt: "SLIS roadside signboard listing Creche through JHS programs and contact details",
    width: 1280,
    height: 720,
  },
  // Next year's artwork replaces this one file and these two lines. Nothing else references the
  // path, and the alt text is deliberately a description of what the flyer *says*; it is the only
  // way the flyer's content (a raster) reaches a screen reader or a search engine.
  flyer: {
    src: "/slis/flyer-admission-2026-2027.jpg",
    alt: "SLIS admission flyer: admissions open for the 2026/2027 school year with an early-bird discount. It lists the five levels — Creche (6 months–2 years), Nursery (3–4), KG (4–5), Primary (6+) and JSS — the campus facilities, and the school's email and phone numbers.",
    width: 1023,
    height: 1537,
  },
} as const;
