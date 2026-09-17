import { jsPDF } from "jspdf";
import { BRAND } from "@/lib/brand";
import { formatDate, formatGHS, formatMonthShort, formatPercent, formatTrend } from "@/lib/format";
import type {
  DashboardStatsVM,
  DashboardTrendsVM,
  TrendPointVM,
  ClassPerformanceVM,
  ClassAttendanceVM,
} from "@/lib/validators/dashboard";
import type { FeesOverviewVM } from "@/lib/validators/fees";
import { loadImageData, type PdfImage } from "./image";

/** One row of the staff roster table — computed by the caller from the same `StaffVM[]` the Staff screen reads. */
export interface StaffRosterRow {
  roleLabel: string;
  active: number;
  inactive: number;
}

/**
 * A summary snapshot of the admin dashboard: the same four totals and trend pills, the same two
 * monthly trends, the same class-performance table, rendered from the live data rather than a
 * screenshot of the charts. A table of (month, value) says what a line chart says and prints
 * legibly on a school's mono laser, which a captured canvas would not.
 *
 * Fee breakdown, staff roster and attendance-by-class go further than what's on screen: the
 * dashboard's own cards only show one total each (revenue, staff count, one school-wide
 * attendance rate) — this report is meant to actually be read later, not just glanced at.
 */
export interface DashboardReportData {
  schoolName: string;
  /** Same three fields the report card's own letterhead shows (lib/pdf/report-card.ts). */
  schoolAddress: string | null;
  schoolEmail: string | null;
  schoolPhone: string | null;
  /** "First Term · 2026/2027", or null when no year/term is active yet. */
  termLabel: string | null;
  stats: DashboardStatsVM;
  trends: DashboardTrendsVM;
  enrollmentTrend: TrendPointVM[];
  feeTrend: TrendPointVM[];
  feesOverview: FeesOverviewVM;
  staffRoster: StaffRosterRow[];
  classPerformance: ClassPerformanceVM[];
  classAttendance: ClassAttendanceVM[];
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

interface TableColumn {
  header: string;
  width: number;
  align?: "left" | "right";
}

/** Starts a new page and resets `y` to the top margin when `needed` more mm won't fit. */
function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed <= PAGE_HEIGHT - MARGIN) return y;
  doc.addPage();
  return MARGIN;
}

function sectionTitle(doc: jsPDF, deep: [number, number, number], text: string, y: number): number {
  // Reserve the title's own height plus enough for at least the first line of whatever follows
  // (a table's header + one row, or the shorter first line of a card), not just the title alone —
  // otherwise a heading can land as the last line of a page with its content orphaned on the next.
  y = ensureSpace(doc, y, 9 + 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...deep);
  doc.text(text, MARGIN, y);
  doc.setDrawColor(...deep);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y + 2, RIGHT, y + 2);
  return y + 9;
}

/** A plain ruled table: header band, body rows, no per-cell borders — one rule beats a grid here. */
function drawTable(doc: jsPDF, y: number, columns: TableColumn[], rows: string[][]): number {
  const rowHeight = 7;
  y = ensureSpace(doc, y, rowHeight * 2);

  doc.setFillColor(245, 246, 248);
  doc.rect(MARGIN, y, CONTENT_WIDTH, rowHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(90);
  let x = MARGIN;
  for (const col of columns) {
    const tx = col.align === "right" ? x + col.width - 2 : x + 2;
    doc.text(col.header, tx, y + rowHeight - 2.3, { align: col.align === "right" ? "right" : "left" });
    x += col.width;
  }
  y += rowHeight;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(30);
  for (const row of rows) {
    y = ensureSpace(doc, y, rowHeight);
    x = MARGIN;
    row.forEach((cell, i) => {
      const col = columns[i]!;
      const tx = col.align === "right" ? x + col.width - 2 : x + 2;
      doc.text(cell, tx, y + rowHeight - 2.3, { align: col.align === "right" ? "right" : "left" });
      x += col.width;
    });
    doc.setDrawColor(230);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y + rowHeight, RIGHT, y + rowHeight);
    y += rowHeight;
  }

  return y + 6;
}

interface Card {
  label: string;
  value: string;
  /** Omitted entirely for a card with nothing to compare against (Fee Breakdown has no "vs last month"). */
  trend?: number;
}

