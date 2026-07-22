import type { Metadata } from "next";

import { ComingSoonHero } from "@/components/marketing/coming-soon-hero";

export const metadata: Metadata = { title: "News" };

export default function NewsPage() {
  return (
    <ComingSoonHero
      eyebrow="News · Coming soon"
      title="Term dates, results and life around campus."
      blurb="Announcements, event highlights and WASSCE results will live here soon. Until then, follow along on social or reach out for the latest term calendar."
      symbol="nkyinkyim"
    />
  );
}
