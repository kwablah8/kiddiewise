import type { ExportColumn } from "@/lib/export";
import type { TerminalReportRowVM, TerminalReportSheetVM } from "@/lib/validators/reports";

const text = (value: number | string | null) => (value === null ? "—" : String(value));
const plain = (value: number | string | null) => (value === null ? "" : String(value));

/** The subjects any student on the sheet has a frozen row for, by name. */
function subjectsOn(rows: TerminalReportRowVM[]): { name: string; code: string | null }[] {
  const seen = new Map<string, string | null>();
  for (const r of rows) for (const s of r.subjects) if (!seen.has(s.subject_name)) seen.set(s.subject_name, s.short_code);
  return [...seen].map(([name, code]) => ({ name, code })).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * A class's results for a term, one row per student with a column per subject. The printed sheet
 * shows each subject's total so it fits a page; the spreadsheet carries class score, exam score and
 * total for each, which is what a moderation needs. Subject columns come from the generated reports,
 * so before a class is generated the sheet has only the overall figures.
 */
export function resultsColumns(rows: TerminalReportRowVM[]): ExportColumn<TerminalReportRowVM>[] {
  const subject = (r: TerminalReportRowVM, name: string) => r.subjects.find((s) => s.subject_name === name);
  const perSubject = subjectsOn(rows).flatMap(({ name, code }): ExportColumn<TerminalReportRowVM>[] => [
    {
      header: code ?? name,
      width: 1,
      align: "right",
      only: "pdf",
      pdf: (r) => text(subject(r, name)?.total ?? null),
    },
    ...(["class_score", "exam_score", "total"] as const).map(
      (field): ExportColumn<TerminalReportRowVM> => ({
        header: `${name} ${field === "class_score" ? "(Class)" : field === "exam_score" ? "(Exam)" : "(Total)"}`,
        width: 1,
        only: "csv",
        pdf: (r) => text(subject(r, name)?.[field] ?? null),
        csv: (r) => plain(subject(r, name)?.[field] ?? null),
      }),
    ),
  ]);

  return [
    { header: "Admission No.", width: 1.7, pdf: (r) => r.admission_no },
    { header: "Student", width: 2.3, pdf: (r) => r.student_name },
    ...perSubject,
    { header: "Total", width: 1, align: "right", pdf: (r) => text(r.total_score), csv: (r) => plain(r.total_score) },
    {
      header: "Average",
      width: 1.2,
      align: "right",
      pdf: (r) => (r.average_score === null ? "—" : `${r.average_score}%`),
      csv: (r) => plain(r.average_score),
    },
    { header: "Grade", width: 1, pdf: (r) => r.overall_grade ?? "—", csv: (r) => r.overall_grade ?? "" },
    { header: "Position", width: 1.2, align: "right", pdf: (r) => text(r.position), csv: (r) => plain(r.position) },
    {
      header: "Attendance",
      width: 1.4,
      align: "right",
      only: "pdf",
      pdf: (r) => (r.attendance_total === 0 ? "—" : `${r.attendance_present}/${r.attendance_total}`),
    },
    // Two numbers rather than "12/14", which a spreadsheet would read as a date.
    { header: "Days present", width: 1, only: "csv", pdf: (r) => String(r.attendance_present) },
    { header: "Days marked", width: 1, only: "csv", pdf: (r) => String(r.attendance_total) },
  ];
}

export function resultsDetails(labels: string[], sheet: TerminalReportSheetVM): string[] {
  return [...labels, `${sheet.generated_count} of ${sheet.rows.length} reports generated`];
}
