"use client";

import { useState } from "react";

import Link from "next/link";
import { UserRoundPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { SearchField } from "@/components/data/search-field";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { buttonVariants } from "@/components/ui/button";
import { InvitePortalButton } from "@/components/people/invite-portal-button";
import { SendCredentialsButton } from "@/components/people/send-credentials-button";
import { StatusPill } from "@/components/data/status-pill";
import { useParents } from "@/lib/queries/people";
import { PORTAL_ACCESS_LABEL, type ParentListItemVM, type PortalAccessStatus } from "@/lib/validators/people";
import { formatInitials } from "@/lib/format";
import { matchesQuery } from "@/lib/search";
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

function buildColumns(): DataTableColumn<ParentListItemVM>[] {
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
          <SendCredentialsButton
            profileId={row.id}
            personName={`${row.first_name} ${row.last_name}`}
          />
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
  const [query, setQuery] = useState("");
  // Children's names are searchable too: staff far more often know "Kofi's mother" than the
  // guardian's own name, and that is the lookup this screen has to answer at the front desk.
  const rows = (data ?? []).filter((r) =>
    matchesQuery(query, r.first_name, r.last_name, r.email, r.phone, ...r.children_names),
  );
  const isEmpty = !isLoading && !isError && rows.length === 0;
  const noneAtAll = (data?.length ?? 0) === 0;

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
      <div className="px-4 pt-4">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search by parent, child, email or phone"
          label="Search parents"
        />
      </div>
      {isError ? (
        <ErrorState message="Couldn't load parents." onRetry={() => refetch()} />
      ) : isEmpty ? (
        <EmptyState
          icon={UserRoundPlus}
          title={noneAtAll ? "No parents yet" : "No matching parents"}
          description={
            noneAtAll
              ? "Add a parent record to start linking guardians to students."
              : `Nothing matches “${query}”. Check the spelling, or clear the search.`
          }
          action={
            noneAtAll ? (
              <Link href="/parents/new" className={cn(buttonVariants())}>
                New Parent
              </Link>
            ) : undefined
          }
        />
      ) : (
        <DataTable
          columns={buildColumns()}
          data={rows}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          emptyTitle="No parents yet"
        />
      )}
    </div>
  );
}
