/**
 * Whether Sanity is configured at all — the single switch the rest of the CMS layer hangs off.
 *
 * The whole integration is ADDITIVE and OPTIONAL. `cmsProject()` returning `null` is a supported,
 * expected state, not an error: CI builds with no Sanity credentials, a developer who has not been
 * added to the Sanity project can still run the site, and every reader in `read.ts` falls back to the
 * committed content in `lib/marketing/site.ts` / `lib/marketing/media.ts`. That is also the rollback
 * story — unset `NEXT_PUBLIC_SANITY_PROJECT_ID` and the site is exactly what it was before Sanity.
 *
 * The dataset defaults to `production` so that setting the project id alone is enough, matching
 * `sanity.config.ts`. Both vars are `NEXT_PUBLIC_` because free-plan datasets are public: published
 * content is readable without a token, so there is no secret here to leak. (A token would only be
 * needed for reading DRAFTS, which this phase deliberately does not do.)
 */

/** Pinned so a future change to Sanity's API defaults cannot silently alter query results. */
export const CMS_API_VERSION = "2026-08-01";

export interface CmsProject {
  projectId: string;
  dataset: string;
}

export function cmsProject(): CmsProject | null {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  if (!projectId) return null;
  return { projectId, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production" };
}

/** Whether the Studio route can do anything useful. Used only for its "not configured" screen. */
export function isCmsConfigured(): boolean {
  return cmsProject() !== null;
}
