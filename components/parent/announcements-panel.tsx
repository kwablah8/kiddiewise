"use client";

import { ListPanel } from "@/components/data/list-panel";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { ErrorState } from "@/components/states/error-state";
import { useParentAnnouncements } from "@/lib/queries/parent";
import { formatDate } from "@/lib/format";

export function AnnouncementsPanel() {
  const { data, isLoading, isError, refetch } = useParentAnnouncements();
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

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
          {data?.map((a) => (
            <li key={a.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-[var(--text)]">{a.title}</p>
                <span className="shrink-0 text-xs whitespace-nowrap text-[var(--muted-foreground)]">
                  {formatDate(a.created_at)}
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
