"use client";

import { useState } from "react";
import { Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { SearchField } from "@/components/data/search-field";
import { StatusPill } from "@/components/data/status-pill";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { AnnouncementFormDialog } from "./announcement-form";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import {
  useAnnouncements,
  useDeleteAnnouncement,
  useUpdateAnnouncement,
} from "@/lib/queries/communication";
import {
  ANNOUNCEMENT_AUDIENCE_LABEL,
  type AnnouncementVM,
} from "@/lib/validators/communication";
import { formatDate } from "@/lib/format";
import { matchesQuery } from "@/lib/search";
import { cardShellClass } from "@/lib/ui";

/**
 * Admin list of announcements, including drafts.
 *
 * Admins see unpublished rows here because `ann_read` lets them (migration 0010), a draft is
 * invisible to parents and teachers, but the office needs to find the one it started yesterday.
 * The Draft / Published pill is the most important column on the screen: an announcement nobody
 * can read looks identical to a published one without it.
 */
export function AnnouncementsTab() {
  const { data, isLoading, isError, refetch } = useAnnouncements();
  const update = useUpdateAnnouncement();
  const remove = useDeleteAnnouncement();

  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AnnouncementVM | null>(null);
  const [deleting, setDeleting] = useState<AnnouncementVM | null>(null);
  const [formKey, setFormKey] = useState(0);

  const rows = (data ?? []).filter((a) => matchesQuery(query, a.title, a.body));
  const isEmpty = !isLoading && !isError && rows.length === 0;
  const noneAtAll = (data?.length ?? 0) === 0;

  async function togglePublished(a: AnnouncementVM) {
    try {
      await update.mutateAsync({ id: a.id, is_published: !a.is_published });
      toast.success(a.is_published ? "Moved back to draft" : "Published", {
        description: a.is_published
          ? `“${a.title}” is no longer visible to ${ANNOUNCEMENT_AUDIENCE_LABEL[a.audience].toLowerCase()}.`
          : `“${a.title}” is now visible to ${ANNOUNCEMENT_AUDIENCE_LABEL[a.audience].toLowerCase()}.`,
      });
    } catch (err) {
      toast.error("Couldn't change that", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }

  const columns: DataTableColumn<AnnouncementVM>[] = [
    {
      key: "title",
      header: "Announcement",
      render: (a) => (
        <div className="min-w-0">
          <p className="font-medium text-[var(--text)]">{a.title}</p>
          <p className="truncate text-xs text-[var(--muted-foreground)]">{a.body}</p>
        </div>
      ),
    },
    {
      key: "audience",
      header: "Audience",
      hideOnMobile: true,
      render: (a) => ANNOUNCEMENT_AUDIENCE_LABEL[a.audience],
    },
    {
      key: "status",
      header: "Status",
      render: (a) => (
        <StatusPill
          label={a.is_published ? "Published" : "Draft"}
          tone={a.is_published ? "success" : "neutral"}
        />
      ),
    },
    {
      key: "date",
      header: "Date",
      hideOnMobile: true,
      // The published date when there is one, otherwise when it was written, a draft has no
      // published_at, and an empty cell would read as missing data rather than "not yet".
      render: (a) => (
        <span className="text-[var(--muted-foreground)]">
          {formatDate(a.published_at ?? a.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (a) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={update.isPending}
            onClick={() => togglePublished(a)}
          >
            {a.is_published ? "Unpublish" : "Publish"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${a.title}`}
            onClick={() => {
              setFormKey((k) => k + 1);
              setEditing(a);
            }}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${a.title}`}
            onClick={() => setDeleting(a)}
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
          placeholder="Search announcements"
          label="Search announcements"
        />
        <Button
          type="button"
          onClick={() => {
            setFormKey((k) => k + 1);
            setCreating(true);
          }}
        >
          <Plus className="size-4" aria-hidden="true" />
          New announcement
        </Button>
      </div>

      {isError ? (
        <ErrorState message="Couldn't load announcements." onRetry={() => refetch()} />
      ) : isEmpty ? (
        <EmptyState
          icon={Megaphone}
          title={noneAtAll ? "No announcements yet" : "No matching announcements"}
          description={
            noneAtAll
              ? "Write one to reach parents, staff, or everybody at once."
              : `Nothing matches “${query}”. Check the spelling, or clear the search.`
          }
        />
      ) : (
        <DataTable columns={columns} data={rows} getRowId={(a) => a.id} isLoading={isLoading} />
      )}

      <AnnouncementFormDialog
        key={`create-${formKey}`}
        mode="create"
        open={creating}
        onOpenChange={setCreating}
      />
      <AnnouncementFormDialog
        key={`edit-${formKey}`}
        mode="edit"
        announcement={editing ?? undefined}
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      />
      <ConfirmDeleteDialog
        open={!!deleting}
        title={`Delete “${deleting?.title}”?`}
        description="It will disappear from every portal immediately. This cannot be undone."
        isPending={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove.mutateAsync({ id: deleting.id });
            setDeleting(null);
            toast.success("Announcement deleted");
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
