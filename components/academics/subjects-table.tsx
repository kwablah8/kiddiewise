"use client";

import { useState } from "react";
import { BookOpen, Pencil } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { SubjectFormDialog } from "./subject-form";
import { useSubjects } from "@/lib/queries/academics";
import type { SubjectVM } from "@/lib/validators/academics";
import { cardShellClass } from "@/lib/ui";

interface SubjectsTableProps {
  onNewSubject: () => void;
}

/** Subjects list — name, code or "—", # classes, with a per-row edit action (06-UI §6). */
export function SubjectsTable({ onNewSubject }: SubjectsTableProps) {
  const { data, isLoading, isError, refetch } = useSubjects();
  const [editSubject, setEditSubject] = useState<SubjectVM | null>(null);
  const [editKey, setEditKey] = useState(0);
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

  const columns: DataTableColumn<SubjectVM>[] = [
    {
      key: "name",
      header: "Name",
      render: (row) => <span className="font-medium text-[var(--text)]">{row.name}</span>,
    },
    {
      key: "code",
      header: "Code",
      render: (row) => row.code ?? <span className="text-[var(--muted-foreground)]">—</span>,
    },
    {
      key: "classes",
      header: "Classes",
      align: "right",
      render: (row) => row.class_count,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit ${row.name}`}
          onClick={() => {
            setEditKey((k) => k + 1);
            setEditSubject(row);
          }}
        >
          <Pencil className="size-4" aria-hidden="true" />
        </Button>
      ),
    },
  ];

  return (
    <div className={cardShellClass}>
      {isError ? (
        <ErrorState message="Couldn't load subjects." onRetry={() => refetch()} />
      ) : isEmpty ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects yet"
          description="Add your first subject to start assigning it to classes."
          action={
            <Button type="button" onClick={onNewSubject}>
              New Subject
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={data ?? []}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          emptyTitle="No subjects yet"
        />
      )}

      <SubjectFormDialog
        key={editKey}
        mode="edit"
        subject={editSubject ?? undefined}
        open={!!editSubject}
        onOpenChange={(open) => {
          if (!open) setEditSubject(null);
        }}
      />
    </div>
  );
}
