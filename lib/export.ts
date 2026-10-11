import { toCsv } from "@/lib/csv";

/**
 * One definition of a table's columns that both the PDF and the CSV read, so the two files can
 * never drift apart. The printed cell is formatted for people ("GHS 1,200.00"); the spreadsheet
 * cell, where it differs, is the plain value ("1200.00") so Excel can sort and total it.
 */
export interface ExportColumn<T> {
  header: string;
  /** Relative width in the PDF; the widths in a table are scaled to fill the page. */
  width: number;
  align?: "right";
  pdf: (row: T) => string;
  csv?: (row: T) => string;
  /** Leave out of the other format: "pdf" columns are printed only, "csv" columns are spreadsheet only. */
  only?: "pdf" | "csv";
}

/** The columns one format carries. A table can print a summary and give the spreadsheet the detail. */
export function columnsFor<T>(columns: ExportColumn<T>[], format: "pdf" | "csv"): ExportColumn<T>[] {
  return columns.filter((c) => !c.only || c.only === format);
}

export function pdfRows<T>(columns: ExportColumn<T>[], rows: T[]): string[][] {
  return rows.map((row) => columns.map((c) => c.pdf(row)));
}

export function columnsToCsv<T>(all: ExportColumn<T>[], rows: T[]): string {
  const columns = columnsFor(all, "csv");
  return toCsv(
    columns.map((c) => c.header),
    rows.map((row) => columns.map((c) => (c.csv ?? c.pdf)(row))),
  );
}

/** `payments-Kiddiewise-2026-10-12.csv` */
export function exportFilename(kind: string, schoolName: string, extension: "pdf" | "csv"): string {
  const school = schoolName.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  return `${kind}-${school}-${date}.${extension}`;
}
