import type { Metadata } from "next";

import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SITE } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} (${SITE.shortName}) — ${SITE.tagline}`,
    template: `%s · ${SITE.shortName}`,
  },
  description: `${SITE.motto} ${SITE.name} offers Creche through JHS in ${SITE.location.lines[0]}, ${SITE.location.area}. ${SITE.admissionsNote}.`,
};

/**
 * Public marketing shell (docs/06-UI §8) — its OWN layout: header + footer, no auth guard, no
 * app sidebar. Still a distinct visual system from the authenticated portals (editorial rhythm,
 * full-bleed photography, rounded CTAs), but it now shares their palette as well as the Geist
 * typeface: `data-brand="slis"` moved up to <html> in app/layout.tsx, so the SLIS blue/gold tokens
 * are global and this layout no longer needs to scope them.
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
