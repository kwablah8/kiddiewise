"use client";

import { ChildTabs } from "@/components/parent/child-tabs";
import { TimetableView } from "@/components/timetable/timetable-view";
import { useChildTimetable } from "@/lib/queries/parent";

export function ChildTimetable({ id }: { id: string }) {
  const { data, isLoading, isError, refetch } = useChildTimetable(id);

  return (
    <div className="space-y-6">
      <ChildTabs childId={id} />
      <TimetableView entries={data} isLoading={isLoading} isError={isError} onRetry={refetch} />
    </div>
  );
}
