"use client";

import { useEffect } from "react";
import { Bell, LogIn, LogOut } from "lucide-react";
import { StatusPill } from "@/components/data/status-pill";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { useGateSettings, useMarkNotificationsRead, useParentNotifications } from "@/lib/queries/gate";
import { localParts } from "@/lib/gate";
import { formatClockTime, formatDate } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";
import type { ParentNotificationVM } from "@/lib/validators/gate";

/** A guardian's gate notices, newest first and grouped by day. Opening the page marks them read. */
export function NotificationsList() {
  const notices = useParentNotifications();
  const settings = useGateSettings();
  const { mutate: markRead } = useMarkNotificationsRead();

  // Opening the page reads what's on it. Once marked, the refetch returns them read and this settles.
  useEffect(() => {
    const ids = (notices.data ?? []).filter((n) => !n.read).map((n) => n.id);
    if (ids.length > 0) markRead({ ids });
  }, [notices.data, markRead]);

  if (notices.isError || settings.isError) {
    return (
      <div className={cardShellClass}>
        <ErrorState message="Couldn't load your notifications." onRetry={() => notices.refetch()} />
      </div>
    );
  }
  if (notices.isLoading || settings.isLoading || !settings.data) {
    return <SkeletonBlock className="h-48 w-full" />;
  }

  const tz = settings.data.timezone;
  if ((notices.data ?? []).length === 0) {
    return (
      <div className={cardShellClass}>
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="When your child checks in or out at the school gate, you'll see it here."
        />
      </div>
    );
  }

  const today = localParts(new Date(), tz).date;
  const dayBefore = new Date(`${today}T12:00:00Z`);
  dayBefore.setUTCDate(dayBefore.getUTCDate() - 1);
  const yesterday = dayBefore.toISOString().slice(0, 10);
  const groups = new Map<string, ParentNotificationVM[]>();
  for (const n of notices.data!) {
    const day = localParts(new Date(n.occurred_at), tz).date;
    groups.set(day, [...(groups.get(day) ?? []), n]);
  }

  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([day, items]) => (
        <section key={day} aria-label={day} className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--muted-foreground)]">
            {day === today ? "Today" : day === yesterday ? "Yesterday" : formatDate(`${day}T12:00:00Z`)}
          </h2>
          <ul className={cn(cardShellClass, "divide-y divide-[var(--border)] p-0")}>
            {items.map((n) => (
              <li
                key={n.id}
                className={cn("flex items-center gap-3 px-4 py-3", !n.read && "bg-[var(--primary)]/5")}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    n.event === "arrived" ? "bg-[var(--success-bg)] text-[var(--success-fg)]" : "bg-[var(--bg)] text-[var(--text)]",
                  )}
                >
                  {n.event === "arrived" ? (
                    <LogIn className="size-4" aria-hidden="true" />
                  ) : (
                    <LogOut className="size-4" aria-hidden="true" />
                  )}
                </span>
                <p className="min-w-0 flex-1 text-sm text-[var(--text)]">
                  <span className="font-medium">{n.student_name}</span>{" "}
                  {n.event === "arrived" ? "arrived at school" : "left school"} at{" "}
                  {formatClockTime(n.occurred_at, tz)}
                </p>
                {n.event === "arrived" && n.late && <StatusPill label="Late" tone="warning" />}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
