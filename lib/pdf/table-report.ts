import { jsPDF } from "jspdf";
import { BRAND } from "@/lib/brand";
import { formatDate } from "@/lib/format";
import { columnsFor, pdfRows, type ExportColumn } from "@/lib/export";
import { loadImageData, type PdfImage } from "./image";

/**
 * Any list as a printable table, in the same letterhead style as the dashboard report and the
 * student roster: crest, school name, contact line, divider. The header band repeats on every page
 * because these lists can run long. Synchronous and DOM-free, like the other renderers, so a
 * layout bug is findable without a browser.
 */
export interface ReportSchool {
  name: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  logoSrc: string;
}

export interface TableReportData<T> {
  school: ReportSchool;
  /** "Payment History" */
  title: string;
  /** Filters, counts and totals, shown on one line under the title. */
  details: string[];
  columns: ExportColumn<T>[];
  rows: T[];
  orientation?: "portrait" | "landscape";
  emptyMessage: string;
}

const MARGIN = 16;
const ROW_HEIGHT = 7;

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Shorten text with an ellipsis so it never runs into the next column. */
function fit(doc: jsPDF, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let end = text.length;
  while (end > 1 && doc.getTextWidth(`${text.slice(0, end)}…`) > maxWidth) end -= 1;
  return `${text.slice(0, end)}…`;
}

export function renderTableReport<T>(data: TableReportData<T>, logo?: PdfImage | null): jsPDF {
  const orientation = data.orientation ?? "portrait";
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
  const pageWidth = orientation === "portrait" ? 210 : 297;
  const pageHeight = orientation === "portrait" ? 297 : 210;
  const contentWidth = pageWidth - MARGIN * 2;
  const right = pageWidth - MARGIN;
  const deep = rgb(BRAND.palette.deep);

  const columns = columnsFor(data.columns, "pdf");
  const totalWeight = columns.reduce((sum, c) => sum + c.width, 0);
  const widths = columns.map((c) => (contentWidth * c.width) / totalWeight);
  const cellX = (i: number, x: number) => (columns[i]!.align === "right" ? x + widths[i]! - 2 : x + 2);

  function drawHeader(y: number): number {
    doc.setFillColor(245, 246, 248);
    doc.rect(MARGIN, y, contentWidth, ROW_HEIGHT, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(90);
    let x = MARGIN;
    columns.forEach((col, i) => {
      doc.text(fit(doc, col.header, widths[i]! - 4), cellX(i, x), y + ROW_HEIGHT - 2.3, {
        align: col.align === "right" ? "right" : "left",
      });
      x += widths[i]!;
    });
    return y + ROW_HEIGHT;
  }

  // --- letterhead --------------------------------------------------------------------------
  const crestSize = 16;
  if (logo) doc.addImage(logo.dataUrl, logo.format, MARGIN, MARGIN, crestSize, crestSize);
  const nameX = logo ? MARGIN + crestSize + 4 : MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...deep);
  let textY = MARGIN + 7;
  doc.text(data.school.name, nameX, textY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(110);
  textY += 6;
  doc.text(data.title, nameX, textY);

  const contact = [
    data.school.address?.replace(/\s*\n+\s*/g, ", ") || null,
    data.school.email ? `Email: ${data.school.email}` : null,
    data.school.phone ? `Tel: ${data.school.phone}` : null,
  ]
    .filter(Boolean)
    .join("   ·   ");
  if (contact) {
    doc.setFontSize(8);
    doc.setTextColor(130);
    textY += 5;
    doc.text(contact, nameX, textY);
  }

  doc.setFontSize(8.5);
  doc.setTextColor(140);
  textY += 5;
  doc.text([...data.details, `Generated ${formatDate(new Date().toISOString())}`].join(" · "), nameX, textY);

  const dividerY = Math.max(textY + 3, MARGIN + crestSize + 4);
  doc.setDrawColor(...deep);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, dividerY, right, dividerY);

  // --- table ---------------------------------------------------------------------------------
  let y = drawHeader(dividerY + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30);
  for (const cells of pdfRows(columns, data.rows)) {
    if (y + ROW_HEIGHT > pageHeight - MARGIN) {
      doc.addPage();
      y = drawHeader(MARGIN);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(30);
    }
    let x = MARGIN;
    cells.forEach((cell, i) => {
      doc.text(fit(doc, cell, widths[i]! - 4), cellX(i, x), y + ROW_HEIGHT - 2.3, {
        align: columns[i]!.align === "right" ? "right" : "left",
      });
      x += widths[i]!;
    });
    doc.setDrawColor(230);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y + ROW_HEIGHT, right, y + ROW_HEIGHT);
    y += ROW_HEIGHT;
  }

  if (data.rows.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(130);
    doc.text(data.emptyMessage, MARGIN, y + 5);
  }

  // --- footer on every page -------------------------------------------------------------------
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(150);
    doc.text("Computer-generated report.", MARGIN, pageHeight - 10);
    doc.text(`Page ${i} of ${pages}`, right, pageHeight - 10, { align: "right" });
  }

  return doc;
}

export async function downloadTableReport<T>(data: TableReportData<T>, filename: string): Promise<void> {
  const logo = await loadImageData(data.school.logoSrc);
  renderTableReport(data, logo).save(filename);
}
