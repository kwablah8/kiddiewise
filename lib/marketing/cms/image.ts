import imageUrlBuilder from "@sanity/image-url";
import type { MediaAsset } from "@/lib/marketing/media";
import type { CmsImageAsset } from "@/lib/validators/marketing";
import { cmsProject } from "./env";

/**
 * Turns a Sanity image projection into the `MediaAsset` shape the marketing components already render.
 *
 * This adapter is the reason nothing downstream has to know Sanity exists. `gallery-grid.tsx` reads
 * `{src, alt, width, height}` today; after this it still reads `{src, alt, width, height}`, the value
 * just came from a different place.
 *
 * `@sanity/image-url` earns its place here rather than string concatenation: the editor drags a focal
 * point ("hotspot") onto a photo in the Studio, and turning that plus an optional crop rectangle into
 * the right `?rect=&fp-x=&fp-y=` parameters is real geometry, not five lines. `auto("format")` is the
 * other reason; it serves WebP/AVIF to browsers that accept them off one URL.
 */

const project = cmsProject();
const builder = project
  ? imageUrlBuilder({ projectId: project.projectId, dataset: project.dataset })
  : null;

/**
 * Default cap on the requested width. The largest slot any marketing image lands in is the lightbox at
 * ~90vw, and asking Sanity for more pixels than that only costs bandwidth. `fit("max")` never upscales,
 * so a smaller original is returned at its own size.
 */
const DEFAULT_MAX_WIDTH = 1600;

/**
 * `null` when Sanity is unconfigured, the caller supplies the fallback, because only the caller knows
 * what the right committed asset is.
 */
export function toMediaAsset(
  asset: CmsImageAsset,
  /**
   * Required, and passed separately rather than read off the asset, because where the description
   * lives differs per document type, the image object for a news cover, the document itself for a
   * gallery photo. Making it an argument means the compiler asks the question at every call site
   * instead of one projection quietly answering it wrong.
   */
  alt: string,
  maxWidth: number = DEFAULT_MAX_WIDTH,
): MediaAsset | null {
  if (!builder) return null;
  return {
    src: builder.image(asset.ref).width(maxWidth).fit("max").auto("format").url(),
    alt,
    width: asset.width,
    height: asset.height,
    blurDataURL: asset.lqip ?? undefined,
  };
}
