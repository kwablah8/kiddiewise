"use client";

import { useState } from "react";
import { FileCheck2, Pencil, Plus } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { AssessmentTypeFormDialog } from "./assessment-type-form";
import { useAssessmentTypes } from "@/lib/queries/grading";
import { assessmentTypeWeightTotal } from "@/lib/grading";
import type { AssessmentTypeVM } from "@/lib/validators/grading";
import { cardShellClass } from "@/lib/ui";

export function AssessmentTypesCard() {
  const { data, isLoading, isError, refetch } = useAssessmentTypes();
  const [createOpen, setCreateOpen] = useState(false);
  const [editType, setEditType] = useState<AssessmentTypeVM | null>(null);
  const [key, setKey] = useState(0);
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;
  const total = data ? assessmentTypeWeightTotal(data) : 0;

  const columns: DataTableColumn<AssessmentTypeVM>[] = [
    { key: "name", header: "Type", render: (r) => <span className="font-medium text-[var(--text)]">{r.name}</span> },
    { key: "weight", header: "Weight", align: "right", render: (r) => `${r.weight}%` },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Edit ${r.name}`}
          onClick={() => { setKey((k) => k + 1); setEditType(r); }}>
          <Pencil className="size-4" aria-hidden="true" />
        </Button>
      ),
    },
  ];

  return (
    <div className={cardShellClass}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text)]">Assessment types</h2>
          <p className="text-xs text-[var(--muted-foreground)]">Categories and their weight toward the term total.</p>
        </div>
        <Button type="button" size="sm" onClick={() => { setKey((k) => k + 1); setCreateOpen(true); }}>
          <Plus className="size-4" aria-hidden="true" /> Add type
        </Button>
      </div>

      {isError ? (
        <ErrorState message="Couldn't load assessment types." onRetry={() => refetch()} />
      ) : isEmpty ? (
        <EmptyState icon={FileCheck2} title="No assessment types yet"
          description="Define categories like Class Test and Exam, each weighted toward the term total." />
      ) : (
        <>
          <DataTable columns={columns} data={data ?? []} getRowId={(r) => r.id} isLoading={isLoading} pageSize={12} />
          {!isLoading && (
            <p className={`mt-3 text-xs ${total === 100 ? "text-[var(--muted-foreground)]" : "text-[var(--warning-fg)]"}`}>
              {total === 100 ? "Weights total 100%." : `⚠ Weights total ${total}% — should be 100%.`}
            </p>
          )}
        </>
      )}

      <AssessmentTypeFormDialog key={`c${key}`} mode="create" open={createOpen} onOpenChange={setCreateOpen} />
      <AssessmentTypeFormDialog key={`e${key}`} mode="edit" type={editType ?? undefined} open={!!editType}
        onOpenChange={(o) => { if (!o) setEditType(null); }} />
    </div>
  );
}
