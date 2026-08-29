import Image from "next/image";

import { Section } from "@/components/marketing/section";
import { SITE } from "@/lib/marketing/site";
import { MEDIA } from "@/lib/marketing/media";
import { getMarketingSettings } from "@/lib/marketing/cms/read";
import { PostBody } from "@/components/marketing/news/post-body";

/**
 * "Who we are", the real, safe facts only: one campus, Daycare through JHS, in Oyarifa, a
 * community that gathers in person (as the community photos show). No founding date, enrollment
 * figure or named history is asserted (M4 honesty guard).
 *
 * The founding story is the one place on this site where the code deliberately had nothing to say: a
 * dashed callout asked the school to supply it. That callout is now the EMPTY STATE of a real field,
 * once someone writes "Our story" in the Studio, the invitation is replaced by their words. Until then
 * it still reads exactly as before, so nothing is invented in the meantime.
 */
export async function AboutWhoWeAre() {
  const { foundingStory } = await getMarketingSettings();

  return (
    <Section tone="warm" aria-labelledby="who-we-are-title">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="reveal">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--m-brand)]">
            Who we are
          </span>
          <h2
            id="who-we-are-title"
            className="mt-4 text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-balance"
          >
            One campus, every stage, one community.
          </h2>
          <div className="mt-6 space-y-5 text-lg leading-relaxed text-[var(--muted-foreground)]">
            <p>
              {SITE.name} ({SITE.shortName}) is a single campus in {SITE.location.lines.join(", ")}
              , {SITE.location.area} — offering every stage from Daycare through Junior High School
              under one roof, so a family only ever needs one school.
            </p>
            <p>
              We&apos;re a community first: parents, staff and children gather together for events
              on campus, not just drop-offs and pickups — the same familiar faces walk with your
              child for years, not just a term.
            </p>
          </div>

          {foundingStory ? (
            <div className="mt-8 border-l-2 border-[var(--m-accent)] pl-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--m-brand)]">
                Our story
              </p>
              <div className="mt-3 text-[var(--muted-foreground)]">
                <PostBody value={foundingStory} />
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--m-brand),white_40%)] bg-[var(--m-canvas)] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--m-brand)]">
                Editable — school to confirm
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                This is a good place for {SITE.shortName}&apos;s own founding story, in the
                school&apos;s own words — how it began, and what it set out to do. Add that story
                under &ldquo;Our story&rdquo; in Site settings; nothing is invented in its place.
              </p>
            </div>
          )}
        </div>

        <div className="reveal d1 grid gap-4 sm:grid-cols-2">
          <div className="relative aspect-[16/10] overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/[0.06] sm:col-span-2">
            <Image
              src={MEDIA.aboutPhoto.src}
              alt={MEDIA.aboutPhoto.alt}
              fill
              sizes="(min-width: 1024px) 36rem, 100vw"
              className="object-cover"
            />
          </div>
          <div className="relative col-span-2 aspect-[16/9] overflow-hidden rounded-3xl shadow-lg ring-1 ring-black/[0.06]">
            <Image
              src={MEDIA.community.src}
              alt={MEDIA.community.alt}
              fill
              sizes="(min-width: 1024px) 36rem, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
