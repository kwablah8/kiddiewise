"use client";

import { useEffect, useState } from "react";
import { useAppRouter } from "@/lib/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { SearchField } from "@/components/data/search-field";
import { StatusPill } from "@/components/data/status-pill";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudentAvatar } from "./student-avatar";
import { studentStatusTone } from "./student-status";
import { useClassOptions, useStudents } from "@/lib/queries/people";
import type { StudentListItemVM } from "@/lib/validators/people";
import { formatRole } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

const ALL = "__all__";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "graduated", label: "Graduated" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "transferred", label: "Transferred" },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const columns: DataTableColumn<StudentListItemVM>[] = [
  {
    key: "admission_no",
    header: "Admission No.",
    hideOnMobile: true,
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
    hideOnMobile: true,
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

/** Searchable, filterable students list, admission no, name w/ avatar, class, gender, status (06-UI §6). */
export function StudentsTable() {
  const router = useAppRouter();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [gender, setGender] = useState(ALL);
  const [classId, setClassId] = useState(ALL);

  const { data: classOptions } = useClassOptions();

  // Debounce the search box so `useStudents` isn't refetching on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError, refetch } = useStudents({
    search,
    status: status === ALL ? undefined : status,
    gender: gender === ALL ? undefined : gender,
    class_id: classId === ALL ? undefined : classId,
  });

  const hasActiveFilter = search !== "" || status !== ALL || gender !== ALL || classId !== ALL;
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;
  const showEmptyCta = isEmpty && !hasActiveFilter;
  const count = data?.length ?? 0;

  return (
    <div className={cardShellClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* The one list that searches SERVER-side (debounced above): a roster is the table that
            genuinely grows, and its query is already paginated. Same control either way, so the
            affordance is identical to every other list. */}
        <SearchField
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search by name or admission no."
          label="Search students"
        />
        {!isLoading && !isError && (
          <p className="text-sm whitespace-nowrap text-[var(--muted-foreground)]">
            {count} {count === 1 ? "student" : "students"}
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={[{ value: ALL, label: "All statuses" }, ...STATUS_OPTIONS]}
        />
        <FilterSelect
          label="Gender"
          value={gender}
          onChange={setGender}
          options={[{ value: ALL, label: "All genders" }, ...GENDER_OPTIONS]}
        />
        <FilterSelect
          label="Class"
          value={classId}
          onChange={setClassId}
          options={[
            { value: ALL, label: "All classes" },
            ...(classOptions ?? []).map((c) => ({ value: c.id, label: c.name })),
          ]}
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
            emptyDescription="Try a different name, or adjust the filters above."
          />
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[var(--muted-foreground)]">{label}</label>
      {/* base-ui's onValueChange is `(value: string | null, ...) => void` (null on clear); this
          Select is never rendered with a clear affordance, but the callback still has to accept
          it; falling back to the sentinel keeps FilterSelect's own `onChange: (v: string) => void`
          contract simple. */}
      <Select value={value} onValueChange={(v) => onChange(v ?? ALL)}>
        <SelectTrigger className="h-9 w-44">
          <SelectValue>{(v: string) => options.find((o) => o.value === v)?.label ?? label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
