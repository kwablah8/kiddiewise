import { z } from "zod";

/**
 * Contracts for everything read out of Sanity (CLAUDE.md §10 — validators are the source of truth for
 * shapes). Sanity's schema is what an editor sees; these are what the site is willing to render.
 *
 * Two rules run through the whole file:
 *
 * 1. **Everything is optional.** Sanity returns `null` for an unfilled field and `null` for a document
 *    that does not exist yet. A half-filled `siteSettings` is a normal state on day one, not an error —
 *    `lib/marketing/cms/merge.ts` fills the gaps from the committed config.
 * 2. **A bad item degrades to the smallest possible loss.** A broken cover image costs a post its
 *    photo, not its existence; a broken gallery row drops that photo, not the gallery. That is what the
 *    `.catch(null)` calls below buy, and it matters because the editor is a head teacher, not a QA team.
 */

/**
 * An image asset's technical facts, with NO description.
 *
 * Split from the description deliberately. `alt` lives on the image object for a news cover but on the
 * DOCUMENT for a gallery photo, and a single schema that required `alt` inside the image made every
 * gallery row fail validation — which, because rows are individually tolerated below, emptied the
 * gallery silently and sent it back to the committed files. Whoever adds the next image-bearing type
 * has to state where its alt text comes from, because this schema cannot supply one.
 */
export const cmsImageAssetSchema = z.object({
  /** Sanity asset reference, e.g. `image-abc123-1920x1440-jpg`. The URL builder needs this. */
  ref: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** Base64 low-quality placeholder. Sanity extracts one per upload; absent on very old assets. */
  lqip: z.string().nullish(),
});
export type CmsImageAsset = z.infer<typeof cmsImageAssetSchema>;

/** An asset whose description sits alongside it — a news cover, or an image block inside a post. */
export const cmsDescribedImageSchema = cmsImageAssetSchema.extend({
  alt: z.string().min(1),
});
export type CmsDescribedImage = z.infer<typeof cmsDescribedImageSchema>;

/**
 * Portable Text, held loosely on purpose.
 *
 * Re-deriving Sanity's block grammar in Zod would be a second, worse copy of a spec we do not own, and
 * `<PortableText>` already tolerates and reports unknown nodes. All we assert is "an array of typed
 * objects", which is exactly what its `TypedObject` constraint requires.
 */
export const portableTextSchema = z.array(z.looseObject({ _type: z.string() }));
export type PortableText = z.infer<typeof portableTextSchema>;

export const officeHoursEntrySchema = z.object({
  days: z.string().min(1),
  time: z.string().min(1),
});

/**
 * The editable slice of the site config. Every field is nullish; `mergeSiteSettings` decides what an
 * empty one means.
 *
 * Note what is NOT here: the school's name, motto, crest, address, tagline, programs and section prose.
 * Those stay compiled in `lib/marketing/site.ts` and `lib/brand.ts` — see the header of
 * `sanity/schema/site-settings.ts` for why each one is excluded.
 */
export const cmsSiteSettingsSchema = z.object({
  contactEmail: z.string().email().nullish().catch(null),
  phones: z.array(z.string().min(1)).nullish().catch(null),
  hoursEntries: z.array(officeHoursEntrySchema).nullish().catch(null),
  hoursNote: z.string().nullish().catch(null),
  /** Validated in the Studio as `2026/2027`; re-checked here because the Studio is not the boundary. */
  admissionsYear: z
    .string()
    .regex(/^\d{4}\/\d{4}$/)
    .nullish()
    .catch(null),
  earlyBird: z.string().nullish().catch(null),
  foundingStory: portableTextSchema.nullish().catch(null),
});
export type CmsSiteSettings = z.infer<typeof cmsSiteSettingsSchema>;

export const cmsGalleryPhotoSchema = z.object({
  id: z.string().min(1),
  /** Asset facts only — a gallery photo's `image` field has no subfields in the Studio schema. */
  image: cmsImageAssetSchema,
  /** The description, which for this type lives on the DOCUMENT. Required in the Studio. */
  alt: z.string().min(1),
});
export type CmsGalleryPhoto = z.infer<typeof cmsGalleryPhotoSchema>;

/** One row per photo, each independently droppable — see rule 2 in the header. */
export const cmsGalleryListSchema = z.array(cmsGalleryPhotoSchema.nullable().catch(null));

const newsBaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  /** ISO 8601 from Sanity's `datetime`. Kept as a string; formatting is the component's business. */
  publishedAt: z.string().min(1),
  excerpt: z.string().min(1),
  coverImage: cmsDescribedImageSchema.nullish().catch(null),
});

/** A card in the `/news` list. */
export const cmsNewsSummarySchema = newsBaseSchema;
export type CmsNewsSummary = z.infer<typeof cmsNewsSummarySchema>;

/** One post at `/news/[slug]`. */
export const cmsNewsPostSchema = newsBaseSchema.extend({
  body: portableTextSchema,
});
export type CmsNewsPost = z.infer<typeof cmsNewsPostSchema>;

/** Same per-item tolerance as the gallery: one malformed post must not empty the whole page. */
export const cmsNewsListSchema = z.array(cmsNewsSummarySchema.nullable().catch(null));

export const cmsNewsSlugsSchema = z.array(z.string().min(1));
