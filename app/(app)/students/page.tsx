"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ExportButtons } from "@/components/data/export-buttons";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { StudentStats } from "@/components/students/student-stats";
import { StudentsTable } from "@/components/students/students-table";
import { StudentFormSheet } from "@/components/students/student-form-sheet";
import { useStudents } from "@/lib/queries/people";
import { useActiveContext } from "@/lib/queries/academics";
import { studentColumns } from "@/lib/students";

export default function StudentsPage() {
  const [addOpen, setAddOpen] = useState(false);

  // Unfiltered: "export the students" means the full roster, not whatever search or filter
  // happens to be set on the table below. React Query dedupes against the table's own query by
  // key, so this only costs a fetch when the table isn't already showing every student.
  const { data: students } = useStudents({});
  const { data: active } = useActiveContext();
  const termLabel =
    active?.active_term && active?.active_year
      ? `${active.active_term.name} · ${active.active_year.name}`
      : null;
  const count = students?.length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Management"
        subtitle="Manage student records, class assignments, and academic performance."
        action={
          <div className="flex items-center gap-2">
            <ExportButtons
              kind="student-roster"
              title="Student Roster"
              details={[...(termLabel ? [termLabel] : []), `${count} student${count === 1 ? "" : "s"}`]}
              columns={studentColumns}
              rows={students ?? []}
              emptyMessage="No students on record yet."
              disabled={students === undefined}
            />
            <Button type="button" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" aria-hidden="true" /> Add New Student
            </Button>
          </div>
        }
      />
      <StudentStats />
      <StudentsTable />
      <StudentFormSheet open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
