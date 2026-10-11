"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { downloadCsv } from "@/lib/csv";
import { columnsToCsv, exportFilename, type ExportColumn } from "@/lib/export";
import { downloadTableReport } from "@/lib/pdf/table-report";
import { useSchool } from "@/lib/queries/school";

interface ExportButtonsProps<T> {
  /** Used in the filename: `payments` gives `payments-School-2026-10-12.pdf`. */
  kind: string;
  title: string;
  /** Filters, counts and totals for the line under the title. */
  details: string[];
  columns: ExportColumn<T>[];
  rows: T[];
  orientation?: "portrait" | "landscape";
  emptyMessage: string;
  /** Hold the buttons back while the data this exports is still loading. */
  disabled?: boolean;
}

/** PDF and CSV buttons for whatever list the page is showing. Exports exactly the rows it is given. */
export function ExportButtons<T>({
  kind,
  title,
  details,
  columns,
  rows,
  orientation,
  emptyMessage,
  disabled,
}: ExportButtonsProps<T>) {
  const { data: school } = useSchool();
  const [busy, setBusy] = useState(false);
  const schoolName = school?.name ?? BRAND.fullName;

  async function exportPdf() {
    setBusy(true);
    try {
      await downloadTableReport(
        {
          school: {
            name: schoolName,
            address: school?.address ?? null,
            email: school?.email ?? null,
            phone: school?.phone ?? null,
            logoSrc: school?.logo_url ?? BRAND.crest.src,
          },
          title,
          details,
          columns,
          rows,
          orientation,
          emptyMessage,
        },
        exportFilename(kind, schoolName, "pdf"),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't generate the PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    downloadCsv(exportFilename(kind, schoolName, "csv"), columnsToCsv(columns, rows));
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={exportPdf} disabled={disabled || busy}>
        <FileText className="size-4" aria-hidden="true" /> {busy ? "Preparing…" : "PDF"}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={exportCsv} disabled={disabled}>
        <Download className="size-4" aria-hidden="true" /> CSV
      </Button>
    </div>
  );
}
