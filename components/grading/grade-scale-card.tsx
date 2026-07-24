"use client";

import { useState } from "react";
import { Pencil, Plus, SlidersHorizontal } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { GradeBandFormDialog } from "./grade-band-form";
import { useGradeBands } from "@/lib/queries/grading";
import { gradeBandWarnings } from "@/lib/grading";
import type { GradeBandVM } from "@/lib/validators/grading";
import { cardShellClass } from "@/lib/ui";

export function GradeScaleCard() {
  const { data, isLoading, isError, refetch } = useGradeBands();
  const [createOpen, setCreateOpen] = useState(false);
  const [editBand, setEditBand] = useState<GradeBandVM | null>(null);
  const [key, setKey] = useState(0);
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;
  const warnings = data ? gradeBandWarnings(data) : [];

  const columns: DataTableColumn<GradeBandVM>[] = [
    { key: "range", header: "Range", render: (r) => <span className="font-medium text-[var(--text)]">{r.min_score}–{r.max_score}%</span> },
    { key: "grade", header: "Grade", render: (r) => r.grade },
    { key: "remark", header: "Remark", render: (r) => <span className="text-[var(--muted-foreground)]">{r.remark}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Edit ${r.grade}`}
          onClick={() => { setKey((k) => k + 1); setEditBand(r); }}>
          <Pencil className="size-4" aria-hidden="true" />
        </Button>
      ),
    },
  ];

  return (
    <div className={cardShellClass}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text)]">Grading scale</h2>
          <p className="text-xs text-[var(--muted-foreground)]">Score ranges mapped to grades and remarks.</p>
        </div>
        <Button type="button" size="sm" onClick={() => { setKey((k) => k + 1); setCreateOpen(true); }}>
          <Plus className="size-4" aria-hidden="true" /> Add band
        </Button>
      </div>

      {isError ? (
        <ErrorState message="Couldn't load the grading scale." onRetry={() => refetch()} />
      ) : isEmpty ? (
        <EmptyState icon={SlidersHorizontal} title="No grade bands yet"
          description="Add bands so scores can be mapped to grades across the school." />
      ) : (
        <>
          <DataTable columns={columns} data={data ?? []} getRowId={(r) => r.id} isLoading={isLoading} pageSize={12} />
          {warnings.length > 0 && (
            <ul className="mt-3 space-y-1">
              {warnings.map((w) => (
                <li key={w} className="text-xs text-[var(--warning-fg)]">⚠ {w}</li>
              ))}
            </ul>
          )}
        </>
      )}

      <GradeBandFormDialog key={`c${key}`} mode="create" open={createOpen} onOpenChange={setCreateOpen} />
      <GradeBandFormDialog key={`e${key}`} mode="edit" band={editBand ?? undefined} open={!!editBand}
        onOpenChange={(o) => { if (!o) setEditBand(null); }} />
    </div>
  );
}
