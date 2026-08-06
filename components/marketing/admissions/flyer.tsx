import { Tag } from "lucide-react";

import { Section } from "@/components/marketing/section";
import { CtaButton } from "@/components/marketing/cta-button";
import { FlyerPoster } from "@/components/marketing/flyer-poster";
import { getMarketingSettings } from "@/lib/marketing/cms/read";

/**
 * The admission flyer on `/admissions`, placed immediately before the inquiry form — the page's
 * highest-intent position, where a parent who has just read the requirements is closest to acting.
 *
 * `tone="brand"` does two jobs: it keeps the page's band rhythm alternating (warm → brand → white
 * into the form) and puts the flyer's navy-and-gold artwork on the one background that flatters it.
 *
 * Note the split: the flyer IMAGE is still a committed asset (`MEDIA.flyer`, swapped by a developer
 * once a year), while the copy beside it — the year and the early-bird sentence — is school-editable.
 * Whoever replaces next year's artwork should check that the two still agree.
 */
export async function AdmissionsFlyer() {
  const { admissionsNote, admissionsYear, earlyBird } = await getMarketingSettings();

  return (
    <Section tone="brand" aria-labelledby="flyer-title" className="overflow-hidden">
      <div className="grid items-center gap-14 lg:grid-cols-[28rem_1fr] lg:gap-20">
        <FlyerPoster
          on="brand"
          className="reveal order-2 self-center justify-self-center lg:order-1 lg:justify-self-start"
        />

        <div className="reveal d1 order-1 mx-auto max-w-xl lg:order-2 lg:mx-0">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--m-accent)]">
            {admissionsNote}
          </span>
          <h2
            id="flyer-title"
            className="mt-4 text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-balance text-white"
          >
            Everything on one page.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white">
            Our {admissionsYear} admission flyer lists every level we admit, what the campus
            offers, and the numbers to call. Save it, print it for the noticeboard, or send it on to
            a family still looking for a school.
          </p>

          <p className="mt-7 flex items-start gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--m-accent),transparent_70%)] bg-white/[0.06] px-4 py-3.5 leading-relaxed text-white">
            <Tag className="mt-0.5 size-5 shrink-0 text-[var(--m-accent)]" aria-hidden="true" />
            {earlyBird}
          </p>

          <div className="mt-9">
            <CtaButton href="#inquiry" variant="gold" size="lg" withArrow>
              Start an inquiry
            </CtaButton>
          </div>
        </div>
      </div>
    </Section>
  );
}
