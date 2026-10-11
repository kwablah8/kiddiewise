"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadCsv } from "@/lib/csv";
import { columnsToCsv, exportFilename } from "@/lib/export";
import { formatDate } from "@/lib/format";
import { buildCheckinRows, checkinColumns, checkinDetails } from "@/lib/gate-export";
import { downloadTableReport } from "@/lib/pdf/table-report";
import { useReportSchool } from "@/lib/pdf/use-report-school";
import { useFetchPresenceRange } from "@/lib/queries/gate";
import type { PersonKind } from "@/lib/validators/gate";

const MAX_DAYS = 366;

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1;
}

/**
 * Export the gate check-ins for a stretch of days, for whoever the tab is showing (students, one
 * class, or staff). The tab itself shows one day; an end-of-term list needs many.
 */
export function CheckinsExportDialog({
  open,
  onOpenChange,
  date,
  today,
  timeZone,
  kind,
  classId,
  className,
  classOf,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  today: string;
  timeZone: string;
  kind: PersonKind;
  /** The class the tab is narrowed to, or null for every class. */
  classId: string | null;
  className: string | null;
  classOf: Map<string, string | null>;
}) {
  const [from, setFrom] = useState(date);
  const [to, setTo] = useState(date);
  const school = useReportSchool();
  const fetchRange = useFetchPresenceRange();
  const [format, setFormat] = useState<"pdf" | "csv" | null>(null);

  const days = daysBetween(from, to);
  const problem =
    !from || !to
      ? "Choose both dates."
      : days < 1
        ? "The first date must not be after the last."
        : days > MAX_DAYS
          ? `Choose a range of up to ${MAX_DAYS} days.`
          : null;
  const who = kind === "staff" ? "Staff" : (className ?? "All classes");

  async function download(as: "pdf" | "csv") {
    setFormat(as);
    try {
      const presence = await fetchRange.mutateAsync({ from, to });
      const rows = buildCheckinRows(presence, kind, classId, classOf);
      const columns = checkinColumns(kind, timeZone);
      const kindLabel = kind === "staff" ? "staff" : "student";
      const range = from === to ? formatDate(from) : `${formatDate(from)} to ${formatDate(to)}`;
      if (as === "csv") {
        downloadCsv(exportFilename(`${kindLabel}-checkins`, school.name, "csv"), columnsToCsv(columns, rows));
      } else {
        await downloadTableReport(
          {
            school,
            title: kind === "staff" ? "Staff Check-ins" : "Student Check-ins",
            details: checkinDetails([who, range], rows),
            columns,
            rows,
            emptyMessage: "Nobody scanned at the gate in this period.",
          },
          exportFilename(`${kindLabel}-checkins`, school.name, "pdf"),
        );
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't export the check-ins. Please try again.");
    } finally {
      setFormat(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export check-ins</DialogTitle>
          <DialogDescription>
            {who}, one line for each day a person scanned at the gate. People who didn&rsquo;t scan aren&rsquo;t
            listed.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="export_from">From</Label>
            <Input id="export_from" type="date" value={from} max={today} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="export_to">To</Label>
            <Input id="export_to" type="date" value={to} max={today} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        {problem && <p className="text-sm text-[var(--danger)]">{problem}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" disabled={!!problem || format !== null} onClick={() => download("pdf")}>
            {format === "pdf" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileText className="size-4" aria-hidden="true" />
            )}
            PDF
          </Button>
          <Button type="button" disabled={!!problem || format !== null} onClick={() => download("csv")}>
            {format === "csv" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="size-4" aria-hidden="true" />
            )}
            CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
