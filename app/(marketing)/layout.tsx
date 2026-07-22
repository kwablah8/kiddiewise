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
 * app sidebar. A separate visual system from the authenticated portals, sharing only the Geist
 * typeface — NOT the brand colour: `data-brand="slis"` scopes the SLIS blue/gold tokens
 * (app/globals.css) to this subtree only, leaving the app portal's maroon/green untouched.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-brand="slis" className="flex min-h-dvh flex-col bg-[var(--surface)]">
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
