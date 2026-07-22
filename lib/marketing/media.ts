/**
 * SLIS media manifest — the single source of truth for optimized asset paths + alt text.
 *
 * Components import `MEDIA` instead of hardcoding paths under `public/slis/`, so swapping a
 * photo (e.g. once the school's licensed photographer delivers a full set — Pixieset downloads
 * are disabled, so these WhatsApp-quality photos are the real interim SEAM) only ever happens
 * here. Every asset was optimized from `SNAB-Assets/` (source, not committed) via `sips`/`ffmpeg`:
 * see `.superpowers/sdd/slis-unit-A-report.md` for the full photo catalog.
 */

export interface MediaAsset {
  src: string;
  alt: string;
  width?: number;
  height?: number;
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
  /** All real photos, for the Gallery page. SEAM: additional licensed photos append here. */
  gallery: readonly MediaAsset[];
  promoVideo: { src: string };
  promoPoster: MediaAsset;
  /** The school's own admission flyer graphic — not a photo, kept out of `gallery`. Available if
   * Admissions wants to embed it verbatim (docs/plan Task S2). */
  flyer: MediaAsset;
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
  logo: {
    src: "/slis/logo.jpg",
    alt: "SNAB Learners International School (SLIS) crest — a blue and gold shield with an open book and torch",
    width: 512,
    height: 512,
  },
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
  promoVideo: { src: "/slis/video/promo.mp4" }, // SEAM: swap for a hosted/streamed source if it grows.
  promoPoster: {
    src: "/slis/video/promo-poster.jpg",
    alt: "SLIS roadside signboard listing Creche through JHS programs and contact details",
    width: 1280,
    height: 720,
  },
  flyer: {
    src: "/slis/flyer-admission.jpg",
    alt: "SLIS admission-open flyer for 2026 registration, listing all five program levels and contact details",
    width: 1600,
    height: 769,
  },
} as const;
