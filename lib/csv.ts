/**
 * Minimal CSV export: build the text with `toCsv`, hand it to `downloadCsv`. No library, RFC 4180
 * quoting is one rule (wrap in quotes and double any embedded quote whenever a cell contains a
 * comma, quote or newline) and not worth a dependency for.
 */

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(headers: string[], rows: string[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(","));
  // A leading BOM so Excel (still the common opener) reads the file as UTF-8 instead of guessing
  // a local codepage and mangling anything outside ASCII.
  return "﻿" + lines.join("\r\n");
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
