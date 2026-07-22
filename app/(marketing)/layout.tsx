import type { Metadata } from "next";

import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SITE } from "@/components/marketing/nav-config";

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: `${SITE.kind} on the Kwahu Plateau, Ghana. ${SITE.tagline}`,
};

/**
 * Public marketing shell (docs/06-UI §8) — its OWN layout: header + footer, no auth guard, no
 * app sidebar. A separate visual system from the authenticated portals, sharing only the brand
 * colour and the Geist typeface.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--surface)]">
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
