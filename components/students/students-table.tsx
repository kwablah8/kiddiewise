"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, UserPlus } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusPill } from "@/components/data/status-pill";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StudentAvatar } from "./student-avatar";
import { studentStatusTone } from "./student-status";
import { useStudents } from "@/lib/queries/people";
import type { StudentListItemVM } from "@/lib/validators/people";
import { formatRole } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

const columns: DataTableColumn<StudentListItemVM>[] = [
  {
    key: "admission_no",
    header: "Admission No.",
    render: (row) => <span className="font-medium">{row.admission_no}</span>,
  },
  {
    key: "name",
    header: "Name",
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <StudentAvatar
          firstName={row.first_name}
          lastName={row.last_name}
          photoUrl={row.photo_url}
          size="sm"
        />
        <span className="font-medium text-[var(--text)]">
          {row.first_name} {row.last_name}
        </span>
      </div>
    ),
  },
  {
    key: "class",
    header: "Class",
    render: (row) =>
      row.class_name ?? <span className="text-[var(--muted-foreground)]">—</span>,
  },
  {
    key: "gender",
    header: "Gender",
    render: (row) => formatRole(row.gender),
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <StatusPill
        label={formatRole(row.enrollment_status)}
        tone={studentStatusTone(row.enrollment_status)}
      />
    ),
  },
];

/** Searchable students list — admission no, name w/ avatar, class, gender, status (06-UI §6). */
export function StudentsTable() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Debounce the search box so `useStudents` isn't refetching on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError, refetch } = useStudents({ search });
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;
  const showEmptyCta = isEmpty && !search;

  return (
    <div className={cardShellClass}>
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-[var(--muted-foreground)]"
          aria-hidden="true"
        />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or admission no."
          aria-label="Search students"
          className="h-9 pl-8"
        />
      </div>

      <div className="mt-4">
        {isError ? (
          <ErrorState message="Couldn't load students." onRetry={() => refetch()} />
        ) : showEmptyCta ? (
          <EmptyState
            icon={UserPlus}
            title="No students yet"
            description="Add your first student to start building class rosters and enrollment records."
            action={
              <Link href="/students/new" className={cn(buttonVariants())}>
                New Student
              </Link>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={data ?? []}
            getRowId={(row) => row.id}
            isLoading={isLoading}
            onRowClick={(row) => router.push(`/students/${row.id}`)}
            emptyTitle="No matching students"
            emptyDescription="Try a different name or admission number."
          />
        )}
      </div>
    </div>
  );
}
