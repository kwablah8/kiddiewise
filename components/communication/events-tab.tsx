"use client";

import { useState } from "react";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { SearchField } from "@/components/data/search-field";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { EventFormDialog } from "./event-form";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { useDeleteEvent, useEvents } from "@/lib/queries/communication";
import type { EventVM } from "@/lib/validators/communication";
import { formatDate } from "@/lib/format";
import { matchesQuery } from "@/lib/search";
import { cardShellClass } from "@/lib/ui";

/**
 * The school calendar.
 *
 * No draft state and no audience picker, because the `events` table has neither — `ev_select`
 * (migration 0010) returns every event to everyone in the school. The note below says that out
 * loud rather than offering a "publish" control the schema could not honour.
 */
export function EventsTab() {
  const { data, isLoading, isError, refetch } = useEvents();
  const remove = useDeleteEvent();

  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<EventVM | null>(null);
  const [deleting, setDeleting] = useState<EventVM | null>(null);
  const [formKey, setFormKey] = useState(0);

  const rows = (data ?? []).filter((e) =>
    matchesQuery(query, e.title, e.description, e.location),
  );
  const isEmpty = !isLoading && !isError && rows.length === 0;
  const noneAtAll = (data?.length ?? 0) === 0;

  const columns: DataTableColumn<EventVM>[] = [
    {
      key: "title",
      header: "Event",
      render: (e) => (
        <div className="min-w-0">
          <p className="font-medium text-[var(--text)]">{e.title}</p>
          {e.description && (
            <p className="truncate text-xs text-[var(--muted-foreground)]">{e.description}</p>
          )}
        </div>
      ),
    },
    {
      key: "when",
      header: "When",
      render: (e) => (
        <span className="whitespace-nowrap">
          {formatDate(e.start_at)}
          {e.end_at && e.end_at.slice(0, 10) !== e.start_at.slice(0, 10)
            ? ` – ${formatDate(e.end_at)}`
            : ""}
        </span>
      ),
    },
    {
      key: "location",
      header: "Where",
      hideOnMobile: true,
      render: (e) => e.location ?? <span className="text-[var(--muted-foreground)]">—</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (e) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${e.title}`}
            onClick={() => {
              setFormKey((k) => k + 1);
              setEditing(e);
            }}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${e.title}`}
            onClick={() => setDeleting(e)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className={cardShellClass}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search events"
          label="Search events"
        />
        <Button
          type="button"
          onClick={() => {
            setFormKey((k) => k + 1);
            setCreating(true);
          }}
        >
          <Plus className="size-4" aria-hidden="true" />
          New event
        </Button>
      </div>

      <p className="mb-3 text-xs text-[var(--muted-foreground)]">
        Saved events are visible to staff and parents straight away — there is no draft.
      </p>

      {isError ? (
        <ErrorState message="Couldn't load events." onRetry={() => refetch()} />
      ) : isEmpty ? (
        <EmptyState
          icon={CalendarDays}
          title={noneAtAll ? "No events yet" : "No matching events"}
          description={
            noneAtAll
              ? "Add speech day, mid-term break, or a PTA meeting so it shows on every dashboard."
              : `Nothing matches “${query}”. Check the spelling, or clear the search.`
          }
        />
      ) : (
        <DataTable columns={columns} data={rows} getRowId={(e) => e.id} isLoading={isLoading} />
      )}

      <EventFormDialog key={`create-${formKey}`} mode="create" open={creating} onOpenChange={setCreating} />
      <EventFormDialog
        key={`edit-${formKey}`}
        mode="edit"
        event={editing ?? undefined}
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      />
      <ConfirmDeleteDialog
        open={!!deleting}
        title={`Delete “${deleting?.title}”?`}
        description="It will disappear from every dashboard immediately. This cannot be undone."
        isPending={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove.mutateAsync({ id: deleting.id });
            setDeleting(null);
            toast.success("Event deleted");
          } catch (err) {
            toast.error("Couldn't delete that", {
              description: err instanceof Error ? err.message : "Please try again.",
            });
          }
        }}
      />
    </div>
  );
}
