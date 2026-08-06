/**
 * Which cache tags a Sanity webhook payload should expire.
 *
 * Pure and dependency-free so the routing logic is unit-testable without a webhook, a signature or a
 * network. The route handler in `app/api/revalidate-sanity/route.ts` is then thin enough to read in one
 * go, which matters for a piece of plumbing whose failure mode is "content silently stops updating".
 *
 * These strings must match the `tags` passed to each `fetch` in `./read.ts` exactly. A typo here does
 * not throw — it just means a publish never reaches the site — so they are covered by tests.
 */

/**
 * The shape we ask Sanity's webhook to POST. Configured as a GROQ projection in the Sanity dashboard:
 * `{_type, "slug": slug.current}`. `slug` is absent for types that have none (gallery, settings).
 */
export interface SanityWebhookPayload {
  _type?: string | null;
  slug?: string | null;
}

export const CMS_TAGS = {
  siteSettings: "siteSettings",
  galleryImage: "galleryImage",
  newsPost: "newsPost",
} as const;

/** Per-post tag, so editing one post does not invalidate every other post's cached page. */
export function newsPostTag(slug: string): string {
  return `newsPost:${slug}`;
}

/**
 * Tags to expire for a payload. An unrecognised `_type` yields `[]`, which the route reports as a
 * successful no-op rather than an error — otherwise Sanity would retry a webhook we simply do not care
 * about until it gave up.
 */
export function tagsFor(payload: SanityWebhookPayload): readonly string[] {
  switch (payload._type) {
    case "newsPost":
      // Both: the list page's tag AND this post's own, since a publish can change either.
      return payload.slug
        ? [CMS_TAGS.newsPost, newsPostTag(payload.slug)]
        : [CMS_TAGS.newsPost];
    case "galleryImage":
      return [CMS_TAGS.galleryImage];
    case "siteSettings":
      return [CMS_TAGS.siteSettings];
    default:
      return [];
  }
}
