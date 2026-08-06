import type { Metadata } from "next";

import { Section } from "@/components/marketing/section";
import { CtaButton } from "@/components/marketing/cta-button";
import { GalleryGrid } from "@/components/marketing/gallery/gallery-grid";
import { SITE } from "@/lib/marketing/site";
import { getGalleryPhotos, getMarketingSettings } from "@/lib/marketing/cms/read";

export const metadata: Metadata = { title: "Gallery" };

/**
 * Gallery — real photos of the campus, classrooms and community (01-REQ "Marketing website": Gallery).
 * A masonry grid opens each photo in a focus-trapped lightbox.
 *
 * Photos come from the school's own uploads in the Studio, falling back to the committed set in
 * `MEDIA.gallery` when there are none. `SITE.location` is read directly because the campus address is
 * code-owned; the admissions line is not, so it comes from the settings reader.
 */
export default async function GalleryPage() {
  const [photos, settings] = await Promise.all([getGalleryPhotos(), getMarketingSettings()]);

  return (
    <>
      <Section
        tone="brand"
        aria-labelledby="gallery-hero-title"
        className="overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-24"
      >
        <div className="relative max-w-2xl reveal">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white">
            Gallery
          </span>
          <h1
            id="gallery-hero-title"
            className="mt-6 text-[clamp(2.5rem,5.5vw,4rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance text-white"
          >
            A look at our classrooms, campus and community.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white sm:text-xl">
            Real photos from our {SITE.location.lines[0]} campus — click any photo to see it
            larger.
          </p>
        </div>
      </Section>

      <Section tone="white" aria-labelledby="gallery-grid-title">
        <h2 id="gallery-grid-title" className="sr-only">
          Photo gallery
        </h2>
        <GalleryGrid photos={photos} />
      </Section>

      <Section tone="brand" aria-labelledby="gallery-cta-title" className="overflow-hidden">
        <div className="relative mx-auto max-w-2xl text-center reveal">
          <h2
            id="gallery-cta-title"
            className="text-[clamp(1.8rem,3.4vw,2.4rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-balance text-white"
          >
            Want to see it in person?
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white">
            Book a visit to tour the campus yourself, or start an inquiry today —{" "}
            {settings.admissionsNote}.
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
