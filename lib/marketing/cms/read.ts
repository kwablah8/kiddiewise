import "server-only";

import { cache } from "react";
import type { ZodType } from "zod";

import { MEDIA, type MediaAsset } from "@/lib/marketing/media";
import { SITE } from "@/lib/marketing/site";
import type { NewsPost, NewsSummary } from "@/lib/marketing/news";
import {
  cmsGalleryListSchema,
  cmsNewsListSchema,
  cmsNewsPostSchema,
  cmsNewsSlugsSchema,
  cmsSiteSettingsSchema,
  type CmsNewsSummary,
} from "@/lib/validators/marketing";

import { cms } from "./client";
import { toMediaAsset } from "./image";
import { mergeSiteSettings, type MarketingSettings } from "./merge";
import { CMS_TAGS, newsPostTag } from "./revalidate";
import {
  GALLERY_QUERY,
  NEWS_LIST_QUERY,
  NEWS_POST_QUERY,
  NEWS_SLUGS_QUERY,
  SITE_SETTINGS_QUERY,
} from "./queries";

/**
 * Every read the marketing site makes from Sanity.
 *
 * Three properties hold across all of them, and they are the reason this integration cannot take the
 * site down:
 *
 * 1. **Sanity being absent is not an error.** No project id, network failure, malformed payload, each
 *    lands on the committed content in `lib/marketing/site.ts` / `media.ts`. `/news` is the one
 *    exception, and only because an empty news list is a designed empty state, not a degraded one.
 * 2. **Failures are loud on the server, silent on the page.** Every fallback logs why. Without that, a
 *    typo in a GROQ projection would show up as a mysteriously empty News page and nothing else, which
 *    is the main risk of not running Sanity's typegen.
 * 3. **`cache()` wraps each reader**, so the eight components that read the site settings cost one
 *    request per render, not eight. Plain fetch memoization would not cover this: `@sanity/client`
 *    switches to POST for long queries, and Next only memoizes GET.
 */

/**
 * Freshness has two independent mechanisms, and it needs both.
 *
 * 1. **Tags, the fast path.** Publishing in the Studio fires a webhook at
 *    `app/api/revalidate-sanity/route.ts`, which expires the matching tag with `{ expire: 0 }`. The
 *    very next request then re-reads Sanity, so an edit is live essentially as fast as the editor can
 *    refresh. This is the documented pattern for external systems that need immediate expiry.
 * 2. **A time-based backstop.** If the webhook is never configured, its secret rotates, or Sanity
 *    cannot reach us, the site must not sit stale forever with nothing on screen to explain why. Five
 *    minutes is short enough that a broken webhook is an annoyance rather than an outage, and long
 *    enough that we are not re-reading Sanity on a timer for no reason.
 *
 * These are not mutually exclusive: `next.tags` and `next.revalidate` are independent fetch options in
 * Next (the only documented conflict is `revalidate` with `cache: "no-store"`). The belief that tags
 * disable time-based revalidation comes from next-sanity's own `sanityFetch` helper, which sets
 * `revalidate: tags.length ? false : revalidate` internally. We call `fetch` directly, so we get both.
 */
const REVALIDATE_SECONDS = 300;

/** Runs a query, or returns `null` if Sanity is unconfigured or unreachable. Never throws. */
async function run(
  query: string,
  tags: readonly string[],
  params: Record<string, string> = {},
): Promise<unknown> {
  if (!cms) return null;
  try {
    return await cms.fetch<unknown>(query, params, {
      next: { revalidate: REVALIDATE_SECONDS, tags: [...tags] },
    });
  } catch (error) {
    console.error("[marketing/cms] query failed, falling back to built-in content:", error);
    return null;
  }
}

/** Validates against a contract, logging the exact field problems before giving up. */
function parse<T>(schema: ZodType<T>, raw: unknown, label: string): T | null {
  if (raw === null || raw === undefined) return null;
  const result = schema.safeParse(raw);
  if (result.success) return result.data;
  console.error(
    `[marketing/cms] "${label}" did not match its contract — falling back. Issues:`,
    result.error.issues,
  );
  return null;
}

/**
 * Drops the rows that failed validation, and SAYS SO.
 *
 * The list schemas wrap each row in `.catch(null)` so one bad item cannot empty a page. The cost is that
 * the array parse then *succeeds* with nulls in it, so `parse()` above never logs, which is how a
 * projection bug once emptied the whole gallery in total silence and looked like "Sanity isn't working".
 * Anything discarded here is therefore reported, and losing every row is reported as an error in its own
 * right, because that is the case a fallback is about to hide.
 */
