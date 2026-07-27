import { Mail, Phone } from "lucide-react";

import { Section } from "@/components/marketing/section";
import { CtaButton } from "@/components/marketing/cta-button";
import { FlyerPoster } from "@/components/marketing/flyer-poster";
import { SITE } from "@/lib/marketing/site";

/**
 * The homepage's closing action band — and the flyer's home on this page.
 *
 * The flyer lives here rather than in a section of its own because its own call to action is
 * "enroll now": it belongs at the point where the page asks for the action, after the story, the
 * features and the testimonial have done the persuading. This band is already `tone="brand"` deep
 * blue, so the flyer's navy-and-gold artwork reads as intentional against it, and folding the poster
 * in means the homepage gains no extra section.
 */
export function HomeAdmissionsCta() {
  return (
    <Section tone="brand" aria-labelledby="admissions-cta-title" className="overflow-hidden">
      <div className="relative grid items-center gap-14 lg:grid-cols-[28rem_1fr] lg:gap-20">
        {/* Copy first on a phone so the buttons stay near the top of the band; poster leads on
            desktop, where it anchors the left edge and the eye lands on it first. */}
        <FlyerPoster
          on="brand"
          className="reveal d1 order-2 self-center justify-self-center lg:order-1 lg:justify-self-start"
        />

        <div className="reveal order-1 mx-auto max-w-2xl text-center lg:order-2 lg:mx-0 lg:text-left">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--m-accent)]">
            {SITE.admissionsNote}
          </span>
          <h2
            id="admissions-cta-title"
            className="mt-4 text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-balance text-white"
          >
            Start your child&apos;s journey with us.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white">
            Registration for {SITE.admissionsYear} is open across every level. {SITE.earlyBird} Apply
            online, or book a visit to see our Oyarifa campus for yourself — we would love to meet
            your family.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start">
            <CtaButton href="/admissions" variant="gold" size="lg" withArrow>
              Apply for admission
            </CtaButton>
            <CtaButton href="/contact" variant="ghost-light" size="lg">
              Book a visit
            </CtaButton>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white lg:justify-start">
            <span className="flex items-center gap-2.5">
              <Phone className="size-4 shrink-0 text-[var(--m-accent)]" aria-hidden="true" />
              {SITE.contact.phones.map((phone, i) => (
                <span key={phone}>
                  {i > 0 ? <span className="text-white"> / </span> : null}
                  <a
                    href={`tel:${phone}`}
                    className="rounded-md outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                  >
                    {phone}
                  </a>
                </span>
              ))}
            </span>
            <a
              href={`mailto:${SITE.contact.email}`}
              className="flex items-center gap-2.5 rounded-md break-all outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              <Mail className="size-4 shrink-0 text-[var(--m-accent)]" aria-hidden="true" />
              {SITE.contact.email}
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}
