import type { Metadata } from "next";

import { ComingSoonHero } from "@/components/marketing/coming-soon-hero";

export const metadata: Metadata = { title: "News" };

export default function NewsPage() {
  return (
    <ComingSoonHero
      eyebrow="News · Coming soon"
      title="Term dates, events and life around campus."
      blurb="Announcements, event highlights and term calendars will live here soon. Until then, reach out any time for the latest dates or to plan a visit."
    />
  );
}
