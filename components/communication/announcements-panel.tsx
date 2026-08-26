"use client";

import { ListPanel } from "@/components/data/list-panel";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { ErrorState } from "@/components/states/error-state";
import { useAnnouncements } from "@/lib/queries/communication";
import { formatDate } from "@/lib/format";

/**
 * Announcements for a portal dashboard.
 *
 * Shares `useAnnouncements` with the admin screen on purpose: `ann_read` decides what comes back,
 * so a teacher gets published teacher/everyone rows from the same query that shows an admin their
 * drafts. Filtering by role here would put the rule in two places and let them drift.
 */
export function AnnouncementsPanel({ limit = 5 }: { limit?: number }) {
  const { data, isLoading, isError, refetch } = useAnnouncements();
  // Drafts are excluded even for an admin viewing a portal dashboard, a dashboard shows what the
  // school has actually said, not what it is still writing.
  const published = (data ?? []).filter((a) => a.is_published).slice(0, limit);
  const isEmpty = !isLoading && !isError && published.length === 0;

  return (
    <ListPanel
      title="Announcements"
      isEmpty={isEmpty}
      emptyTitle="No announcements"
      emptyDescription="School announcements will appear here."
    >
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-14 w-full" />
          ))}
        </div>
      )}
      {isError && <ErrorState message="Couldn't load announcements." onRetry={() => refetch()} />}
      {!isLoading && !isError && !isEmpty && (
        <ul className="divide-y divide-[var(--border)]">
          {published.map((a) => (
            <li key={a.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-[var(--text)]">{a.title}</p>
                <span className="shrink-0 text-xs whitespace-nowrap text-[var(--muted-foreground)]">
                  {formatDate(a.published_at ?? a.created_at)}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{a.body}</p>
            </li>
          ))}
        </ul>
      )}
    </ListPanel>
  );
}
