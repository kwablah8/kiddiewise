import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import type { ReactNode } from "react";

import { BrandLock } from "@/components/brand/brand-lock";
import { BRAND } from "@/lib/brand";
import { SITE } from "@/lib/marketing/site";

/**
 * Shell for every auth screen: login, reset-password, update-password.
 *
 * one brand panel at every width, not two. It is a short hero band above the form on phones and the
 * left half of a 50/50 split from `lg` up, but it is the same element with the same photo, scrim and
 * text lock, so there is one place to change the artwork and no chance of the two drifting apart.
 *
 * Phones used to get a flat navy band and no photograph, to spare Ghanaian mobile data. That has
 * been reversed deliberately: a photo (today, `BRAND.authPanelPhoto` — a generated brand-colour
 * placeholder until the school sends a real one) is what makes this screen the school's rather
 * than a generic portal, and a parent signing in on a phone is exactly who that should land on. The
 * cost is kept small rather than ignored, `sizes` below hands phones a ~400–800px wide candidate
 * instead of the 1440px original, which is tens of kilobytes, not hundreds.
 *
 * The scrim is deliberately heavy. This panel is a backdrop for a text lock, not a gallery, the
 * photo is there to make the screen feel like the school and nothing more, so legibility wins over
 * the image every time.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    // `grid-rows-[auto_1fr]` matters on mobile: with auto rows, the grid stretches both the brand
    // band and the form column to share `min-h-dvh`, which blew the band up to ~330px of empty navy.
    // Pinning row 1 to its content and letting the form take the rest keeps the band compact.
    <div className="grid min-h-dvh grid-rows-[auto_1fr] lg:grid-cols-2 lg:grid-rows-1">
      {/* ---------- Brand panel: hero band on phones, full-height split panel from lg ---------- */}
      <div className="relative flex h-[45vw] flex-col justify-between overflow-hidden p-6 md:h-[32vw] lg:h-auto lg:p-12">
        {/*
          Two different crops of one portrait frame. The panel is TALL at `lg`, where a centred crop
          puts the pupil's face at about half height; the band above the form is short and WIDE, so
          the same centred crop would slice the photo at the chin. `object-[50%_40%]` pulls the
          visible window up onto the face instead of the table below it.

          The band's height is a share of the VIEWPORT WIDTH, not a fixed pixel value, and that is
          what keeps the crop stable. `object-cover` scales the image to the band's width, so a fixed
          height shows a progressively thinner slice as the screen widens: at `h-56` on a 1023px
          screen this was a strip across the pupil's eyes, cut off at the mouth. Tying height to
          width holds the visible slice at a constant fraction of the frame, so every device in a
          step gets the same head-and-shoulders crop. Two steps rather than one because 45vw is
          right on a phone but 460px of photo on a wide tablet: `45vw` (~34% of the frame) below
          `md`, `32vw` (~24%) from `md` to `lg`, both of which keep the whole face in shot.

          `sizes` is what keeps this affordable on mobile data: without it Next assumes 100vw at
          every breakpoint and hands a desktop-width file to a phone.
        */}
        <Image
          src={BRAND.authPanelPhoto.src}
          alt=""
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
          className="object-cover object-[50%_40%] lg:object-center"
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

        {/* two blocks, not three, and the middle is deliberately empty: the placeholder's crest
            watermark sits at roughly half the panel's height, which is exactly where a
            vertically-centred motto used to land. Anchoring the words to the foot keeps the
            subject clear and lets the bottom gradient do double duty as the text's backing. */}
        <div className="relative">
          {/* The FULL name, not the initialism: this is the front door, and a parent arriving from
              a WhatsApp link may never have seen the short name written down. The parent shell
              spells it out for the same reason; staff chrome (sidebar, admin mobile bar) keeps the
              short lock — see BrandLock's own note. */}
          <BrandLock tone="light" name="full" crestClassName="size-11 rounded-xl" />
        </div>

        <div className="relative max-w-sm">
          <p className="text-[0.95rem] leading-snug font-semibold text-white lg:text-2xl">
            {BRAND.motto}
          </p>
          {/* Below `lg` the band is ~176px of a phone's first screen and the form has to stay
              reachable without scrolling, so the supporting lines are desktop-only. The motto alone
              carries the band. */}
          <p className="mt-3 hidden text-sm text-white/75 lg:block">
            Enrolment, attendance, results, fees, and parent communication — in one place.
          </p>
          <div className="mt-8 hidden space-y-2 lg:block">
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
