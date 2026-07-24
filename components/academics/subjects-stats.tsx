"use client";

import { BookOpen, CircleCheck, CircleDashed, Layers } from "lucide-react";
import { MetricCard } from "@/components/data/metric-card";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { useSubjects } from "@/lib/queries/academics";
import { subjectStats } from "@/lib/academics";

/** Overview cards above the Subjects table. Shares `useSubjects` with the table (React Query dedupes),
 *  deriving the counts via the pure `subjectStats` helper — no separate stored status. */
export function SubjectsStats() {
  const { data, isLoading, isError } = useSubjects();

  // The table below owns the error + retry; the cards just stay out of the way on failure.
  if (isError) return null;

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-[124px] w-full" />
        ))}
      </div>
    );
  }

  const s = subjectStats(data);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard label="Total Subjects" value={String(s.total)} icon={BookOpen} tint="blue" />
      <MetricCard label="Assigned" value={String(s.assigned)} icon={CircleCheck} tint="green" />
      <MetricCard label="Unassigned" value={String(s.unassigned)} icon={CircleDashed} tint="amber" />
      <MetricCard label="Class Assignments" value={String(s.classAssignments)} icon={Layers} tint="indigo" />
    </div>
  );
}
