import Link from "next/link";
import { ArrowRight, MessageCircleQuestion } from "lucide-react";

/**
 * Floating "Make an Enquiry" button — a persistent, unmissable shortcut that lets a browsing parent
 * jump straight to the admissions enquiry form from anywhere on the home page (a softer, lower-
 * commitment action than the page's "Apply" CTAs). It's a plain link, so no client JS is needed.
 *
 * Layering: z-40 keeps it above page content but below the header (z-50) and the mobile menu
 * overlay (z-60), so an open menu cleanly covers it. `pb`-style safe-area inset keeps it clear of
 * the iOS home indicator. On the narrowest screens the label collapses to just the icon so it never
 * crowds the content; the accessible name is always present via `aria-label`.
 */
export function HomeEnquiryFab() {
  return (
    <Link
      href="/admissions#inquiry"
      aria-label="Make an enquiry — go to the admissions enquiry form"
      className="group fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 inline-flex items-center gap-2.5 rounded-full bg-[var(--m-accent)] px-4 py-3.5 font-semibold text-[var(--m-accent-ink)] shadow-[0_10px_30px_-8px_rgba(16,24,40,0.45)] outline-none transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--m-accent),black_8%)] hover:shadow-[0_16px_36px_-10px_rgba(16,24,40,0.5)] focus-visible:ring-2 focus-visible:ring-[var(--m-accent-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.97] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:right-6 sm:bottom-6 sm:px-6"
    >
      <MessageCircleQuestion className="size-5 shrink-0" aria-hidden="true" />
      <span className="text-[0.95rem] max-[380px]:sr-only">Make an Enquiry</span>
      <ArrowRight
        className="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 max-[380px]:hidden motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
        aria-hidden="true"
      />
    </Link>
  );
}
