"use client";

import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { CheckinsTab } from "@/components/gate/checkins-tab";
import { DeviceNumbersTab } from "@/components/gate/device-numbers-tab";
import { GateSettingsTab } from "@/components/gate/gate-settings-tab";
import { ErrorState } from "@/components/states/error-state";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { useGateSettings } from "@/lib/queries/gate";
import { localParts } from "@/lib/gate";
import { cardShellClass, lightFocusRingClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "checkins", label: "Check-ins" },
  { id: "numbers", label: "Device numbers" },
  { id: "settings", label: "Settings" },
] as const;
type Tab = (typeof TABS)[number]["id"];

/** Scans from the fingerprint device at the gate: who came in and when, and how it is set up. */
export default function AttendancePage() {
  const [tab, setTab] = useState<Tab>("checkins");
  const settings = useGateSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        subtitle="Gate check-ins from the fingerprint device, for students and staff."
      />

      <div className="overflow-x-auto">
        <nav className="flex min-w-max gap-1 border-b border-[var(--border)]" aria-label="Attendance sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={cn(
                "relative -mb-px border-b-2 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                tab === t.id
                  ? "border-[var(--primary)] text-[var(--text)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--text)]",
                lightFocusRingClass,
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {settings.isError ? (
        <div className={cardShellClass}>
          <ErrorState message="Couldn't load the school's gate settings." onRetry={() => settings.refetch()} />
        </div>
      ) : !settings.data ? (
        <SkeletonBlock className="h-48 w-full" />
      ) : tab === "checkins" ? (
        <CheckinsTab
          timeZone={settings.data.timezone}
          today={localParts(new Date(), settings.data.timezone).date}
        />
      ) : tab === "numbers" ? (
        <DeviceNumbersTab />
      ) : (
        <GateSettingsTab key={`${settings.data.late_after}-${settings.data.leaving_from}`} settings={settings.data} />
      )}
    </div>
  );
}
