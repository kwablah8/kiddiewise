"use client";

import { useSession } from "@/lib/auth/useSession";
import { useParentChildren } from "@/lib/queries/parent";
import { ChildCard } from "@/components/parent/child-card";
import { AnnouncementsPanel } from "@/components/parent/announcements-panel";
import { EventsPanel } from "@/components/communication/events-panel";
import { CanteenMenuPanel } from "@/components/parent/canteen-menu-panel";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

export default function ParentDashboardPage() {
  const { profile } = useSession();
  const { data, isLoading, isError, refetch } = useParentChildren();
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">
          Welcome{profile ? `, ${profile.first_name}` : ""} 👋
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Keep track of your {data && data.length === 1 ? "child" : "children"} at a glance.
        </p>
      </div>

      <section aria-labelledby="children-heading" className="space-y-3">
        <h2 id="children-heading" className="text-base font-semibold text-[var(--text)]">
          Your children
        </h2>
        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-20 w-full" />
            ))}
          </div>
        )}
        {isError && (
          <div className={cn(cardShellClass)}>
            <ErrorState message="Couldn't load your children." onRetry={() => refetch()} />
          </div>
        )}
        {isEmpty && (
          <div className={cn(cardShellClass)}>
            <EmptyState
              title="No children linked yet"
              description="Once the school links your child to your account, they'll appear here."
            />
          </div>
        )}
        {!isLoading && !isError && !isEmpty && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {data?.map((child) => (
              <ChildCard key={child.id} child={child} />
            ))}
          </div>
        )}
      </section>

      <CanteenMenuPanel />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AnnouncementsPanel />
        <EventsPanel />
      </div>
    </div>
  );
}
