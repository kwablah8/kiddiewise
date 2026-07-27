import { HomeHero } from "@/components/marketing/home/hero";
import { HomeIntro } from "@/components/marketing/home/intro";
import { HomePrograms } from "@/components/marketing/home/programs";
import { HomeOfferings } from "@/components/marketing/home/offerings";
import { HomeStatsBand } from "@/components/marketing/home/stats-band";
import { HomeStory } from "@/components/marketing/home/story";
import { HomeTestimonial } from "@/components/marketing/home/testimonial";
import { HomeAdmissionsCta } from "@/components/marketing/home/admissions-cta";
import { HomeEnquiryFab } from "@/components/marketing/home/enquiry-fab";

/**
 * Marketing Home — the public root `/`. Server-rendered composition for SNAB Learners
 * International School: a blue photo hero, a warm welcome, the five real Creche→JHS programs, the
 * co-curricular life beyond the classroom, the motto's values on a blue band, a look-inside video,
 * the school's promise, and the admissions call to action — which carries the admission flyer.
 * Alternating Section tones carry the page's rhythm. A floating "Make an Enquiry" button
 * (HomeEnquiryFab) stays fixed on-screen throughout, a persistent shortcut to the enquiry form.
 *
 * A "why families choose us" section sat between the story and the promise until the flyer landed.
 * It added no fact the page didn't already carry — its four claims restated the motto values on the
 * blue band in different words, and "every stage on one campus" repeats the programs section — so it
 * was cut to give the flyer's band more weight rather than pad the run-up to it.
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
      <HomeTestimonial />
      <HomeAdmissionsCta />
      <HomeEnquiryFab />
    </>
  );
}
