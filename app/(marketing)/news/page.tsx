import type { Metadata } from "next";

import { ComingSoonHero } from "@/components/marketing/coming-soon-hero";
import { NewsCard } from "@/components/marketing/news/news-card";
import { Section } from "@/components/marketing/section";
import { CtaButton } from "@/components/marketing/cta-button";
import { getMarketingSettings, getNewsPosts } from "@/lib/marketing/cms/read";

export const metadata: Metadata = { title: "News" };

/**
 * News — term dates, event write-ups and notices, written by the school in the Studio (01-REQ
 * "Marketing website": News).
 *
 * The four states (CLAUDE.md rule 4): **success** is the card grid; **empty** reuses the
 * `ComingSoonHero` this page has shipped since launch, which is already designed and honest — there is
 * genuinely nothing to read yet, and a bare "No posts" line would be a downgrade; **error** also lands
 * here, because `getNewsPosts()` cannot throw and logs the real cause server-side; **loading** is
 * `loading.tsx`, which only shows if the cached read has expired and a visitor arrives first.
 *
 * These posts are NOT the portal's `announcements`. That table is for signed-in parents and teachers
 * and is scoped by RLS; this is the outward-facing, indexable one. No sync between them, by design.
 */
export default async function NewsPage() {
  const [posts, settings] = await Promise.all([getNewsPosts(), getMarketingSettings()]);

  if (posts.length === 0) {
    return (
      <ComingSoonHero
        eyebrow="News · Coming soon"
        title="Term dates, events and life around campus."
        blurb="Announcements, event highlights and term calendars will live here soon. Until then, reach out any time for the latest dates or to plan a visit."
      />
    );
  }

  return (
    <>
      <Section
        tone="brand"
        aria-labelledby="news-hero-title"
        className="overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-24"
      >
        <div className="relative max-w-2xl reveal">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white">
            News
          </span>
          <h1
            id="news-hero-title"
            className="mt-6 text-[clamp(2.5rem,5.5vw,4rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance text-white"
          >
            Term dates, events and life around campus.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white sm:text-xl">
            What is happening at school, straight from us.
          </p>
        </div>
      </Section>

      <Section tone="white" aria-labelledby="news-list-title">
        <h2 id="news-list-title" className="sr-only">
          All news posts
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <NewsCard key={post.id} post={post} index={i} />
          ))}
        </div>
      </Section>

      <Section tone="brand" aria-labelledby="news-cta-title" className="overflow-hidden">
        <div className="relative mx-auto max-w-2xl text-center reveal">
          <h2
            id="news-cta-title"
            className="text-[clamp(1.8rem,3.4vw,2.4rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-balance text-white"
          >
            Thinking of joining us?
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white">
            {settings.admissionsNote} — start an inquiry or come and see the campus for yourself.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <CtaButton href="/admissions" variant="gold" size="lg" withArrow>
              Start an inquiry
            </CtaButton>
            <CtaButton href="/contact" variant="ghost-light" size="lg">
              Book a visit
            </CtaButton>
          </div>
        </div>
      </Section>
    </>
  );
}
