"use client";

import { useRouter } from "next/navigation";
import { FileCheck2 } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusPill } from "@/components/data/status-pill";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { useTeacherAssessments } from "@/lib/queries/assessments";
import type { AssessmentListItemVM } from "@/lib/validators/assessments";
import { formatDate } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";

export function TeacherAssessments({ teacherId }: { teacherId: string }) {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useTeacherAssessments(teacherId);
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

  const columns: DataTableColumn<AssessmentListItemVM>[] = [
    {
      key: "assessment",
      header: "Assessment",
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-[var(--text)]">{r.title}</p>
          <p className="truncate text-xs text-[var(--muted-foreground)]">{r.type_name}</p>
        </div>
      ),
    },
    { key: "class", header: "Class", render: (r) => `${r.class_name} · ${r.subject_name}` },
    {
      key: "term",
      header: "Term",
      render: (r) => <span className="text-[var(--muted-foreground)]">{r.term_name}</span>,
    },
    { key: "max", header: "Max", align: "right", render: (r) => r.max_score },
    {
      key: "date",
      header: "Date",
      render: (r) =>
        r.date ? (
          <span className="text-[var(--muted-foreground)]">{formatDate(r.date)}</span>
        ) : (
          <span className="text-[var(--muted-foreground)]">—</span>
        ),
    },
    {
      key: "results",
      header: "Results",
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <span className="text-[var(--muted-foreground)]">{r.result_count}</span>
          {r.is_submitted && <StatusPill label="Submitted" tone="success" />}
        </span>
      ),
    },
  ];

  return (
    <div className={cardShellClass}>
      {isError ? (
        <ErrorState message="Couldn't load your assessments." onRetry={() => refetch()} />
      ) : isEmpty ? (
        <EmptyState
          icon={FileCheck2}
          title="No assessments yet"
          description="Create an assessment for one of your class subjects to get started."
        />
      ) : (
        <DataTable
          columns={columns}
          data={data ?? []}
          getRowId={(r) => r.id}
          isLoading={isLoading}
          onRowClick={(r) => router.push(`/teacher/assessment/${r.id}`)}
          emptyTitle="No assessments yet"
          emptyDescription="Create an assessment to get started."
        />
      )}
    </div>
  );
}
