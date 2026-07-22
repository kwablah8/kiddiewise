import type { Metadata } from "next";

import { ComingSoonHero } from "@/components/marketing/coming-soon-hero";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <ComingSoonHero
      eyebrow="About · Coming soon"
      title="Our mission, our values, and the people behind SLIS."
      blurb="We're writing the full story of SNAB Learners International School — what we believe, how we care for children from Creche to JHS, and the team who make it real. In the meantime, admission is open and visitors are always welcome."
    />
  );
}
