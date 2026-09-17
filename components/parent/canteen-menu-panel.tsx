"use client";

import { ListPanel } from "@/components/data/list-panel";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { ErrorState } from "@/components/states/error-state";
import { usePublishedCanteenMenu } from "@/lib/queries/canteen";
import { WEEKDAY_LABEL } from "@/lib/validators/canteen";

/** The published half of the school's weekly canteen menu — a day with nothing published yet just doesn't appear. */
export function CanteenMenuPanel() {
  const { data, isLoading, isError, refetch } = usePublishedCanteenMenu();
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

  return (
    <ListPanel
      title="This week's canteen menu"
      isEmpty={isEmpty}
      emptyTitle="No menu posted yet"
      emptyDescription="The school hasn't published this week's canteen menu yet."
    >
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-12 w-full" />
          ))}
        </div>
      )}
      {isError && <ErrorState message="Couldn't load the canteen menu." onRetry={() => refetch()} />}
      {!isLoading && !isError && !isEmpty && (
        <ul className="divide-y divide-[var(--border)]">
          {data?.map((item) => (
            <li key={item.id} className="py-3 first:pt-0 last:pb-0">
              <p className="text-sm font-medium text-[var(--text)]">{WEEKDAY_LABEL[item.day_of_week]}</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{item.description}</p>
            </li>
          ))}
        </ul>
      )}
    </ListPanel>
  );
}
