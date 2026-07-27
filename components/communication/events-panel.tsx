"use client";

import { ListPanel } from "@/components/data/list-panel";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { ErrorState } from "@/components/states/error-state";
import { useUpcomingEvents } from "@/lib/queries/communication";
import { formatDate } from "@/lib/format";

/** Upcoming school events, for the teacher and parent dashboards. Past events are filtered out server-side. */
export function EventsPanel() {
  const { data, isLoading, isError, refetch } = useUpcomingEvents();
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

  return (
    <ListPanel
      title="Upcoming events"
      isEmpty={isEmpty}
      emptyTitle="Nothing coming up"
      emptyDescription="Events on the school calendar will appear here."
    >
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-14 w-full" />
          ))}
        </div>
      )}
      {isError && <ErrorState message="Couldn't load events." onRetry={() => refetch()} />}
      {!isLoading && !isError && !isEmpty && (
        <ul className="divide-y divide-[var(--border)]">
          {data?.map((e) => (
            <li key={e.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-[var(--text)]">{e.title}</p>
                <span className="shrink-0 text-xs whitespace-nowrap text-[var(--muted-foreground)]">
                  {formatDate(e.start_at)}
                </span>
              </div>
              {(e.location || e.description) && (
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {[e.location, e.description].filter(Boolean).join(" · ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </ListPanel>
  );
}
