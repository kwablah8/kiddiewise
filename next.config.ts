import type { NextConfig } from "next";

/**
 * Sanity serves every uploaded asset from one host, `cdn.sanity.io`, and `next/image` refuses remote
 * hosts that are not declared here, so without this block a news cover or a Sanity gallery photo
 * renders as a broken image with no console error worth reading.
 *
 * The pattern is scoped to OUR project's asset prefix rather than the whole host, so the image
 * optimizer cannot be used as a proxy for another Sanity project's public assets. When the project id
 * is absent (CI, or a developer who has not been added to the Sanity project) the list is empty:
 * nothing Sanity-hosted is expected to render in that case either, because every reader falls back to
 * the committed files under `public/slis/`. See `lib/marketing/cms/env.ts`.
 */
const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

/**
 * Baseline security headers, applied to every route.
 *
 * Deliberately not a Content-Security-Policy yet: a strict CSP has to be reconciled with Next's inline
 * runtime, the Supabase SDK, and especially the embedded Sanity Studio at /studio (which loads workers
 * and eval), and getting it wrong ships a blank page. That is its own focused task. What is here are
 * the headers that carry real protection with no such risk:
 *  - HSTS pins HTTPS once seen (ignored by browsers over plain http, so it is inert in local dev).
 *  - X-Frame-Options + frame-ancestors keep the portal out of an attacker's <iframe> (clickjacking).
 *  - nosniff stops content-type guessing; Referrer-Policy stops leaking full portal URLs off-site.
 *  - Permissions-Policy denies powerful features the app never uses.
 */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
