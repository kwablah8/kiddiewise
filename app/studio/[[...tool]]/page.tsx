import { isCmsConfigured } from "@/lib/marketing/cms/env";
import { StudioClient } from "./studio-client";

/**
 * Sanity Studio, served from this app at /studio.
 *
 * The catch-all segment matters: the Studio is a single-page app that routes internally
 * (/studio/structure/newsPost, /studio/vision, …), and `[[...tool]]` lets Next hand all of it to the
 * same page instead of 404ing on a deep link or a refresh.
 *
 * `force-static` is correct despite the Studio being highly dynamic — everything it does happens in
 * the browser against Sanity's API, so the server has nothing to compute per request and prerendering
 * the shell keeps it off the serverless path entirely.
 *
 * Not protected by this app's middleware: see the `/studio` entry in `lib/auth/access.ts` for why, and
 * why that is not the same thing as being open.
 */
export const dynamic = "force-static";

export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  // Without a project id the Studio would boot and fail with a stack trace aimed at a developer. A
  // school admin following a bookmark deserves a sentence instead. This also guarantees `pnpm build`
  // succeeds with no Sanity environment at all, which is how CI runs.
  if (!isCmsConfigured()) {
    return (
      // Every colour here is explicit, and that is the point. Importing the Studio component pulls
      // Sanity's global stylesheet into this route's CSS bundle even on this branch, where the Studio
      // never renders — and that stylesheet sets `body { background: #0d0e12 }`. Inheriting
      // `text-foreground` put near-black type on Sanity's near-black canvas, which is how this screen
      // first shipped: technically rendered, practically invisible. So this panel paints its own
      // surface and its own type colours, and cannot be broken by whichever stylesheet wins.
      <div
        className="flex min-h-screen items-center justify-center px-6"
        style={{ backgroundColor: "var(--m-brand-deep, #1d2f65)" }}
      >
        <div className="max-w-md text-center text-white">
          <span
            className="inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em]"
            style={{ borderColor: "rgba(255,255,255,0.25)", color: "#ffffff" }}
          >
            Content editor
          </span>
          <h1 className="mt-6 text-2xl font-semibold tracking-[-0.02em]" style={{ color: "#ffffff" }}>
            This deployment has no Sanity project set.
          </h1>
          <p
            className="mt-4 text-sm leading-relaxed"
            style={{ color: "rgba(255,255,255,0.82)" }}
          >
            Add <code className="font-mono text-xs">NEXT_PUBLIC_SANITY_PROJECT_ID</code> to the
            environment and redeploy to start editing news, gallery photos and school details.
          </p>
          <p className="mt-5 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.82)" }}>
            The public website is unaffected — it is serving its built-in content.
          </p>
        </div>
      </div>
    );
  }

  return <StudioClient />;
}
