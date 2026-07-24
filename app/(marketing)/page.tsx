import { HomeHero } from "@/components/marketing/home/hero";
import { HomeIntro } from "@/components/marketing/home/intro";
import { HomePrograms } from "@/components/marketing/home/programs";
import { HomeOfferings } from "@/components/marketing/home/offerings";
import { HomeStatsBand } from "@/components/marketing/home/stats-band";
import { HomeStory } from "@/components/marketing/home/story";
import { HomeFeatures } from "@/components/marketing/home/features";
import { HomeTestimonial } from "@/components/marketing/home/testimonial";
import { HomeAdmissionsCta } from "@/components/marketing/home/admissions-cta";
import { HomeEnquiryFab } from "@/components/marketing/home/enquiry-fab";

/**
 * Marketing Home — the public root `/`. Server-rendered composition for SNAB Learners
 * International School: a blue photo hero, a warm welcome, the five real Creche→JHS programs, the
 * co-curricular life beyond the classroom, the motto's values on a blue band, a look-inside video,
 * why families choose us, the school's promise, and the admissions call to action. Alternating
 * Section tones carry the page's rhythm. A floating "Make an Enquiry" button (HomeEnquiryFab)
 * stays fixed on-screen throughout, giving parents a persistent shortcut to the enquiry form.
 */
export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeIntro />
      <HomePrograms />
      <HomeOfferings />
      <HomeStatsBand />
      <HomeStory />
      <HomeFeatures />
      <HomeTestimonial />
      <HomeAdmissionsCta />
      <HomeEnquiryFab />
    </>
  );
}
