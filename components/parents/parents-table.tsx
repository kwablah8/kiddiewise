"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Loader2, UserRoundPlus } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { InvitePortalButton } from "@/components/people/invite-portal-button";
import { CredentialsDialog } from "@/components/people/credentials-dialog";
import { StatusPill } from "@/components/data/status-pill";
import { useParents, useReissueCredentials } from "@/lib/queries/people";
import { PORTAL_ACCESS_LABEL, type ParentListItemVM, type PortalAccessStatus } from "@/lib/validators/people";
import type { IssuedCredentials } from "@/lib/temp-password";
import { formatInitials } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

/** `["Ama Mensah", "Kojo Mensah"]` -> `"Ama Mensah, Kojo Mensah"`; 3+ collapses to a count. */
function formatChildren(names: string[]): string {
  if (names.length <= 2) return names.join(", ");
  return `${names.length} children`;
}

// Tone tracks how much attention the row needs: a parent still holding a password the admin also
// knows is not a failure, but it isn't finished either — hence "warning" rather than "success".
const STATUS_TONE: Record<PortalAccessStatus, "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  pending: "warning",
  expired: "danger",
  no_access: "neutral",
};

function buildColumns(
  onSend: (row: ParentListItemVM) => void,
  sendingId: string | null,
): DataTableColumn<ParentListItemVM>[] {
  return [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar size="sm" className="shrink-0">
            <AvatarFallback className="bg-[var(--success-bg)] font-medium text-[var(--success-fg)]">
              {formatInitials(row.first_name, row.last_name)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-[var(--text)]">
            {row.first_name} {row.last_name}
          </span>
        </div>
      ),
    },
    { key: "email", header: "Email", render: (row) => row.email },
    {
      key: "phone",
      header: "Phone",
      render: (row) => row.phone ?? <span className="text-[var(--muted-foreground)]">—</span>,
    },
    {
      key: "children",
      header: "Children",
      render: (row) =>
        row.children_names.length === 0 ? (
          <span className="text-[var(--muted-foreground)]">—</span>
        ) : (
          formatChildren(row.children_names)
        ),
    },
    {
      key: "portal_status",
      header: "Portal access",
      // "Active" means they signed in and replaced the temporary password — i.e. the account is
      // genuinely theirs and the admin no longer knows the credential.
      render: (row) => (
        <StatusPill label={PORTAL_ACCESS_LABEL[row.portal_status]} tone={STATUS_TONE[row.portal_status]} />
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {/* Reissues rather than reveals: the original password is a hash and cannot be shown again. */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={sendingId === row.id}
            onClick={() => onSend(row)}
          >
            {sendingId === row.id ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <KeyRound className="size-3.5" aria-hidden="true" />
            )}
            Send credentials
          </Button>
          <InvitePortalButton
            profileId={row.id}
            personName={`${row.first_name} ${row.last_name}`}
            label="Send link"
          />
        </div>
      ),
    },
  ];
}

/** Parents list — name w/ initials avatar, email, phone, linked children (06-UI §6). */
export function ParentsTable() {
  const { data, isLoading, isError, refetch } = useParents();
  const reissue = useReissueCredentials();
  const [issued, setIssued] = useState<IssuedCredentials | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

  async function sendCredentials(row: ParentListItemVM) {
    setSendingId(row.id);
    try {
      setIssued(await reissue.mutateAsync({ profile_id: row.id }));
    } catch (err) {
      toast.error("Couldn't issue credentials", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSendingId(null);
    }
  }

  const activated = (data ?? []).filter((p) => p.portal_status === "active").length;
  const total = data?.length ?? 0;

  return (
    <div className={cardShellClass}>
      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-3">
          <p className="text-sm text-[var(--text)]">
            <span className="font-semibold">{activated}</span> of {total} parents have signed in and
            set their own password
          </p>
          {activated < total && (
            <p className="text-xs text-[var(--muted-foreground)]">
              The rest are still using the temporary password you issued.
            </p>
          )}
        </div>
      )}
      <CredentialsDialog
        credentials={issued}
        schoolName="Kiddiewise School Complex"
        onClose={() => setIssued(null)}
      />
      {isError ? (
        <ErrorState message="Couldn't load parents." onRetry={() => refetch()} />
      ) : isEmpty ? (
        <EmptyState
          icon={UserRoundPlus}
          title="No parents yet"
          description="Add a parent record to start linking guardians to students."
          action={
            <Link href="/parents/new" className={cn(buttonVariants())}>
              New Parent
            </Link>
          }
        />
      ) : (
        <DataTable
          columns={buildColumns(sendCredentials, sendingId)}
          data={data ?? []}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          emptyTitle="No parents yet"
        />
      )}
    </div>
  );
}
