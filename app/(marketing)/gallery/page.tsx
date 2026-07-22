import type { Metadata } from "next";

import { ComingSoonHero } from "@/components/marketing/coming-soon-hero";

export const metadata: Metadata = { title: "Gallery" };

export default function GalleryPage() {
  return (
    <ComingSoonHero
      eyebrow="Gallery · Coming soon"
      title="A look at our classrooms, campus and community."
      blurb="Photos of the Oyarifa campus, our children at work and play, and life across every stage are on their way. Book a visit if you'd like to see it in person first."
    />
  );
}
