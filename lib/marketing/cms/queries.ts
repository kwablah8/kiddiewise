import { defineQuery } from "next-sanity";

/**
 * Every GROQ query the marketing site runs, in one file.
 *
 * Image projections all return the same five keys, `ref`, `alt`, `width`, `height`, `lqip`, because
 * `toMediaAsset()` in `./image.ts` turns exactly that shape into the `MediaAsset` contract the existing
 * components already render. `ref` (rather than a resolved `asset->url`) is deliberate: the URL builder
 * needs the reference to apply the editor's hotspot and to request a size, and a bare `url` cannot be
 * transformed after the fact.
 *
 * Width and height come from `metadata.dimensions`, which Sanity extracts on upload. They are what
 * keeps `next/image` from causing layout shift, and what lets the masonry gallery keep each photo's
 * real aspect ratio instead of cropping to a uniform tile.
 */

/**
 * The technical facts about an image asset, and NOTHING about its description.
 *
 * `alt` is deliberately absent. It lives in a different place per document type: on the image object
 * for a news cover (`coverImage.alt`), but on the document for a gallery photo, whose `image` field has
 * no subfields at all. A single projection that assumed `alt` sat inside the image silently returned
 * `null` for every gallery photo, which failed validation, emptied the list, and sent `/gallery` back to
 * the committed files, a bug that looked exactly like "Sanity isn't working". Keeping alt out of here
 * forces each query to say where its description comes from.
 */
const ASSET_PROJECTION = `
  "ref": asset._ref,
  "width": asset->metadata.dimensions.width,
  "height": asset->metadata.dimensions.height,
  "lqip": asset->metadata.lqip
`;

/** The singleton. `_id` is fixed by `sanity/structure.ts`, which pins the document id. */
export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_type == "siteSettings" && _id == "siteSettings"][0]{
    contactEmail,
    phones,
    hoursEntries[]{ days, time },
    hoursNote,
    admissionsYear,
    earlyBird,
    foundingStory
  }
`);

/** Photos with a `position` set lead, in that order; everything else follows newest-first. */
export const GALLERY_QUERY = defineQuery(`
  *[_type == "galleryImage" && defined(image.asset)]
    | order(coalesce(position, 9999) asc, _createdAt desc){
      "id": _id,
      // alt comes from the DOCUMENT here, not from inside the image: a gallery photo's image field
      // has no subfields. Projecting it from the image is the bug this replaced.
      "image": image{${ASSET_PROJECTION}},
      alt
    }
`);

export const NEWS_LIST_QUERY = defineQuery(`
  *[_type == "newsPost" && defined(slug.current)] | order(publishedAt desc){
    "id": _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    "coverImage": coverImage{${ASSET_PROJECTION}, alt}
  }
`);

export const NEWS_POST_QUERY = defineQuery(`
  *[_type == "newsPost" && slug.current == $slug][0]{
    "id": _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    "coverImage": coverImage{${ASSET_PROJECTION}, alt},
    // Image blocks embedded mid-article need the same five keys as a cover, or they reach the
    // renderer as a bare asset reference with no dimensions and cause layout shift. Text blocks pass
    // through untouched; Portable Text's own grammar is not ours to reshape.
    body[]{
      ...,
      _type == "image" => {${ASSET_PROJECTION}, alt}
    }
  }
`);

/** Slugs only, for `generateStaticParams`. Cheap enough to run on every build. */
export const NEWS_SLUGS_QUERY = defineQuery(`
  *[_type == "newsPost" && defined(slug.current)].slug.current
`);
