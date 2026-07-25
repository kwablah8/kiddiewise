"use client";

import { useState } from "react";
import { Download, FileText, Plus } from "lucide-react";
import { toast } from "@/lib/toast";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { StudentStats } from "@/components/students/student-stats";
import { StudentsTable } from "@/components/students/students-table";
import { StudentFormSheet } from "@/components/students/student-form-sheet";

export default function StudentsPage() {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Management"
        subtitle="Manage student records, class assignments, and academic performance."
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => toast.message("PDF export coming soon")}
            >
              <FileText className="size-4" aria-hidden="true" /> PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => toast.message("CSV export coming soon")}
            >
              <Download className="size-4" aria-hidden="true" /> CSV
            </Button>
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
