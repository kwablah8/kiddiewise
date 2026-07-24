"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChildSwitcher } from "@/components/parent/child-switcher";
import { useSession } from "@/lib/auth/useSession";
import type { Profile } from "@/lib/types";
import { formatInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { lightFocusRingClass } from "@/lib/ui";

interface ParentShellProps {
  profile: Profile;
  children: ReactNode;
}

/** Lightweight top-bar shell for the read-only parent portal (spec §4.2) — wordmark, child switcher,
 *  and a name + sign-out. No admin sidebar. */
export function ParentShell({ profile, children }: ParentShellProps) {
  const { signOut } = useSession();
  const name = `${profile.first_name} ${profile.last_name}`;

  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Link
            href="/parent/dashboard"
            className={cn("text-sm font-semibold text-[var(--text)]", lightFocusRingClass)}
          >
            SNAB Learners
          </Link>

          <div className="ml-2 hidden sm:block">
            <ChildSwitcher />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-[var(--text)]">{name}</p>
              <p className="text-xs text-[var(--muted-foreground)]">Parent</p>
            </div>
            <Avatar className="size-9 shrink-0">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={name} />}
              <AvatarFallback className="bg-[var(--bg)] text-xs font-medium text-[var(--text)]">
                {formatInitials(profile.first_name, profile.last_name)}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg text-[var(--danger)] transition-colors hover:bg-[var(--danger)]/10",
                lightFocusRingClass,
              )}
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        {/* Child switcher moves below the bar on the narrowest screens */}
        <div className="border-t border-[var(--border)] px-4 py-2 sm:hidden">
          <ChildSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
    </div>
  );
}
