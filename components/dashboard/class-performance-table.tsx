"use client";

import { ErrorState } from "@/components/states/error-state";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusPill, type StatusTone } from "@/components/data/status-pill";
import { cardShellClass } from "@/lib/ui";
import { useClassPerformance } from "@/lib/queries/dashboard";
import type { ClassPerformanceVM } from "@/lib/validators/dashboard";

/** Score bands -> a real label + tone, never color alone (06-UI §11). */
function performanceBand(score: number | null): { label: string; tone: StatusTone } {
  if (score === null) return { label: "No data", tone: "neutral" };
  if (score >= 80) return { label: "Excellent", tone: "success" };
  if (score >= 70) return { label: "Good", tone: "success" };
  if (score >= 60) return { label: "Average", tone: "warning" };
  return { label: "Needs Attention", tone: "danger" };
}

const columns: DataTableColumn<ClassPerformanceVM>[] = [
  { key: "class_name", header: "Class Name", render: (row) => row.class_name },
  { key: "level", header: "Level", render: (row) => row.level },
  { key: "students", header: "Students", align: "right", render: (row) => row.students },
  {
    key: "average_score",
    header: "Average Score",
    align: "right",
    render: (row) => (row.average_score === null ? "—" : row.average_score.toFixed(1)),
  },
  {
    key: "performance",
    header: "Performance",
    render: (row) => {
      const { label, tone } = performanceBand(row.average_score);
      return <StatusPill label={label} tone={tone} />;
    },
  },
];

/** Class Performance Overview table (01-REQ Admin §Dashboard, 06-UI §5). */
export function ClassPerformanceTable() {
  const { data, isLoading, isError, refetch } = useClassPerformance();

  return (
    <section className={cardShellClass}>
      <div>
        <h3 className="text-base font-semibold text-[var(--text)]">
          Class Performance Overview
        </h3>
        <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
          Enrollment and average scores by class
        </p>
      </div>
      <div className="mt-4">
        {isError ? (
          <ErrorState
            message="Couldn't load class performance."
            onRetry={() => refetch()}
          />
        ) : (
          <DataTable
            columns={columns}
            data={data ?? []}
            getRowId={(row) => row.class_id}
            isLoading={isLoading}
            emptyTitle="No classes yet"
            emptyDescription="Class performance will appear here once classes have students and recorded results."
          />
        )}
      </div>
    </section>
  );
}
