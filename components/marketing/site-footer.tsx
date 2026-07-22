import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { NAV_ITEMS, SITE, SOCIAL_LINKS } from "@/components/marketing/nav-config";
import { Wordmark } from "@/components/marketing/wordmark";

const focusRing =
  "rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[linear-gradient(160deg,var(--brand-top),var(--brand-bottom))] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1.2fr_1fr]">
          <div className="max-w-sm">
            <Wordmark tone="light" />
            <p className="mt-5 text-sm leading-relaxed text-white/70">
              {SITE.kind} on the {SITE.place.split(" · ")[0]}, educating curious, grounded young
              people from early years through the WASSCE since {SITE.foundedYear}.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-3">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">
              Explore
            </h2>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`w-fit text-sm text-white/75 hover:text-white ${focusRing}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-3">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">
              Visit us
            </h2>
            <address className="flex items-start gap-2.5 text-sm not-italic text-white/75">
              <MapPin className="mt-0.5 size-4 shrink-0 text-white/45" aria-hidden="true" />
              <span>{SITE.address}</span>
            </address>
            <a
              href={SITE.phoneHref}
              className={`flex items-center gap-2.5 text-sm text-white/75 hover:text-white ${focusRing}`}
            >
              <Phone className="size-4 shrink-0 text-white/45" aria-hidden="true" />
              {SITE.phoneDisplay}
            </a>
            <a
              href={`mailto:${SITE.email}`}
              className={`flex items-center gap-2.5 text-sm break-all text-white/75 hover:text-white ${focusRing}`}
            >
              <Mail className="size-4 shrink-0 text-white/45" aria-hidden="true" />
              {SITE.email}
            </a>
          </div>

          <nav aria-label="Social" className="flex flex-col gap-3">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">
              Follow along
            </h2>
            {SOCIAL_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className={`w-fit text-sm text-white/75 hover:text-white ${focusRing}`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE.name}. All rights reserved.
          </p>
          <p className="font-mono uppercase tracking-[0.15em]">{SITE.place}</p>
        </div>
      </div>
    </footer>
  );
}
