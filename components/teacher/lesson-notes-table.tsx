"use client";

import { NotebookText, Paperclip } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusPill } from "@/components/data/status-pill";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { LessonNoteRowActions } from "./lesson-note-row-actions";
import { useMyLessonNotes } from "@/lib/queries/lesson-notes";
import type { LessonNoteListItemVM } from "@/lib/validators/lesson-notes";
import { formatDate } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";

export function LessonNotesTable() {
  const { data, isLoading, isError, refetch } = useMyLessonNotes();
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

  const columns: DataTableColumn<LessonNoteListItemVM>[] = [
    {
      key: "topic",
      header: "Topic",
      render: (r) => (
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-[var(--text)]">
            {r.topic}
            {r.attachment_name && (
              <Paperclip
                className="size-3.5 shrink-0 text-[var(--muted-foreground)]"
                aria-label="Has an attachment"
              />
            )}
          </p>
          <p className="truncate text-xs text-[var(--muted-foreground)]">
            {r.class_name} · {r.subject_name}
          </p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (r) => <span className="text-[var(--muted-foreground)]">{formatDate(r.date)}</span>,
    },
    { key: "term", header: "Term", render: (r) => <span className="text-[var(--muted-foreground)]">{r.term_name}</span> },
    {
      key: "status",
      header: "Status",
      render: (r) =>
        r.status === "submitted" ? (
          <StatusPill label="Submitted" tone="success" />
        ) : (
          <StatusPill label="Draft" tone="neutral" />
        ),
    },
    { key: "actions", header: "", align: "right", render: (r) => <LessonNoteRowActions note={r} /> },
  ];

  return (
    <div className={cardShellClass}>
      {isError ? (
        <ErrorState message="Couldn't load your lesson notes." onRetry={() => refetch()} />
      ) : isEmpty ? (
        <EmptyState
          icon={NotebookText}
          title="No lesson notes yet"
          description="Write one for a class you teach and submit it to the admin when ready."
        />
      ) : (
        <DataTable
          columns={columns}
          data={data ?? []}
          getRowId={(r) => r.id}
          isLoading={isLoading}
          emptyTitle="No lesson notes yet"
          emptyDescription="Write one for a class you teach to get started."
        />
      )}
    </div>
  );
}
