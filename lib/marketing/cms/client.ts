import { createClient, type SanityClient } from "next-sanity";
import { CMS_API_VERSION, cmsProject } from "./env";

/**
 * The Sanity read client, or `null` when Sanity is not configured.
 *
 * `null` rather than a throw is the whole point: `createClient()` throws on an empty project id, so
 * constructing it unguarded at module scope would break `pnpm build` for CI and for any developer
 * without Sanity credentials. Callers in `read.ts` treat `null` as "use the committed content".
 *
 * This module deliberately imports from `next-sanity` and not from `sanity`, the latter is the Studio
 * (~2MB of client JS). Keep it that way: the import graph must stay `read.ts → {client, queries,
 * image}` and must never reach `sanity/schema/*` or `sanity.config.ts`, or the Studio ends up in the
 * marketing bundle.
 */
const project = cmsProject();

export const cms: SanityClient | null = project
  ? createClient({
      projectId: project.projectId,
      dataset: project.dataset,
      apiVersion: CMS_API_VERSION,
      // The Next data cache is our cache, so Sanity's CDN would add a second caching layer whose
      // timing we do not control, and that is actively harmful here: a publish fires the revalidation
      // webhook, we re-fetch immediately, and if the CDN edge has not caught up we would cache the old
      // content for another full window. Reading the origin makes "publish then see it" reliable.
      // The cost is negligible because we only reach Sanity when a cache entry is expired, not per
      // visitor: a handful of requests per publish, against a 250k/month API allowance.
      useCdn: false,
      // Only published documents, ever. The dataset is public on the free plan, which means an
      // unpublished draft is technically fetchable by anyone with the project id, and the project id
      // ships in the client bundle. Pinning the perspective means OUR pages can never render a draft
      // by accident, and it is why no read token is needed anywhere in this codebase.
      perspective: "published",
      // Stega hides invisible Unicode markers inside strings for click-to-edit overlays. We do not use
      // visual editing, and these strings flow into `generateMetadata()`, invisible characters in a
      // <title> or <meta description> is a genuinely hard bug to see. Off, permanently, unless
      // Presentation is added and `stegaClean()` is applied at the metadata boundary.
      stega: false,
    })
  : null;
