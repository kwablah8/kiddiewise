"use client";

import { useState } from "react";
import { BookOpen, Pencil } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { SearchField } from "@/components/data/search-field";
import { StatusPill } from "@/components/data/status-pill";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { SubjectFormDialog } from "./subject-form";
import { useSubjects } from "@/lib/queries/academics";
import type { SubjectVM } from "@/lib/validators/academics";
import { matchesQuery } from "@/lib/search";
import { cardShellClass } from "@/lib/ui";

interface SubjectsTableProps {
  onNewSubject: () => void;
}

/** Subjects list: name, code or "—", # classes, with a per-row edit action (06-UI §6). */
export function SubjectsTable({ onNewSubject }: SubjectsTableProps) {
  const { data, isLoading, isError, refetch } = useSubjects();
  const [editSubject, setEditSubject] = useState<SubjectVM | null>(null);
  const [editKey, setEditKey] = useState(0);
  const [query, setQuery] = useState("");
  const rows = (data ?? []).filter((r) => matchesQuery(query, r.name, r.code));
  const isEmpty = !isLoading && !isError && rows.length === 0;
  const noneAtAll = (data?.length ?? 0) === 0;

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
      key: "status",
      header: "Status",
      // Same wording and tones as the staff list's Employment column: an admin scanning either
      // screen should not have to learn two vocabularies for the same idea.
      render: (row) => (
        <StatusPill
          label={row.is_active ? "Active" : "Inactive"}
          tone={row.is_active ? "success" : "neutral"}
        />
      ),
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
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Search by name or code"
        label="Search subjects"
        className="mb-3"
      />
      {isError ? (
        <ErrorState message="Couldn't load subjects." onRetry={() => refetch()} />
      ) : isEmpty ? (
        <EmptyState
          icon={BookOpen}
          title={noneAtAll ? "No subjects yet" : "No matching subjects"}
          description={
            noneAtAll
              ? "Add your first subject to start assigning it to classes."
              : `Nothing matches “${query}”. Check the spelling, or clear the search.`
          }
          action={
            noneAtAll ? (
              <Button type="button" onClick={onNewSubject}>
                New Subject
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
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