/** A row of up to 4 stat cards. Shared by Key Stats (with trend pills) and Fee Breakdown (without). */
function cardsRow(doc: jsPDF, cards: Card[], y: number): number {
  const cardWidth = (CONTENT_WIDTH - (cards.length - 1) * 3) / cards.length;
  const cardHeight = 22;

  cards.forEach((card, i) => {
    const x = MARGIN + i * (cardWidth + 3);
    doc.setDrawColor(225);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, cardWidth, cardHeight, 1.5, 1.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(120);
    doc.text(card.label, x + 3, y + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(20);
    doc.text(card.value, x + 3, y + 14.5);

    if (card.trend !== undefined) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      // Matches TrendPill's own rule: zero is neither good nor bad, so it gets neutral gray rather
      // than defaulting into the positive tint a `>= 0` comparison would otherwise give it.
      if (card.trend === 0) doc.setTextColor(130);
      else if (card.trend > 0) doc.setTextColor(30, 130, 60);
      else doc.setTextColor(180, 60, 60);
      doc.text(formatTrend(card.trend), x + 3, y + 19.5);
    }
  });

  return y + cardHeight + 10;
}

function statsSection(doc: jsPDF, deep: [number, number, number], data: DashboardReportData, y: number): number {
  y = sectionTitle(doc, deep, "Key Stats", y);
  return cardsRow(
    doc,
    [
      { label: "Total Students", value: data.stats.total_students.toLocaleString("en-GH"), trend: data.trends.students },
      { label: "Total Staff", value: data.stats.total_staff.toLocaleString("en-GH"), trend: data.trends.staff },
      { label: "Total Revenue", value: formatGHS(data.stats.total_revenue), trend: data.trends.revenue },
      { label: "Attendance Rate", value: formatPercent(data.stats.attendance_rate), trend: data.trends.attendance },
    ],
    y,
  );
}

/**
 * Goes beyond the dashboard's single "Total Revenue" card: expected/paid/outstanding and the
 * collection rate as headline cards, then how many invoices are fully paid, partial or still
 * pending — the number the office actually chases day to day. Same source as the Fees screen's
 * own overview (lib/data/fees.ts#getFeesOverview), no filter, matching what that screen defaults to.
 */
