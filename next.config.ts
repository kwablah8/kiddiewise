import type { NextConfig } from "next";

/**
 * Sanity serves every uploaded asset from one host, `cdn.sanity.io`, and `next/image` refuses remote
 * hosts that are not declared here — so without this block a news cover or a Sanity gallery photo
 * renders as a broken image with no console error worth reading.
 *
 * The pattern is scoped to OUR project's asset prefix rather than the whole host, so the image
 * optimizer cannot be used as a proxy for another Sanity project's public assets. When the project id
 * is absent (CI, or a developer who has not been added to the Sanity project) the list is empty:
 * nothing Sanity-hosted is expected to render in that case either, because every reader falls back to
 * the committed files under `public/slis/`. See `lib/marketing/cms/env.ts`.
 */
const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: sanityProjectId
      ? [
          {
            protocol: "https",
            hostname: "cdn.sanity.io",
            pathname: `/images/${sanityProjectId}/**`,
          },
        ]
      : [],
  },
};

export default nextConfig;
