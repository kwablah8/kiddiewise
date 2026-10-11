"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/csv";
import { columnsToCsv, exportFilename, type ExportColumn } from "@/lib/export";
import { downloadTableReport } from "@/lib/pdf/table-report";
import { useReportSchool } from "@/lib/pdf/use-report-school";

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
  const school = useReportSchool();
  const [busy, setBusy] = useState(false);

  async function exportPdf() {
    setBusy(true);
    try {
      await downloadTableReport(
        {
          school,
          title,
          details,
          columns,
          rows,
          orientation,
          emptyMessage,
        },
        exportFilename(kind, school.name, "pdf"),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't generate the PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    downloadCsv(exportFilename(kind, school.name, "csv"), columnsToCsv(columns, rows));
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
