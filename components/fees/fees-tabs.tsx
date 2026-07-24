"use client";

import { cn } from "@/lib/utils";
import { lightFocusRingClass } from "@/lib/ui";

export const FEES_TABS = ["overview", "structure", "class", "extra", "payments"] as const;
export type FeesTab = (typeof FEES_TABS)[number];

const LABELS: Record<FeesTab, string> = {
  overview: "Overview",
  structure: "Fee Structure",
  class: "Class Fees",
  extra: "Extra Fees",
  payments: "Payment History",
};

/** Underline tab bar for the Fee Management sections. Scrolls horizontally on narrow screens. */
export function FeesTabs({ active, onChange }: { active: FeesTab; onChange: (tab: FeesTab) => void }) {
  return (
    <div className="overflow-x-auto">
      <nav className="flex min-w-max gap-1 border-b border-[var(--border)]" aria-label="Fee sections">
        {FEES_TABS.map((tab) => {
          const isActive = active === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onChange(tab)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative -mb-px border-b-2 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "border-[var(--primary)] text-[var(--text)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--text)]",
                lightFocusRingClass,
              )}
            >
              {LABELS[tab]}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
