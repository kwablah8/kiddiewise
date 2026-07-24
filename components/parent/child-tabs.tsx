"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { lightFocusRingClass } from "@/lib/ui";

/** Section tabs within a child (Profile · Attendance). Results arrives in Slice 3. */
export function ChildTabs({ childId }: { childId: string }) {
  const pathname = usePathname();
  const base = `/parent/children/${childId}`;
  const tabs = [
    { label: "Profile", href: base, exact: true },
    { label: "Attendance", href: `${base}/attendance`, exact: false },
  ];

  return (
    <nav aria-label="Child sections" className="flex gap-1 border-b border-[var(--border)]">
      {tabs.map((t) => {
        const active = t.exact
          ? pathname === t.href
          : pathname === t.href || pathname.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative -mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-[var(--primary)] text-[var(--text)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--text)]",
              lightFocusRingClass,
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
