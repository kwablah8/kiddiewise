"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useLiveParentNotifications, useUnreadNotificationCount } from "@/lib/queries/gate";
import { cn } from "@/lib/utils";
import { lightFocusRingClass } from "@/lib/ui";

/** The portal's bell. It also holds the live subscription, so notices arrive on whatever page is open. */
export function NotificationsBell({ parentId }: { parentId: string }) {
  useLiveParentNotifications(parentId);
  const { data: unread = 0 } = useUnreadNotificationCount();
  const label = unread > 0 ? `Notifications, ${unread} unread` : "Notifications";

  return (
    <Link
      href="/parent/notifications"
      aria-label={label}
      title={label}
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center rounded-lg text-[var(--text)] transition-colors hover:bg-[var(--bg)]",
        lightFocusRingClass,
      )}
    >
      <Bell className="size-5" aria-hidden="true" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] leading-4.5 font-semibold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
