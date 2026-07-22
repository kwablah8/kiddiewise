"use client";

import { useRouter } from "next/navigation";
import { School } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { useClasses } from "@/lib/queries/academics";
import type { ClassVM } from "@/lib/validators/academics";
import { cardShellClass } from "@/lib/ui";

const columns: DataTableColumn<ClassVM>[] = [
  {
    key: "name",
    header: "Name",
    render: (row) => <span className="font-medium text-[var(--text)]">{row.name}</span>,
  },
  {
    key: "level",
    header: "Level",
    render: (row) => row.level,
  },
  {
    key: "capacity",
    header: "Capacity",
    align: "right",
    render: (row) =>
      row.capacity ?? <span className="text-[var(--muted-foreground)]">—</span>,
  },
  {
    key: "class_teacher",
    header: "Class Teacher",
    render: (row) =>
      row.class_teacher_name ?? <span className="text-[var(--muted-foreground)]">—</span>,
  },
  {
    key: "students",
    header: "Students",
    align: "right",
    render: (row) => row.student_count,
  },
  {
    key: "subjects",
    header: "Subjects",
    align: "right",
    render: (row) => row.subject_count,
  },
];

interface ClassesTableProps {
  onNewClass: () => void;
}

/** Classes list — name, level, capacity, class teacher, student/subject counts (06-UI §6). */
export function ClassesTable({ onNewClass }: ClassesTableProps) {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useClasses();
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

  return (
    <div className={cardShellClass}>
      {isError ? (
        <ErrorState message="Couldn't load classes." onRetry={() => refetch()} />
      ) : isEmpty ? (
        <EmptyState
          icon={School}
          title="No classes yet"
          description="Add your first class to start building rosters and subject assignments."
          action={
            <Button type="button" onClick={onNewClass}>
              New Class
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={data ?? []}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          onRowClick={(row) => router.push(`/classes/${row.id}`)}
          emptyTitle="No classes yet"
        />
      )}
    </div>
  );
}
