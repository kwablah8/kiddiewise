import { jsPDF } from "jspdf";
import { BRAND } from "@/lib/brand";
import { formatDate } from "@/lib/format";
import type { ReportSubjectRowVM } from "@/lib/validators/reports";
import { loadImageData, type PdfImage } from "./image";

/** jsPDF's colour setters take RGB triples; `BRAND.palette` is the CSS-shaped fact. */
function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Everything the card prints, assembled by the caller (the report dialog) from rows it already
 * holds — the renderer stays pure and DOM-free, mirroring `receipt-pdf.ts`.
 */
export interface ReportCardData {
  schoolName: string;
  schoolAddress: string | null;
  schoolEmail: string | null;
  studentName: string;
  admissionNo: string;
  className: string;
  yearName: string | null;
  termName: string;
  /** "Number on roll" — the class size frozen at generation. */
  enrolledCount: number | null;
  classTeacherName: string | null;
  position: number | null;
  reopeningDate: string | null;
  attendancePresent: number;
  attendanceTotal: number;
  subjects: ReportSubjectRowVM[];
  conduct: string | null;
  attitude: string | null;
  interest: string | null;
  promotedTo: string | null;
  classTeacherRemark: string | null;
  /** The school's CA weight; the exam column header prints `100 - caWeight`. */
  caWeight: number;
  logoSrc: string;
}

const num = (v: number | null): string => (v === null ? "" : String(v));

/**
 * The GES Terminal Report Sheet (the school's supplied template): crest header, black title band,
 * passport box, student header block, the five-column subject table, then attendance, promotion,
 * conduct/attitude/interest and the class teacher's remarks.
 *
 * A4 portrait — this one IS a full page, unlike the A5 receipt. Same reasoning for jsPDF over a
 * print stylesheet: it downloads identically everywhere and attaches to WhatsApp, which is how it
 * reaches a parent.
 */
