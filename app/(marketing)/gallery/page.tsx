import type { Metadata } from "next";

import { ComingSoonHero } from "@/components/marketing/coming-soon-hero";

export const metadata: Metadata = { title: "Gallery" };

export default function GalleryPage() {
  return (
    <ComingSoonHero
      eyebrow="Gallery · Coming soon"
      title="A look at classrooms, playing fields and the view."
      blurb="Photography of the campus, our students at work and play, and the Kwahu highlands is on its way. Book a visit if you'd like to see it in person first."
      symbol="aya"
    />
  );
}
