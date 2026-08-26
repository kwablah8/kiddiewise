"use client";

import { useState } from "react";
import { AnnouncementsTab } from "./announcements-tab";
import { EventsTab } from "./events-tab";
import { cn } from "@/lib/utils";
import { lightFocusRingClass } from "@/lib/ui";

const TABS = ["announcements", "events"] as const;
type Tab = (typeof TABS)[number];

const LABELS: Record<Tab, string> = {
  announcements: "Announcements",
  events: "Events",
};

/**
 * Two tabs rather than two sidebar entries.
 *
 * Announcements and events are the same job, telling the school something, and an admin who has
 * just written one often wants the other. Two nav rows would separate them by a click and grow a
 * sidebar that is already thirteen items long.
 */
export function CommunicationTabs() {
  const [tab, setTab] = useState<Tab>("announcements");

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <nav
          className="flex min-w-max gap-1 border-b border-[var(--border)]"
          aria-label="Communication sections"
        >
          {TABS.map((t) => {
            const isActive = tab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative -mb-px border-b-2 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "border-[var(--primary)] text-[var(--text)]"
                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--text)]",
                  lightFocusRingClass,
                )}
              >
                {LABELS[t]}
              </button>
            );
          })}
        </nav>
      </div>

      {tab === "announcements" ? <AnnouncementsTab /> : <EventsTab />}
    </div>
  );
}
