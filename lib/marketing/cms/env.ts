/**
 * Whether Sanity is configured. The rest of the CMS layer hangs off this switch.
 *
 * A `null` result is expected, not an error: readers in `read.ts` fall back to the committed content
 * in `lib/marketing/site.ts` and `lib/marketing/media.ts`, so CI and a developer without Sanity
 * access can both build the site. Unsetting `NEXT_PUBLIC_SANITY_PROJECT_ID` is the rollback.
 *
 * The dataset defaults to `production`, matching `sanity.config.ts`, so the project id alone is
 * enough. Both vars are `NEXT_PUBLIC_` because free-plan datasets are public and published content
 * needs no token. Reading drafts would need one; we do not.
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
