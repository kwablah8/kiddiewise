import { jsPDF } from "jspdf";
import { BRAND } from "@/lib/brand";
import { formatDate, formatRole } from "@/lib/format";
import type { StudentListItemVM } from "@/lib/validators/people";
import { loadImageData, type PdfImage } from "./image";

/**
 * The full student roster as a printable list, same letterhead style as the dashboard report
 * (lib/pdf/dashboard-report.ts): crest, school name, address/email/phone on one line, a divider.
 * Unlike that report's tables, this one can run to many pages for a large school, so its table
 * repeats the header band on every page rather than only once at the top.
 */
export interface StudentsRosterData {
  schoolName: string;
  schoolAddress: string | null;
  schoolEmail: string | null;
  schoolPhone: string | null;
  /** "First Term · 2026/2027", or null when no year/term is active yet. */
  termLabel: string | null;
  students: StudentListItemVM[];
  logoSrc: string;
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const MARGIN = 16;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const RIGHT = PAGE_WIDTH - MARGIN;
const ROW_HEIGHT = 7;

interface Column {
  header: string;
  width: number;
}

const COLUMNS: Column[] = [
  { header: "Admission No.", width: CONTENT_WIDTH * 0.14 },
  { header: "Name", width: CONTENT_WIDTH * 0.22 },
  { header: "Class", width: CONTENT_WIDTH * 0.16 },
  { header: "Gender", width: CONTENT_WIDTH * 0.1 },
  { header: "Status", width: CONTENT_WIDTH * 0.14 },
  { header: "Guardian(s)", width: CONTENT_WIDTH * 0.24 },
];

function drawTableHeader(doc: jsPDF, deep: [number, number, number], y: number): number {
  doc.setFillColor(245, 246, 248);
  doc.rect(MARGIN, y, CONTENT_WIDTH, ROW_HEIGHT, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(90);
  let x = MARGIN;
  for (const col of COLUMNS) {
    doc.text(col.header, x + 2, y + ROW_HEIGHT - 2.3);
    x += col.width;
  }
  return y + ROW_HEIGHT;
}

function studentRow(s: StudentListItemVM): string[] {
  return [
    s.admission_no,
    `${s.first_name} ${s.last_name}`,
    s.class_name ?? "—",
    formatRole(s.gender),
    formatRole(s.enrollment_status),
    s.guardian_names.length > 0 ? s.guardian_names.join(", ") : "—",
  ];
}

/** Synchronous and DOM-free like the dashboard report, a layout bug is findable without a browser. */
export function renderStudentsRoster(data: StudentsRosterData, logo?: PdfImage | null): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const deep = rgb(BRAND.palette.deep);

  // --- letterhead --------------------------------------------------------------------------
  const crestSize = 16;
  if (logo) doc.addImage(logo.dataUrl, logo.format, MARGIN, MARGIN, crestSize, crestSize);
  const nameX = logo ? MARGIN + crestSize + 4 : MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...deep);
  let textY = MARGIN + 7;
  doc.text(data.schoolName, nameX, textY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(110);
  textY += 6;
  doc.text("Student Roster", nameX, textY);

  // Same three fields, same order, as the dashboard report's own letterhead.
  const contact = [
    data.schoolAddress?.replace(/\s*\n+\s*/g, ", ") || null,
    data.schoolEmail ? `Email: ${data.schoolEmail}` : null,
    data.schoolPhone ? `Tel: ${data.schoolPhone}` : null,
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
  const count = data.students.length;
  const subtitle = [
    data.termLabel,
    `${count} student${count === 1 ? "" : "s"}`,
    `Generated ${formatDate(new Date().toISOString())}`,
  ]
    .filter(Boolean)
    .join(" · ");
  textY += 5;
  doc.text(subtitle, nameX, textY);

  const dividerY = Math.max(textY + 3, MARGIN + crestSize + 4);
  doc.setDrawColor(...deep);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, dividerY, RIGHT, dividerY);

  // --- table ---------------------------------------------------------------------------------
  let y = dividerY + 8;
  y = drawTableHeader(doc, deep, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30);
  for (const student of data.students) {
    if (y + ROW_HEIGHT > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
      y = drawTableHeader(doc, deep, y);
    }
    let x = MARGIN;
    studentRow(student).forEach((cell, i) => {
      doc.text(cell, x + 2, y + ROW_HEIGHT - 2.3);
      x += COLUMNS[i]!.width;
    });
    doc.setDrawColor(230);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y + ROW_HEIGHT, RIGHT, y + ROW_HEIGHT);
    y += ROW_HEIGHT;
  }

  if (data.students.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(130);
    doc.text("No students on record yet.", MARGIN, y + 5);
  }

  // --- footer on every page -------------------------------------------------------------------
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(150);
    doc.text("Computer-generated report.", MARGIN, PAGE_HEIGHT - 10);
    doc.text(`Page ${i} of ${pages}`, RIGHT, PAGE_HEIGHT - 10, { align: "right" });
  }

  return doc;
}

function rosterBaseName(schoolName: string): string {
  const school = schoolName.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  return `student-roster-${school}-${date}`;
}

export function studentsRosterFilename(schoolName: string): string {
  return `${rosterBaseName(schoolName)}.pdf`;
}

export function studentsRosterCsvFilename(schoolName: string): string {
  return `${rosterBaseName(schoolName)}.csv`;
}

export async function downloadStudentsRoster(data: StudentsRosterData): Promise<void> {
  const logo = await loadImageData(data.logoSrc);
  renderStudentsRoster(data, logo).save(studentsRosterFilename(data.schoolName));
}
