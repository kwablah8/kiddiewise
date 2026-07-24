"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Search } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusPill } from "@/components/data/status-pill";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInquiries, useSetInquiryStatus } from "@/lib/queries/inquiries";
import type { InquiryStatus, InquiryVM } from "@/lib/validators/inquiries";
import { inquiryActionsFor } from "@/lib/inquiries";
import { INQUIRY_STATUS_LABEL, inquiryStatusTone } from "@/components/admissions/inquiry-status";
import { InquirySheet } from "@/components/admissions/inquiry-sheet";
import { formatDate } from "@/lib/format";
import { cardShellClass, lightFocusRingClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

type FilterValue = InquiryStatus | "all";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "converted", label: "Converted" },
];

/** Admissions inquiry list — segmented status filter with counts, search, table, row triage. */
export function InquiriesTable() {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [search, setSearch] = useState("");
  // Row click opens the detail in a side sheet (not a dedicated route). `activeId` may linger while
  // the sheet plays its close animation; only `open` drives visibility.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useInquiries();

  const counts = useMemo(() => {
    const base: Record<FilterValue, number> = {
      all: data?.length ?? 0,
      new: 0,
      reviewing: 0,
      accepted: 0,
      rejected: 0,
      converted: 0,
    };
    for (const i of data ?? []) base[i.status] += 1;
    return base;
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((i) => {
      if (filter !== "all" && i.status !== filter) return false;
      if (!q) return true;
      return (
        i.applicant_name.toLowerCase().includes(q) ||
        i.parent_name.toLowerCase().includes(q) ||
        i.parent_email.toLowerCase().includes(q)
      );
    });
  }, [data, filter, search]);

  const columns: DataTableColumn<InquiryVM>[] = [
    {
      key: "applicant",
      header: "Applicant",
      render: (row) => (
        <span className="font-medium text-[var(--text)]">{row.applicant_name}</span>
      ),
    },
    {
      key: "desired_class",
      header: "Desired class",
      hideOnMobile: true,
      render: (row) =>
        row.desired_class ?? <span className="text-[var(--muted-foreground)]">—</span>,
    },
    {
      key: "parent",
      header: "Parent",
      hideOnMobile: true,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-[var(--text)]">{row.parent_name}</p>
          <p className="truncate text-xs text-[var(--muted-foreground)]">{row.parent_email}</p>
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Submitted",
      hideOnMobile: true,
      render: (row) => (
        <span className="text-[var(--muted-foreground)]">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusPill label={INQUIRY_STATUS_LABEL[row.status]} tone={inquiryStatusTone(row.status)} />
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => <InquiryRowActions inquiry={row} />,
    },
  ];

  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

  function openInquiry(id: string) {
    setActiveId(id);
    setSheetOpen(true);
  }

  return (
    <div className={cardShellClass}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--bg)] text-[var(--muted-foreground)] hover:text-[var(--text)]",
                  lightFocusRingClass,
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "text-xs",
                    active
                      ? "text-[var(--primary-foreground)]/80"
                      : "text-[var(--muted-foreground)]",
                  )}
                >
                  {counts[f.value]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative sm:w-64">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-[var(--muted-foreground)]"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applicant or parent"
            aria-label="Search inquiries"
            className="h-9 pl-8"
          />
        </div>
      </div>

      <div className="mt-4">
        {isError ? (
          <ErrorState message="Couldn't load admissions inquiries." onRetry={() => refetch()} />
        ) : isEmpty ? (
          <EmptyState
            title="No inquiries yet"
            description="Inquiries submitted from your school website's Admissions and Contact forms will appear here."
          />
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            getRowId={(row) => row.id}
            isLoading={isLoading}
            onRowClick={(row) => openInquiry(row.id)}
            emptyTitle="No matching inquiries"
            emptyDescription="Try a different search or status filter."
          />
        )}
      </div>

      <InquirySheet id={activeId} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}

/** Per-row triage menu. `Convert to student` routes to the prefilled New Student form (Task 5);
 *  all other targets mutate status in place. Click is stopped from bubbling to the row link. */
function InquiryRowActions({ inquiry }: { inquiry: InquiryVM }) {
  const router = useRouter();
  const setStatus = useSetInquiryStatus();
  const actions = inquiryActionsFor(inquiry.status);

  if (actions.length === 0) {
    return <span className="text-[var(--muted-foreground)]">—</span>;
  }

  async function run(status: InquiryStatus) {
    if (status === "converted") {
      router.push(`/students/new?fromInquiry=${inquiry.id}`);
      return;
    }
    try {
      await setStatus.mutateAsync({ id: inquiry.id, status });
      toast.success("Inquiry updated", {
        description: `${inquiry.applicant_name} — ${INQUIRY_STATUS_LABEL[status].toLowerCase()}.`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update the inquiry.");
    }
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      className="flex justify-end"
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Actions for ${inquiry.applicant_name}`}
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((a) => (
            <DropdownMenuItem
              key={a.status}
              variant={a.variant === "destructive" ? "destructive" : "default"}
              onClick={() => run(a.status)}
            >
              {a.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
