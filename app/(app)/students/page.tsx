"use client";

import { useState } from "react";
import { Download, FileText, Plus } from "lucide-react";
import { toast } from "@/lib/toast";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { StudentStats } from "@/components/students/student-stats";
import { StudentsTable } from "@/components/students/students-table";
import { StudentFormSheet } from "@/components/students/student-form-sheet";
import { useStudents } from "@/lib/queries/people";
import { useSchool } from "@/lib/queries/school";
import { useActiveContext } from "@/lib/queries/academics";
import { downloadStudentsRoster, studentsRosterCsvFilename } from "@/lib/pdf/students-roster";
import { studentsToCsv } from "@/lib/students";
import { downloadCsv } from "@/lib/csv";
import { BRAND } from "@/lib/brand";

export default function StudentsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Unfiltered: "export the students" means the full roster, not whatever search or filter
  // happens to be set on the table below. React Query dedupes against the table's own query by
  // key, so this only costs a fetch when the table isn't already showing every student.
  const { data: students } = useStudents({});
  const { data: school } = useSchool();
  const { data: active } = useActiveContext();
  const ready = students !== undefined;
  const schoolName = school?.name ?? BRAND.fullName;

  async function handleExportPdf() {
    if (!students) return;
    setExportingPdf(true);
    try {
      const termLabel =
        active?.active_term && active?.active_year
          ? `${active.active_term.name} · ${active.active_year.name}`
          : null;
      await downloadStudentsRoster({
        schoolName,
        schoolAddress: school?.address ?? null,
        schoolEmail: school?.email ?? null,
        schoolPhone: school?.phone ?? null,
        termLabel,
        students,
        logoSrc: school?.logo_url ?? BRAND.crest.src,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't generate the roster. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  }

  function handleExportCsv() {
    if (!students) return;
    downloadCsv(studentsRosterCsvFilename(schoolName), studentsToCsv(students));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Management"
        subtitle="Manage student records, class assignments, and academic performance."
        action={
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleExportPdf} disabled={!ready || exportingPdf}>
              <FileText className="size-4" aria-hidden="true" /> {exportingPdf ? "Preparing…" : "PDF"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleExportCsv} disabled={!ready}>
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