function feeBreakdownSection(doc: jsPDF, deep: [number, number, number], data: DashboardReportData, y: number): number {
  y = sectionTitle(doc, deep, "Fee Breakdown", y);
  const fo = data.feesOverview;
  y = cardsRow(
    doc,
    [
      { label: "Expected", value: formatGHS(fo.total_expected) },
      { label: "Paid", value: formatGHS(fo.total_paid) },
      { label: "Outstanding", value: formatGHS(fo.outstanding) },
      { label: "Collection Rate", value: formatPercent(fo.collection_rate) },
    ],
    y,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(
    `${fo.fully_paid} fully paid · ${fo.partial} partial · ${fo.pending} pending`
      + ` (${fo.total_records} invoice${fo.total_records === 1 ? "" : "s"})`
      + (fo.total_arrears > 0 ? ` · ${formatGHS(fo.total_arrears)} in arrears carried over` : ""),
    MARGIN,
    y - 4,
  );
  return y + 4;
}

/** Role | Active | Inactive | Total. Same counts the Staff screen's own status pills are built from. */
function staffRosterSection(doc: jsPDF, deep: [number, number, number], data: DashboardReportData, y: number): number {
  y = sectionTitle(doc, deep, "Staff Roster", y);
  if (data.staffRoster.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(130);
    doc.text("No staff on record yet.", MARGIN, y + 4);
    return y + 12;
  }
  const columns: TableColumn[] = [
    { header: "Role", width: CONTENT_WIDTH * 0.4 },
    { header: "Active", width: CONTENT_WIDTH * 0.2, align: "right" },
    { header: "Inactive", width: CONTENT_WIDTH * 0.2, align: "right" },
    { header: "Total", width: CONTENT_WIDTH * 0.2, align: "right" },
  ];
  const rows = data.staffRoster.map((r) => [
    r.roleLabel,
    String(r.active),
    String(r.inactive),
    String(r.active + r.inactive),
  ]);
  return drawTable(doc, y, columns, rows);
}

/** Class | Level | Present | Total | Rate. A class with no attendance recorded yet shows a dash, not 0%. */
function classAttendanceSection(doc: jsPDF, deep: [number, number, number], data: DashboardReportData, y: number): number {
  y = sectionTitle(doc, deep, "Attendance by Class", y);
  if (data.classAttendance.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(130);
    doc.text("No attendance recorded yet.", MARGIN, y + 4);
    return y + 12;
  }
  const columns: TableColumn[] = [
    { header: "Class", width: CONTENT_WIDTH * 0.34 },
    { header: "Level", width: CONTENT_WIDTH * 0.2 },
    { header: "Present", width: CONTENT_WIDTH * 0.16, align: "right" },
    { header: "Total", width: CONTENT_WIDTH * 0.15, align: "right" },
    { header: "Rate", width: CONTENT_WIDTH * 0.15, align: "right" },
  ];
  const rows = data.classAttendance.map((c) => [
    c.class_name,
    c.level,
    String(c.present_count),
    String(c.total_count),
    c.total_count === 0 ? "—" : `${Math.round((100 * c.present_count) / c.total_count)}%`,
  ]);
  return drawTable(doc, y, columns, rows);
}

function trendSection(doc: jsPDF, deep: [number, number, number], title: string, valueHeader: string,
  points: TrendPointVM[], formatValue: (v: number) => string, y: number): number {
  y = sectionTitle(doc, deep, title, y);
  if (points.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(130);
    doc.text("No data for this period.", MARGIN, y + 4);
    return y + 12;
  }
  const columns: TableColumn[] = [
    { header: "Month", width: CONTENT_WIDTH * 0.6 },
    { header: valueHeader, width: CONTENT_WIDTH * 0.4, align: "right" },
  ];
  const rows = points.map((p) => [formatMonthShort(p.month), formatValue(p.value)]);
  return drawTable(doc, y, columns, rows);
}

function classPerformanceSection(doc: jsPDF, deep: [number, number, number], data: DashboardReportData, y: number): number {
  y = sectionTitle(doc, deep, "Class Performance", y);
  if (data.classPerformance.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(130);
    doc.text("No classes with results yet.", MARGIN, y + 4);
    return y + 12;
  }
  const columns: TableColumn[] = [
    { header: "Class", width: CONTENT_WIDTH * 0.4 },
    { header: "Level", width: CONTENT_WIDTH * 0.2 },
    { header: "Students", width: CONTENT_WIDTH * 0.2, align: "right" },
    { header: "Average Score", width: CONTENT_WIDTH * 0.2, align: "right" },
  ];
  const rows = data.classPerformance.map((c) => [
    c.class_name,
    c.level,
    String(c.students),
    c.average_score === null ? "—" : `${c.average_score.toFixed(1)}%`,
  ]);
  return drawTable(doc, y, columns, rows);
}

/**
 * Draw the report. Synchronous and DOM-free like renderReceipt/renderReportCard, so a layout bug
 * is findable without a browser — `downloadDashboardReport` is the thin async wrapper that loads
 * the crest and hands the finished document to the browser.
 */
export function renderDashboardReport(data: DashboardReportData, logo?: PdfImage | null): jsPDF {
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
  doc.text("Dashboard Report", nameX, textY);

  // Same three fields, same order, as the report card's own letterhead — one line here rather
  // than that document's stacked lines, this header is denser and left-aligned, not a formal
  // single-child card, but a school reading both should recognise the same facts.
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
  const subtitle = [data.termLabel, `Generated ${formatDate(new Date().toISOString())}`]
    .filter(Boolean)
    .join(" · ");
  textY += 5;
  doc.text(subtitle, nameX, textY);

  const dividerY = Math.max(textY + 3, MARGIN + crestSize + 4);
  doc.setDrawColor(...deep);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, dividerY, RIGHT, dividerY);

  // --- body ----------------------------------------------------------------------------------
  let y = dividerY + 12;
  y = statsSection(doc, deep, data, y);
  y = trendSection(doc, deep, "Enrollment Trend", "New Enrollments", data.enrollmentTrend, (v) => String(v), y);
  y = trendSection(doc, deep, "Fee Trend", "Revenue", data.feeTrend, formatGHS, y);
  y = feeBreakdownSection(doc, deep, data, y);
  y = staffRosterSection(doc, deep, data, y);
  y = classPerformanceSection(doc, deep, data, y);
  classAttendanceSection(doc, deep, data, y);

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

export function dashboardReportFilename(schoolName: string): string {
  const school = schoolName.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  return `dashboard-report-${school}-${date}.pdf`;
}

export async function downloadDashboardReport(data: DashboardReportData): Promise<void> {
  const logo = await loadImageData(data.logoSrc);
  renderDashboardReport(data, logo).save(dashboardReportFilename(data.schoolName));
}
