import { HomeHero } from "@/components/marketing/home/hero";
import { HomeIntro } from "@/components/marketing/home/intro";
import { HomePrograms } from "@/components/marketing/home/programs";
import { HomeStatsBand } from "@/components/marketing/home/stats-band";
import { HomeStory } from "@/components/marketing/home/story";
import { HomeFeatures } from "@/components/marketing/home/features";
import { HomeTestimonial } from "@/components/marketing/home/testimonial";
import { HomeAdmissionsCta } from "@/components/marketing/home/admissions-cta";

/**
 * Marketing Home — the public root `/`. Server-rendered composition for SNAB Learners
 * International School: a blue photo hero, a warm welcome, the five real Creche→JHS programs, the
 * motto's values on a blue band, a look-inside video, why families choose us, the school's
 * promise, and the admissions call to action. Alternating Section tones carry the page's rhythm.
 */
export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeIntro />
      <HomePrograms />
      <HomeStatsBand />
      <HomeStory />
      <HomeFeatures />
      <HomeTestimonial />
      <HomeAdmissionsCta />
    </>
  );
}
