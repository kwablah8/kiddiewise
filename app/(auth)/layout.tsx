import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import type { ReactNode } from "react";

import { BrandLock } from "@/components/brand/brand-lock";
import { BRAND } from "@/lib/brand";
import { SITE } from "@/lib/marketing/site";

/**
 * Shell for every auth screen — login, reset-password, update-password.
 *
 * MOBILE-FIRST, and that is a data decision as much as a design one. Most of this school's traffic
 * is on a phone, on Ghanaian mobile data, so phones get a flat navy brand band and download NO
 * photograph at all: the campus image lives in the `lg:` panel, which never renders below that
 * breakpoint. Desktop gets the 50/50 split with the photo under a navy scrim.
 *
 * The scrim is deliberately heavy. This panel is a backdrop for a text lock, not a gallery — the
 * photo is there to make the screen feel like SLIS and nothing more, so legibility wins over the
 * image every time.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    // `grid-rows-[auto_1fr]` matters on mobile: with auto rows, the grid stretches BOTH the brand
    // band and the form column to share `min-h-dvh`, which blew the band up to ~330px of empty navy.
    // Pinning row 1 to its content and letting the form take the rest keeps the band compact.
    // At `lg` the hidden mobile band leaves exactly two grid items, so it reverts to two columns.
    <div className="grid min-h-dvh grid-rows-[auto_1fr] lg:grid-cols-2 lg:grid-rows-1">
      {/* ---------- Mobile brand band (<lg): no photo, just navy + the identity lock ---------- */}
      <div className="bg-[linear-gradient(160deg,var(--brand-top),var(--brand-bottom))] px-6 pt-8 pb-7 lg:hidden">
        <BrandLock tone="light" crestClassName="size-11 rounded-xl" />
        <p className="mt-4 text-[0.95rem] leading-snug font-medium text-white">{BRAND.motto}</p>
      </div>

      {/* ---------- Desktop brand panel (lg+): campus photo under a navy scrim ---------- */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <Image
          src={BRAND.authPanelPhoto.src}
          alt=""
          fill
          sizes="50vw"
          priority
          className="object-cover"
        />
        {/* Two stacked washes: the navy tint that makes the text legible over any part of the photo,
            then a darker foot so the location and copyright lines hold up over whatever the image
            happens to be doing at the bottom of the crop.
            The top wash is ~76% → ~90% navy, tuned by measurement rather than taste: over a bright
            daylight frame that leaves white text at roughly 5:1, comfortably past AA, while still
            letting the building and garden read through. Anything near 90% at the top — where this
            started — renders the photo invisible and you may as well not ship the image. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(160deg,color-mix(in_srgb,var(--brand-top),transparent_24%),color-mix(in_srgb,var(--brand-bottom),transparent_10%))]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,var(--brand-bottom),transparent)]"
        />

        {/* TWO blocks, not three, and the middle is deliberately empty: the pupil's face sits at
            roughly half the panel's height, which is exactly where a vertically-centred motto used
            to land. Anchoring the words to the foot keeps the subject clear and lets the bottom
            gradient do double duty as the text's backing. */}
        <div className="relative">
          <BrandLock tone="light" crestClassName="size-11 rounded-xl" />
        </div>

        <div className="relative max-w-sm">
          <p className="text-2xl leading-snug font-semibold text-white">{BRAND.motto}</p>
          <p className="mt-3 text-sm text-white/75">
            Enrolment, attendance, results, fees, and parent communication — in one place.
          </p>
          <div className="mt-8 space-y-2">
            <p className="flex items-center gap-2 text-xs text-white/70">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              {SITE.location.lines[0]} · {SITE.location.area}
            </p>
            <p className="text-xs text-white/45">
              © {new Date().getFullYear()} {BRAND.fullName}
            </p>
          </div>
        </div>
      </div>

      {/* ---------- Form column ---------- */}
      <div className="flex flex-1 flex-col bg-[var(--bg)] px-6 py-10 sm:py-12">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          {children}

          {/* Parents reach this screen from the site's new "Portal Login" link, so there has to be a
              way back — otherwise the browser's back button is the only exit. */}
          <Link
            href="/"
            className="mt-8 inline-flex w-fit items-center gap-1.5 rounded-md text-xs font-medium text-[var(--muted-foreground)] transition-colors outline-none hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Back to {BRAND.shortName} website
          </Link>
        </div>
      </div>
    </div>
  );
}
