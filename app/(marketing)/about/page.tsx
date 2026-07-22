import type { Metadata } from "next";

import { ComingSoonHero } from "@/components/marketing/coming-soon-hero";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <ComingSoonHero
      eyebrow="About · Coming soon"
      title="Our history, mission and the people on the ridge."
      blurb="We're writing the full story of Kwahu Ridge Academy — how we started in 1998, what we believe, and the teachers who make it real. In the meantime, admissions is open and visitors are always welcome."
      symbol="sankofa"
    />
  );
}
