"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { APPLY_CTA, NAV_ITEMS, SITE, type NavItem } from "@/components/marketing/nav-config";
import { Wordmark } from "@/components/marketing/wordmark";
import { CtaButton } from "@/components/marketing/cta-button";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Public site header (docs/06-UI §8) — the one required client component in the shell.
 * It rides transparently over the dark hero at the top of every page, then settles into a
 * translucent white bar on scroll. Full keyboard support: skip link, visible focus, and a
 * mobile drawer that traps focus, closes on Escape, and returns focus to its trigger.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  // Drawer: lock scroll, focus the panel, trap Tab, Escape to close, restore focus on exit.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    const panel = panelRef.current;
    const focusables = panel
      ? panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
      : null;
    focusables?.[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab" || !focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, close]);

  const navLinkClass = (item: NavItem) => {
    const active = isActive(pathname, item.href);
    return cn(
      "relative rounded-md py-1 text-sm transition-colors outline-none focus-visible:ring-2",
      scrolled
        ? "focus-visible:ring-[var(--m-brand)]"
        : "focus-visible:ring-white focus-visible:ring-offset-0",
      active
        ? scrolled
          ? "text-[var(--m-brand)]"
          : "text-white"
        : scrolled
          ? "text-[var(--muted-foreground)] hover:text-[var(--text)]"
          : "text-white/80 hover:text-white",
    );
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[70] rounded-full bg-[var(--m-brand)] px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-300",
          scrolled
            ? "border-[var(--border)] bg-[color-mix(in_oklch,var(--surface),transparent_15%)] shadow-[0_1px_2px_rgba(16,24,40,0.05)] backdrop-blur-md"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:h-20 sm:px-8">
          <Link
            href="/"
            aria-label={`${SITE.name} — home`}
            className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--m-brand)]"
          >
            <Wordmark tone={scrolled ? "dark" : "light"} />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={navLinkClass(item)}
                >
                  {item.label}
                  {active ? (
                    <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-current" />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:block">
            <CtaButton href={APPLY_CTA.href} variant="gold" size="md" withArrow>
              {APPLY_CTA.label}
            </CtaButton>
          </div>

          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            className={cn(
              "flex size-10 items-center justify-center rounded-xl outline-none transition-colors focus-visible:ring-2 lg:hidden",
              scrolled
                ? "text-[var(--text)] hover:bg-black/[0.05] focus-visible:ring-[var(--m-brand)]"
                : "text-white hover:bg-white/10 focus-visible:ring-white",
            )}
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="absolute inset-0 bg-black/45 backdrop-blur-sm animate-in fade-in duration-200 motion-reduce:animate-none"
          />
          <div
            ref={panelRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-[var(--surface)] shadow-2xl animate-in slide-in-from-right duration-300 motion-reduce:animate-none"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
              <Wordmark tone="dark" />
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="flex size-10 items-center justify-center rounded-xl text-[var(--muted-foreground)] outline-none transition-colors hover:bg-black/[0.05] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--m-brand)]"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Mobile" className="flex flex-col gap-1 px-4 py-6">
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-xl px-4 py-3 text-base font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--m-brand)]",
                      active
                        ? "bg-[var(--m-warm)] text-[var(--m-brand)]"
                        : "text-[var(--text)] hover:bg-[var(--m-warm)]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-[var(--border)] px-6 py-6">
              <CtaButton
                href={APPLY_CTA.href}
                variant="gold"
                size="lg"
                withArrow
                onClick={close}
                className="w-full"
              >
                Apply for admission
              </CtaButton>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                {SITE.place}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
