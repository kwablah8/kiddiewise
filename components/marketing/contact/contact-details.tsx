import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { PhotoSlot } from "@/components/marketing/photo-slot";
import { SITE } from "@/lib/marketing/site";
import { getMarketingSettings } from "@/lib/marketing/cms/read";

// The address stays at module scope: `SITE.location` is code-owned and cannot change at runtime.
const fullAddress = `${SITE.location.lines.join(", ")}, ${SITE.location.area}`;

/**
 * Contact details card: address/phone/email/hours + a map placeholder (01-REQ "Contact").
 *
 * Phone, email and hours are editable by the school, so `ROWS` is built per render rather than once at
 * module load, a module-scope constant would freeze whatever the values were when the process started
 * and never pick up an edit.
 */
export async function ContactDetails() {
  const { contact, hours } = await getMarketingSettings();

  const ROWS = [
    { icon: MapPin, label: "Address", value: fullAddress, href: undefined },
    {
      icon: Phone,
      label: "Phone",
      value: contact.phones.join(" / "),
      href: `tel:${contact.phones[0]}`,
    },
    {
      icon: Mail,
      label: "Email",
      value: contact.email,
      href: `mailto:${contact.email}`,
    },
  ] as const;

  return (
    <div className="reveal space-y-8">
      <dl className="space-y-5">
        {ROWS.map((row) => {
          const Icon = row.icon;
          const content = row.href ? (
            <a
              href={row.href}
              className="rounded-md text-base break-words text-[var(--text)] outline-none transition-colors hover:text-[var(--m-brand)] focus-visible:ring-2 focus-visible:ring-[var(--m-brand)] focus-visible:ring-offset-2"
            >
              {row.value}
            </a>
          ) : (
            <span className="text-base text-[var(--text)]">{row.value}</span>
          );
          return (
            <div key={row.label} className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--m-brand),white_90%)] text-[var(--m-brand)]">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  {row.label}
                </dt>
                <dd className="mt-1">{row.label === "Address" ? <address className="not-italic">{content}</address> : content}</dd>
              </div>
            </div>
          );
        })}

        {/* Office hours: multi-line (weekday / weekend) plus the weekend community drop-off note. */}
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--m-brand),white_90%)] text-[var(--m-brand)]">
            <Clock className="size-5" aria-hidden="true" />
          </span>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              Office hours
            </dt>
            <dd className="mt-1 space-y-0.5">
              {hours.entries.map((entry) => (
                <p key={entry.days} className="text-base text-[var(--text)]">
                  <span className="font-medium">{entry.days}</span>
                  <span className="text-[var(--muted-foreground)]"> · {entry.time}</span>
                </p>
              ))}
              {hours.note ? (
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {hours.note}
                </p>
              ) : null}
            </dd>
          </div>
        </div>
      </dl>

      {/* TODO: real map embed, or a static map image served from Storage */}
      <PhotoSlot
        label={`Map — ${fullAddress}`}
        aspect="4 / 3"
        tone="neutral"
        className="shadow-lg"
      />
    </div>
  );
}