function keepValid<T>(rows: readonly (T | null)[], label: string): T[] {
  const kept = rows.filter((row): row is T => row !== null);
  const dropped = rows.length - kept.length;
  if (dropped > 0) {
    console.error(
      `[marketing/cms] ${label}: ${dropped} of ${rows.length} item(s) failed validation and were ` +
        `dropped. Check the projection in cms/queries.ts against the contract in ` +
        `lib/validators/marketing.ts.`,
    );
  }
  if (rows.length > 0 && kept.length === 0) {
    console.error(
      `[marketing/cms] ${label}: Sanity returned ${rows.length} item(s) but NONE validated, so the ` +
        `built-in content is being served. This is a bug in our code, not missing content.`,
    );
  }
  return kept;
}

/**
 * The editable slice of the site config, folded over the committed values.
 *
 * Any component rendering the contact email, phone numbers, opening hours, the admissions year or the
 * early-bird sentence must call this instead of importing `SITE`, see the SANITY-editable markers in
 * `lib/marketing/site.ts`.
 */
export const getMarketingSettings = cache(async (): Promise<MarketingSettings> => {
  const raw = await run(SITE_SETTINGS_QUERY, [CMS_TAGS.siteSettings]);
  return mergeSiteSettings(SITE, parse(cmsSiteSettingsSchema, raw, "siteSettings"));
});

/**
 * Gallery photos, newest first unless the editor pinned a position.
 *
 * Falls back to the 13 committed photos as a whole LIST, never per-photo: a half-Sanity, half-local
 * gallery would show the same campus twice in one grid.
 */
export const getGalleryPhotos = cache(async (): Promise<readonly MediaAsset[]> => {
  const raw = await run(GALLERY_QUERY, [CMS_TAGS.galleryImage]);
  const rows = parse(cmsGalleryListSchema, raw, "gallery");
  if (!rows) return MEDIA.gallery;

  const photos = keepValid(rows, "gallery")
    // `row.alt` is the document's description, a gallery photo's `image` field carries none.
    .map((row) => toMediaAsset(row.image, row.alt))
    .filter((photo): photo is MediaAsset => photo !== null);

  return photos.length > 0 ? photos : MEDIA.gallery;
});

/** Resolves a validated news row into the shape a card or article renders. */
function toNewsSummary(row: CmsNewsSummary, coverWidth: number): NewsSummary {
  const cover = row.coverImage ?? null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    publishedAt: row.publishedAt,
    excerpt: row.excerpt,
    // A cover's description DOES sit on the image object, unlike a gallery photo's.
    cover: cover ? toMediaAsset(cover, cover.alt, coverWidth) : null,
  };
}

/**
 * All published posts, newest first. Deliberately has no fallback, an empty array is the honest
 * answer before the school has written anything, and `/news` renders its designed empty state for it.
 */
export const getNewsPosts = cache(async (): Promise<readonly NewsSummary[]> => {
  const raw = await run(NEWS_LIST_QUERY, [CMS_TAGS.newsPost]);
  const rows = parse(cmsNewsListSchema, raw, "news list");
  if (!rows) return [];
  return keepValid(rows, "news list").map((row) => toNewsSummary(row, 1200));
});

/** One post, or `null` for an unknown slug, which the page turns into a 404. */
export const getNewsPost = cache(async (slug: string): Promise<NewsPost | null> => {
  // Both tags: the per-post one so editing this post refreshes it, and the collection one so a
  // bulk change (or a slug we have not seen) still reaches it.
  const raw = await run(NEWS_POST_QUERY, [CMS_TAGS.newsPost, newsPostTag(slug)], { slug });
  const row = parse(cmsNewsPostSchema, raw, `news post "${slug}"`);
  if (!row) return null;
  return { ...toNewsSummary(row, 1600), body: row.body };
});

/**
 * Slugs for `generateStaticParams`. Returns `[]` when Sanity is unconfigured, which is a supported
 * build: the routes then render on demand once the environment does have a project id.
 */
export const getNewsSlugs = cache(async (): Promise<readonly string[]> => {
  const raw = await run(NEWS_SLUGS_QUERY, [CMS_TAGS.newsPost]);
  return parse(cmsNewsSlugsSchema, raw, "news slugs") ?? [];
});
