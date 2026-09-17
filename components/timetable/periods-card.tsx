"use client";

import { useState } from "react";
import { Clock, Pencil, Plus } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusPill } from "@/components/data/status-pill";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { PeriodFormDialog } from "./period-form";
import { usePeriods } from "@/lib/queries/timetable";
import type { PeriodVM } from "@/lib/validators/timetable";
import { cardShellClass } from "@/lib/ui";

export function PeriodsCard() {
  const { data, isLoading, isError, refetch } = usePeriods();
  const [createOpen, setCreateOpen] = useState(false);
  const [editPeriod, setEditPeriod] = useState<PeriodVM | null>(null);
  const [key, setKey] = useState(0);
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

  const columns: DataTableColumn<PeriodVM>[] = [
    { key: "name", header: "Period", render: (r) => <span className="font-medium text-[var(--text)]">{r.name}</span> },
    { key: "time", header: "Time", render: (r) => `${r.start_time.slice(0, 5)} – ${r.end_time.slice(0, 5)}` },
    { key: "break", header: "", render: (r) => r.is_break && <StatusPill label="Break" tone="neutral" /> },
    {
      key: "actions", header: "", align: "right",
      render: (r) => (
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Edit ${r.name}`}
          onClick={() => { setKey((k) => k + 1); setEditPeriod(r); }}>
          <Pencil className="size-4" aria-hidden="true" />
        </Button>
      ),
    },
  ];

  return (
    <div className={cardShellClass}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text)]">Periods</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            The school&apos;s shared time slots — set once, reused by every class&apos;s timetable.
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => { setKey((k) => k + 1); setCreateOpen(true); }}>
          <Plus className="size-4" aria-hidden="true" /> Add period
        </Button>
      </div>

      {isError ? (
        <ErrorState message="Couldn't load periods." onRetry={() => refetch()} />
      ) : isEmpty ? (
        <EmptyState icon={Clock} title="No periods yet"
          description="Add the school's time slots (Period 1, Break, Period 2…) to start building a timetable." />
      ) : (
        <DataTable columns={columns} data={data ?? []} getRowId={(r) => r.id} isLoading={isLoading} pageSize={20} />
      )}

      <PeriodFormDialog key={`c${key}`} mode="create" open={createOpen} onOpenChange={setCreateOpen} />
      <PeriodFormDialog key={`e${key}`} mode="edit" period={editPeriod ?? undefined} open={!!editPeriod}
        onOpenChange={(o) => { if (!o) setEditPeriod(null); }} />
    </div>
  );
}
