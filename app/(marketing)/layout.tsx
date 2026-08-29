import type { Metadata } from "next";

import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SITE } from "@/lib/marketing/site";
import { getMarketingSettings } from "@/lib/marketing/cms/read";

/**
 * `generateMetadata` rather than a static `metadata` export because the description names the
 * admissions year, which the school edits in the Studio. A static export would freeze it at build
 * time, so the year in Google's snippet would drift from the year on the page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { admissionsNote } = await getMarketingSettings();
  return {
    title: {
      default: `${SITE.name} (${SITE.shortName}) — ${SITE.tagline}`,
      template: `%s · ${SITE.shortName}`,
    },
    description: `${SITE.motto} ${SITE.name} offers Daycare through JHS in ${SITE.location.lines[0]}, ${SITE.location.area}. ${admissionsNote}.`,
  };
}

/**
 * Public marketing shell (docs/06-UI §8): its OWN layout: header + footer, no auth guard, no
 * app sidebar. Still a distinct visual system from the authenticated portals (editorial rhythm,
 * full-bleed photography, rounded CTAs), but it now shares their palette as well as the Geist
 * typeface: `data-brand="kiddiewise"` moved up to <html> in app/layout.tsx, so the crimson/gold
 * tokens are global and this layout no longer needs to scope them.
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
