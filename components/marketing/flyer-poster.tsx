import Image from "next/image";
import { Download } from "lucide-react";

import { cn } from "@/lib/utils";
import { MEDIA } from "@/lib/marketing/media";

/**
 * FlyerPoster — the school's admission flyer, shown as a printed poster.
 *
 * The flyer is the school's own artwork, published verbatim by request: every word on it (the school
 * year, the early-bird discount, the facilities list) lives inside a raster and so is invisible to
 * search engines and screen readers. Two things mitigate that, both deliberate:
 *
 *  - `MEDIA.flyer.alt` describes what the flyer *says*, not that it is a flyer.
 *  - The facts that do the conversion work — the year and the discount — are also published as real
 *    text in the copy beside every placement (`SITE.admissionsNote`, `SITE.earlyBird`).
 *
 * The width cap is load-bearing, not styling: the source is 1023px wide, so 28rem (448px) is about
 * as large as the poster can go and still have a 2× screen render from real pixels rather than
 * upscaled ones — past that, the flyer's dense small type goes soft.
 *
 * Pair it with a fixed grid track (`lg:grid-cols-[28rem_1fr]`), not an `auto` one: an `auto` track
 * sizes to content and shrank the poster well below this cap.
 *
 * The image is intentionally NOT a link. Wrapping it would make the alt text the link's accessible
 * name — a paragraph-long name for a "download" action — so the download is its own labelled link
 * instead. It is a text link rather than a button so it never competes with the section's CTA.
 */

type PosterBand = "brand" | "light";

const FRAME: Record<PosterBand, string> = {
  // Gold hairline on the blue band — the site's own accent-on-brand relationship, so the poster
  // reads as framed rather than as a bright rectangle dropped on blue.
  brand: "ring-[color-mix(in_srgb,var(--m-accent),transparent_72%)] shadow-black/40",
  light: "ring-black/[0.08] shadow-black/15",
};

const LINK: Record<PosterBand, string> = {
  brand:
    "text-white hover:text-[var(--m-accent)] focus-visible:ring-[var(--m-accent)] focus-visible:ring-offset-transparent",
  light:
    "text-[var(--m-brand)] hover:text-[var(--m-brand-deep)] focus-visible:ring-[var(--m-brand)] focus-visible:ring-offset-[var(--m-canvas)]",
};

interface FlyerPosterProps {
  /** The tone of the band it sits on — picks the frame and download-link treatment. */
  on?: PosterBand;
  className?: string;
}

export function FlyerPoster({ on = "brand", className }: FlyerPosterProps) {
  return (
    <div className={cn("flex w-full max-w-[28rem] flex-col items-start gap-4", className)}>
      <Image
        src={MEDIA.flyer.src}
        alt={MEDIA.flyer.alt}
        width={MEDIA.flyer.width}
        height={MEDIA.flyer.height}
        sizes="(min-width: 1024px) 28rem, (min-width: 640px) 24rem, 100vw"
        className={cn("h-auto w-full rounded-2xl shadow-2xl ring-1 ring-inset", FRAME[on])}
      />
      <a
        href={MEDIA.flyer.src}
        download
        className={cn(
          "inline-flex items-center gap-2 self-center rounded-md text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none",
          LINK[on],
        )}
      >
        <Download className="size-4 shrink-0" aria-hidden="true" />
        Download the flyer
      </a>
    </div>
  );
}
