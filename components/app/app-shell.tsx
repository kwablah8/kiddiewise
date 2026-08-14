"use client";

import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { BrandLock } from "@/components/brand/brand-lock";
import { Sidebar } from "@/components/app/sidebar";
import { useSession } from "@/lib/auth/useSession";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { lightFocusRingClass, navFocusRingClass } from "@/lib/ui";

interface AppShellProps {
  profile: Profile;
  children: ReactNode;
}

/** Fixed collapsible sidebar + light scrollable content canvas (06-UI §5). */
export function AppShell({ profile, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useSession();

  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      {/* Keyboard users land here first and can jump the whole sidebar in one Tab+Enter. Off-screen
          until focused, then pinned top-left over everything. */}
      <a
        href="#main-content"
        className="sr-only z-[110] rounded-md bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] shadow-md ring-2 ring-[var(--primary)] focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to main content
      </a>
      <Sidebar
        profile={profile}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onSignOut={signOut}
      />

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
          className={cn("fixed inset-0 z-30 bg-black/40 lg:hidden", navFocusRingClass)}
        />
      )}

      <div
        className={cn(
          "flex min-h-dvh flex-col transition-[padding-left] duration-200",
          collapsed ? "lg:pl-20" : "lg:pl-64",
        )}
      >
        <header className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className={cn(
              "flex size-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--bg)]",
              lightFocusRingClass,
            )}
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          {/* The mobile bar is the ONLY place staff see the identity on a phone — the navy sidebar
              is off-canvas until they open it — so it carries the crest, not just a word. */}
          <BrandLock tone="dark" compact crestClassName="size-8 rounded-lg" />
        </header>

        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
