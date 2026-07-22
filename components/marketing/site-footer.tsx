import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { NAV_ITEMS } from "@/components/marketing/nav-config";
import { Wordmark } from "@/components/marketing/wordmark";
import { SITE } from "@/lib/marketing/site";

const focusRing =
  "rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[linear-gradient(160deg,var(--m-brand),var(--m-brand-deep))] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1.4fr]">
          <div className="max-w-sm">
            <Wordmark tone="light" />
            {/* Solid white: measured against the real gradient box, this column sits close enough
                to the lighter --m-brand end that white/70 fell to ~3.9-4.2:1 (fails AA). */}
            <p className="mt-5 text-sm leading-relaxed text-white">
              {SITE.motto} {SITE.name} welcomes learners from Creche through Junior High School in{" "}
              {SITE.location.lines[0]}, {SITE.location.area}.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--m-accent)] px-3.5 py-1.5 text-[13px] font-semibold text-[var(--m-accent-ink)]">
              {SITE.admissionsNote}
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-3">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-white">
              Explore
            </h2>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`w-fit text-sm text-white hover:underline ${focusRing}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-3">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-white">
              Visit us
            </h2>
            <address className="flex items-start gap-2.5 text-sm not-italic text-white">
              <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--m-accent)]" aria-hidden="true" />
              <span>
                {SITE.location.lines.join(", ")}, {SITE.location.area}
              </span>
            </address>
            <div className="flex items-start gap-2.5 text-sm text-white">
              <Phone className="mt-0.5 size-4 shrink-0 text-[var(--m-accent)]" aria-hidden="true" />
              <span className="flex flex-col gap-1">
                {SITE.contact.phones.map((phone) => (
                  <a
                    key={phone}
                    href={`tel:${phone}`}
                    className={`w-fit hover:underline ${focusRing}`}
                  >
                    {phone}
                  </a>
                ))}
              </span>
            </div>
            <a
              href={`mailto:${SITE.contact.email}`}
              className={`flex items-center gap-2.5 text-sm break-all text-white hover:underline ${focusRing}`}
            >
              <Mail className="size-4 shrink-0 text-[var(--m-accent)]" aria-hidden="true" />
              {SITE.contact.email}
            </a>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs text-white sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE.name}. All rights reserved.
          </p>
          <p className="font-mono uppercase tracking-[0.15em]">
            {SITE.location.lines[0]} · {SITE.location.area}
          </p>
        </div>
      </div>
    </footer>
  );
}
