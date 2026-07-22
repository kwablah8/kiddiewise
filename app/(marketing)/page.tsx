import { HomeHero } from "@/components/marketing/home/hero";
import { HomeIntro } from "@/components/marketing/home/intro";
import { HomePrograms } from "@/components/marketing/home/programs";
import { HomeStatsBand } from "@/components/marketing/home/stats-band";
import { HomeFeatures } from "@/components/marketing/home/features";
import { HomeTestimonial } from "@/components/marketing/home/testimonial";
import { HomeAdmissionsCta } from "@/components/marketing/home/admissions-cta";

/**
 * Marketing Home — the public root `/`. Server-rendered composition of the funnel: a maroon hero,
 * a warm welcome, the three school stages, a stats band, the reasons families choose us, a parent
 * voice, and the admissions call to action. Alternating Section tones carry the page's rhythm.
 */
export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeIntro />
      <HomePrograms />
      <HomeStatsBand />
      <HomeFeatures />
      <HomeTestimonial />
      <HomeAdmissionsCta />
    </>
  );
}
