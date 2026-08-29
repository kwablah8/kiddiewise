import { HomeHero } from "@/components/marketing/home/hero";
import { HomeIntro } from "@/components/marketing/home/intro";
import { HomePrograms } from "@/components/marketing/home/programs";
import { HomeOfferings } from "@/components/marketing/home/offerings";
import { HomeStatsBand } from "@/components/marketing/home/stats-band";
import { HomeTestimonial } from "@/components/marketing/home/testimonial";
import { HomeAdmissionsCta } from "@/components/marketing/home/admissions-cta";
import { HomeEnquiryFab } from "@/components/marketing/home/enquiry-fab";

/**
 * Marketing Home, the public root `/`. Server-rendered composition for Kiddiewise School Complex:
 * a photo hero, a warm welcome, the five real Daycare→JHS programs, the co-curricular life beyond
 * the classroom, the motto's values on a brand band, the school's promise, and the admissions call
 * to action, which carries the admission flyer. Alternating Section tones carry the page's rhythm.
 * A floating "Make an Enquiry" button (HomeEnquiryFab) stays fixed on-screen throughout, a
 * persistent shortcut to the enquiry form.
 *
 * `HomeStory` (the "look inside" video section) is deliberately not rendered: Kiddiewise has no
 * promo video yet, and a video section with no video is worse than no section. Add it back once
 * `MEDIA.promoVideo` points at a real file.
 */
export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeIntro />
      <HomePrograms />
      <HomeOfferings />
      <HomeStatsBand />
      <HomeTestimonial />
      <HomeAdmissionsCta />
      <HomeEnquiryFab />
    </>
  );
}