export function renderReportCard(data: ReportCardData, logo?: PdfImage | null): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const right = pageWidth - margin;
  const deep = rgb(BRAND.palette.deep);

  // --- School header ------------------------------------------------------------------------
  const crestSize = 22;
  if (logo) doc.addImage(logo.dataUrl, logo.format, margin, 14, crestSize, crestSize);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...deep);
  doc.text(data.schoolName.toUpperCase(), pageWidth / 2, 20, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  if (data.schoolAddress) doc.text(data.schoolAddress, pageWidth / 2, 26, { align: "center" });
  if (data.schoolEmail) doc.text(`Email: ${data.schoolEmail}`, pageWidth / 2, 31, { align: "center" });

  // Passport box, top right — the template reserves it even when no photo exists yet.
  doc.setDrawColor(60);
  doc.rect(right - 28, 12, 28, 32);
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("Passport", right - 14, 29, { align: "center" });

  // --- Title band ----------------------------------------------------------------------------
  const bandY = 48;
  doc.setFillColor(0, 0, 0);
  doc.rect(margin, bandY, right - margin, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("TERMINAL REPORT SHEET", pageWidth / 2, bandY + 6.2, { align: "center" });

  // --- Student header block ------------------------------------------------------------------
  doc.setFontSize(10);
  doc.setTextColor(0);
  let y = bandY + 17;
  const line = (pairs: [string, string][]) => {
    let x = margin;
    for (const [label, value] of pairs) {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}: `, x, y);
      x += doc.getTextWidth(`${label}: `);
      doc.setFont("helvetica", "normal");
      doc.text(value, x, y);
      x += doc.getTextWidth(value) + 8;
    }
    y += 7;
  };

  line([["NAME", data.studentName], ["CLASS", data.className]]);
  line([
    ["ACADEMIC YEAR", data.yearName ?? "—"],
    ["TERM", data.termName],
    ["NO. ON ROLL", data.enrolledCount === null ? "—" : String(data.enrolledCount)],
  ]);
  line([
    ["CLASS TEACHER", data.classTeacherName ?? "—"],
    ["POSITION", data.position === null ? "—" : String(data.position)],
  ]);
  line([["REOPENING DATE", data.reopeningDate ? formatDate(data.reopeningDate) : "—"]]);

  // --- Subject table ---------------------------------------------------------------------------
  const examWeight = 100 - data.caWeight;
  const tableTop = y + 2;
  const cols = [
    { header: "SUBJECTS", width: 48, align: "left" as const },
    { header: `Class Score ${data.caWeight}%`, width: 26, align: "center" as const },
    { header: `Exams Score ${examWeight}%`, width: 26, align: "center" as const },
    { header: "Total Score 100%", width: 26, align: "center" as const },
    { header: "Position", width: 16, align: "center" as const },
    // Wide enough for "Very Good" on ONE line — a wrapped remark collides with the next row.
    { header: "Remarks", width: 0, align: "left" as const }, // 0 = stretch to the right edge
  ];
  const tableWidth = right - margin;
  const fixed = cols.reduce((s, c) => s + c.width, 0);
  cols[cols.length - 1]!.width = tableWidth - fixed;

  const rowHeight = 8;
  const headerHeight = 10;

  // Header row
  doc.setFillColor(235, 235, 235);
  doc.rect(margin, tableTop, tableWidth, headerHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  let cx = margin;
  for (const c of cols) {
    const tx = c.align === "left" ? cx + 2 : cx + c.width / 2;
    doc.text(c.header, tx, tableTop + 6, { align: c.align === "left" ? "left" : "center", maxWidth: c.width - 3 });
    cx += c.width;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  data.subjects.forEach((s, i) => {
    const top = tableTop + headerHeight + i * rowHeight;
    const cells = [s.subject_name, num(s.class_score), num(s.exam_score), num(s.total), num(s.position), s.remark ?? ""];
    let x = margin;
    cells.forEach((value, j) => {
      const col = cols[j]!;
      const tx = col.align === "left" ? x + 2 : x + col.width / 2;
      doc.text(String(value), tx, top + 5.5, {
        align: col.align === "left" ? "left" : "center",
        maxWidth: col.width - 3,
      });
      x += col.width;
    });
  });

  // Grid lines drawn once over the finished table — cleaner corners than per-cell rects.
  const tableBottom = tableTop + headerHeight + data.subjects.length * rowHeight;
  doc.setDrawColor(60);
  doc.rect(margin, tableTop, tableWidth, tableBottom - tableTop);
  cx = margin;
  for (const c of cols.slice(0, -1)) {
    cx += c.width;
    doc.line(cx, tableTop, cx, tableBottom);
  }
  doc.line(margin, tableTop + headerHeight, right, tableTop + headerHeight);
  for (let i = 1; i <= data.subjects.length; i++) {
    const ly = tableTop + headerHeight + i * rowHeight;
    if (ly < tableBottom) doc.line(margin, ly, right, ly);
  }

  // --- Footer block ---------------------------------------------------------------------------
  y = tableBottom + 12;
  const attendance =
    data.attendanceTotal === 0 ? "—" : `${data.attendancePresent} OUT OF ${data.attendanceTotal}`;
  // getTextWidth drops a trailing space, so the gap is added explicitly.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("ATTENDANCE:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(attendance, margin + doc.getTextWidth("ATTENDANCE:") + 2, y);
  doc.setFont("helvetica", "bold");
  doc.text("PROMOTED TO:", pageWidth / 2, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.promotedTo ?? "—", pageWidth / 2 + doc.getTextWidth("PROMOTED TO:") + 2, y);
  y += 10;

  const paragraph = (label: string, value: string | null) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    const text = value?.trim() ? value : "—";
    const lines = doc.splitTextToSize(text, tableWidth - 4) as string[];
    doc.text(lines, margin, y + 6);
    y += 8 + lines.length * 5;
  };

  paragraph("CONDUCT", data.conduct);
  paragraph("ATTITUDE", data.attitude);
  paragraph("INTEREST", data.interest);
  paragraph("CLASS TEACHER'S REMARKS", data.classTeacherRemark);

  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("Computer-generated report — issued by the school.", pageWidth / 2, footerY, {
    align: "center",
  });

  return doc;
}

export function reportCardFilename(data: ReportCardData): string {
  const student = data.studentName.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  const term = data.termName.replace(/[^a-zA-Z0-9]+/g, "-");
  return `Report-${student}-${term}.pdf`;
}

/** Render and hand to the browser as a download; split like the receipt so drawing stays testable. */
export async function downloadReportCard(data: ReportCardData): Promise<void> {
  const logo = await loadImageData(data.logoSrc);
  renderReportCard(data, logo).save(reportCardFilename(data));
}
