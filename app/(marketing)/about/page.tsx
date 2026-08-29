import type { Metadata } from "next";

import { Section } from "@/components/marketing/section";
import { AboutMissionVision } from "@/components/marketing/about/mission-vision";
import { AboutWhoWeAre } from "@/components/marketing/about/who-we-are";
import { AboutCrestValues } from "@/components/marketing/about/crest-values";
import { AboutProgramsOverview } from "@/components/marketing/about/programs-overview";
import { HomeAdmissionsCta } from "@/components/marketing/home/admissions-cta";
import { SITE } from "@/lib/marketing/site";

export const metadata: Metadata = { title: "About" };

/**
 * About: the real, honest story (01-REQ "Marketing website": About): motto hero, mission &
 * vision drawn from the school's own positioning, a "who we are" narrative grounded in confirmed
 * facts only (one Oyarifa campus, Daycare → JHS, community-centered), the crest + motto values,
 * campus/community photos, and a programs recap linking to Admissions. No fabricated history,
 * enrollment figures, awards or named people, see `AboutWhoWeAre`'s editable placeholder callout.
 */
export default function AboutPage() {
  return (
    <>
      <Section
        tone="brand"
        aria-labelledby="about-hero-title"
        className="overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-24"
      >
        <div className="relative max-w-2xl reveal">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white">
            About {SITE.shortName}
          </span>
          <h1
            id="about-hero-title"
            className="mt-6 text-[clamp(2.5rem,5.5vw,4rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance text-white"
          >
            {SITE.motto}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white sm:text-xl">
            {SITE.name} guides children from Daycare through Junior High School on one campus in{" "}
            {SITE.location.lines[0]} — this is what we believe, and how we try to live it out
            every day.
          </p>
        </div>
      </Section>

      <AboutMissionVision />
      <AboutWhoWeAre />
      <AboutCrestValues />
      <AboutProgramsOverview />
      <HomeAdmissionsCta />
    </>
  );
}
