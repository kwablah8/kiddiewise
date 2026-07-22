"use client";

import Link from "next/link";
import { UserRoundPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { buttonVariants } from "@/components/ui/button";
import { useParents } from "@/lib/queries/people";
import type { ParentListItemVM } from "@/lib/validators/people";
import { formatInitials } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

/** `["Ama Mensah", "Kojo Mensah"]` -> `"Ama Mensah, Kojo Mensah"`; 3+ collapses to a count. */
function formatChildren(names: string[]): string {
  if (names.length <= 2) return names.join(", ");
  return `${names.length} children`;
}

const columns: DataTableColumn<ParentListItemVM>[] = [
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
  {
    key: "email",
    header: "Email",
    render: (row) => row.email,
  },
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
];

/** Parents list — name w/ initials avatar, email, phone, linked children (06-UI §6). */
export function ParentsTable() {
  const { data, isLoading, isError, refetch } = useParents();
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

  return (
    <div className={cardShellClass}>
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
          columns={columns}
          data={data ?? []}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          emptyTitle="No parents yet"
        />
      )}
    </div>
  );
}
