import type { MediaAsset } from "@/lib/marketing/media";
import type { PortableText } from "@/lib/validators/marketing";

/**
 * The news domain's rendering contract.
 *
 * Separate from `lib/marketing/cms/read.ts` because that module is `server-only` and these types have
 * to stay importable from anywhere. Separate from `lib/validators/marketing.ts` because those describe
 * what Sanity RETURNS, whereas these describe what a component RENDERS — the difference being `cover`,
 * a resolved `MediaAsset` rather than a raw Sanity asset reference.
 */

export interface NewsSummary {
  id: string;
  title: string;
  slug: string;
  /** ISO 8601. Format with `formatDate` from `lib/format.ts`; do not re-implement. */
  publishedAt: string;
  excerpt: string;
  /** `null` when the post has no cover photo — the card has a designed no-photo state. */
  cover: MediaAsset | null;
}

export interface NewsPost extends NewsSummary {
  body: PortableText;
}
