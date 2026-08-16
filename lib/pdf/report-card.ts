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

/** One line of the school's grading scale, as the card's key prints it. */
export interface ReportGradeBand {
  grade: string;
  remark: string;
  min_score: number;
  max_score: number;
}

/**
 * Everything the card prints, assembled by the caller (the report dialog) from rows it already
 * holds — the renderer stays pure and DOM-free, mirroring `receipt-pdf.ts`.
 */
export interface ReportCardData {
  schoolName: string;
  /** Free text; every line is printed under the school's name, as on its letterhead. */
  schoolAddress: string | null;
  schoolEmail: string | null;
  schoolPhone: string | null;
  /** Printed surname-first ("Boakye-Dankwah, Kofi Sarfo"), the way school records read. */
  studentFirstName: string;
  studentLastName: string;
  admissionNo: string;
  className: string;
  /** Labels the second position line: "Position in JHS". */
  levelName: string | null;
  yearName: string | null;
  termName: string;
  /** "Number on roll" — the class size frozen at generation. */
  enrolledCount: number | null;
  classTeacherName: string | null;
  position: number | null;
  levelPosition: number | null;
  levelSize: number | null;
  passes: number | null;
  totalScore: number | null;
  averageScore: number | null;
  classAverage: number | null;
  classLowestAverage: number | null;
  classHighestAverage: number | null;
  reopeningDate: string | null;
  attendancePresent: number;
  attendanceTotal: number;
  subjects: ReportSubjectRowVM[];
  gradeBands: ReportGradeBand[];
  conduct: string | null;
  attitude: string | null;
  interest: string | null;
  promotedTo: string | null;
  classTeacherRemark: string | null;
  headTeacherRemark: string | null;
  /** The school's CA weight; the exam column header prints `100 - caWeight`. */
  caWeight: number;
  logoSrc: string;
}

const MARGIN = 12;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const RIGHT = PAGE_WIDTH - MARGIN;
const INK = 0;
const MUTED = 90;

/**
 * The school's colours, used with restraint — this is an official record, not a brochure. Navy
 * carries the school's name, the term band and every heading; gold appears only as hairline rules,
 * because it fails contrast as text. Everything a parent actually READS stays black on white.
 */
const NAVY = rgb(BRAND.palette.deep);
const ROYAL = rgb(BRAND.palette.strong);
const GOLD = rgb(BRAND.palette.accent);
const TINT = rgb(BRAND.palette.tint);
/** Box and grid rules: navy at a weight that reads as a neutral rule, not as colour. */
const RULE: [number, number, number] = [150, 158, 180];

/** Card figures carry one decimal — 23.0, 86.7, 877.7. A blank stays blank, never a 0.0. */
const dec = (v: number | null | undefined): string =>
  v === null || v === undefined ? "" : v.toFixed(1);

/** Band edges read as the school wrote them: 100%, not 100.0%; 89.9%, not 90%. */
const pct = (v: number): string => `${Number(v.toFixed(1))}%`;

/** "1/16" — a rank only means something against the size of the group it was taken over. */
const rank = (position: number | null, size: number | null): string =>
  position === null ? "—" : size === null ? String(position) : `${position}/${size}`;

/**
 * Draw one table cell on EXACTLY one line: shrink the type to fit, then clip with an ellipsis.
 *
 * jsPDF's `maxWidth` wraps instead of shrinking, and a wrapped cell in a fixed-height row prints
 * its second line on top of the subject below it — "Information and Communication Technology"
 * landing across the next child's science mark. Leaves the font size as it found it.
 */
function fitCell(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  align: "left" | "center",
  baseSize: number,
): void {
  let size = baseSize;
  doc.setFontSize(size);
  // 5pt is the floor: below that the card stops being readable and truncation is the honest answer.
  while (size > 5 && doc.getTextWidth(text) > width) {
    size -= 0.15;
    doc.setFontSize(size);
  }
  let out = text;
  while (out.length > 1 && doc.getTextWidth(out + "…") > width) out = out.slice(0, -1);
  doc.text(out === text ? text : `${out}…`, x, y, { align });
  doc.setFontSize(baseSize);
}

/**
 * The school's report card, field for field: letterhead, the boxed term title, the student's
 * identity block, the grading key, the twelve-column subject table, the summary line, and the
 * section a class teacher and head teacher sign.
 *
 * A4 portrait — this one IS a full page, unlike the A5 receipt. Same reasoning for jsPDF over a
 * print stylesheet: it downloads identically everywhere and attaches to WhatsApp, which is how it
 * reaches a parent.
 *
 * The whole card is laid out top-down through a running `y`, so a school with eleven subjects and a
 * nine-band scale pushes the signed section down rather than colliding with it.
 */
export function renderReportCard(data: ReportCardData, logo?: PdfImage | null): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  doc.setLineWidth(0.25);
  doc.setDrawColor(...RULE);
  doc.setTextColor(INK);

  let y = letterhead(doc, data, logo);
  y = termTitle(doc, data, y);
  y = identityAndGrading(doc, data, y);
  y = subjectTable(doc, data, y);
  y = summaryLine(doc, data, y);
  signedSection(doc, data, y);

  return doc;
}

/** Crest, school name, motto and contact lines — the school's headed paper, in its own colours. */
function letterhead(doc: jsPDF, data: ReportCardData, logo?: PdfImage | null): number {
  const crest = 19;
  if (logo) doc.addImage(logo.dataUrl, logo.format, MARGIN, 9, crest, crest);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...NAVY);
  // Inset past the crest on both sides so a long name stays optically centred on the page.
  doc.text(data.schoolName.toUpperCase(), PAGE_WIDTH / 2, 16, {
    align: "center",
    maxWidth: CONTENT_WIDTH - (crest + 4) * 2,
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(MUTED);
  let y = 21.5;
  const contact = [
    // The address is one free-text field; a school that typed it as several lines gets them back.
    ...(data.schoolAddress?.split("\n").map((l) => l.trim().toUpperCase()) ?? []),
    data.schoolEmail ? `Email: ${data.schoolEmail}` : "",
    data.schoolPhone ? `Tel: ${data.schoolPhone}` : "",
  ].filter(Boolean);
  for (const line of contact) {
    doc.text(line, PAGE_WIDTH / 2, y, { align: "center", maxWidth: CONTENT_WIDTH - 44 });
    y += 3.6;
  }

  y = Math.max(y + 1, 9 + crest + 2);
  // The crest's gold, as a hairline under the letterhead. Gold is a rule colour on this document and
  // never a text colour — it fails contrast on white, and a report card is read, not admired.
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, y, RIGHT, y);
  doc.setLineWidth(0.25);
  doc.setDrawColor(...RULE);

  doc.setTextColor(INK);
  return y;
}

/** The term band — the card's one solid block of the school's navy. */
function termTitle(doc: jsPDF, data: ReportCardData, top: number): number {
  const y = top + 3;
  const height = 9.5;
  const inset = 14;
  doc.setFillColor(...NAVY);
  doc.rect(MARGIN + inset, y, CONTENT_WIDTH - inset * 2, height, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  const title = `Student Report for ${data.termName}${data.yearName ? ` ${data.yearName}` : ""}`;
  doc.text(title.toUpperCase(), PAGE_WIDTH / 2, y + 6.4, {
    align: "center",
    maxWidth: CONTENT_WIDTH - inset * 2 - 6,
  });
  doc.setTextColor(INK);
  return y + height;
}

/** The student's identity lines and the school's grading key, sharing one bordered block. */
function identityAndGrading(doc: jsPDF, data: ReportCardData, top: number): number {
  const boxTop = top + 3;
  let y = boxTop + 7;
  const labelX = MARGIN + 4;
  const valueX = MARGIN + 42;

  doc.setFontSize(9);
  const field = (label: string, value: string) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED);
    doc.text(`${label}:`, labelX, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(INK);
    doc.text(value.trim() || "—", valueX, y, { maxWidth: CONTENT_WIDTH - 46 });
    y += 6;
  };

  field("Student ID", data.admissionNo);
  // Surname first, comma, other names — how a school roll is read aloud and searched.
  field("Name", [data.studentLastName, data.studentFirstName].filter(Boolean).join(", "));
  field("Class", data.className);
  field("Number On Roll", data.enrolledCount === null ? "" : String(data.enrolledCount));
  field("Class Teacher", data.classTeacherName ?? "");

  y += 0.5;
  doc.line(MARGIN, y, RIGHT, y);
  y += 5.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...NAVY);
  doc.text("GRADING SYSTEM", PAGE_WIDTH / 2, y, { align: "center" });
  y += 5;

  // Three columns filled top-to-bottom, so the grades read 1-2-3 / 4-5-6 / 7-8-9 across the page
  // rather than snaking. Highest band first — the scale is read from the top down.
  const bands = [...data.gradeBands].sort((a, b) => b.min_score - a.min_score);
  const rows = Math.max(1, Math.ceil(bands.length / 3));
  const columnWidth = CONTENT_WIDTH / 3;
  doc.setFontSize(7.5);
  bands.forEach((band, i) => {
    const x = MARGIN + 4 + Math.floor(i / rows) * columnWidth;
    const lineY = y + (i % rows) * 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED);
    doc.text(band.remark, x, lineY, { maxWidth: 22 });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ROYAL);
    doc.text(band.grade, x + 24, lineY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED);
    doc.text(`(${pct(band.min_score)} - ${pct(band.max_score)})`, x + 30, lineY);
  });

  y += rows * 5 + 1;
  doc.setTextColor(INK);
  doc.rect(MARGIN, boxTop, CONTENT_WIDTH, y - boxTop);
  return y;
}

interface Column {
  header: string;
  width: number;
  align: "left" | "center";
}

/** The template's twelve columns. Widths sum to CONTENT_WIDTH — asserted by the unit test. */
function columns(caWeight: number): Column[] {
  return [
    { header: "", width: 5, align: "center" },
    { header: "Subject", width: 38, align: "left" },
    { header: "Short Code", width: 12, align: "center" },
    { header: `Class Score ${caWeight}%`, width: 14, align: "center" },
    { header: `Exam Score ${100 - caWeight}%`, width: 14, align: "center" },
    { header: "Total Score 100%", width: 14, align: "center" },
    { header: "Class Ave. Score", width: 13, align: "center" },
    { header: "Class Low. Score", width: 13, align: "center" },
    { header: "Class High. Score", width: 13, align: "center" },
    { header: "Grade", width: 10, align: "center" },
    { header: "Pos.", width: 13, align: "center" },
    { header: "Remarks", width: 27, align: "left" },
  ];
}

function subjectTable(doc: jsPDF, data: ReportCardData, top: number): number {
  const tableTop = top + 3;
  const cols = columns(data.caWeight);
  const headerHeight = 11;
  const count = Math.max(data.subjects.length, 1);
  // A school that teaches fifteen subjects gets tighter rows rather than a card that runs off the
  // page. Below the threshold the rows keep the comfortable height the paper form uses.
  const rowHeight = count > 13 ? Math.max(3.8, 71.5 / count) : 5.5;

  // --- header row: labels wrap to as many lines as they need, centred in the band ---------------
  doc.setFillColor(...TINT);
  doc.rect(MARGIN, tableTop, CONTENT_WIDTH, headerHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.3);
  doc.setTextColor(...NAVY);
  let x = MARGIN;
  for (const col of cols) {
    const lines = doc.splitTextToSize(col.header, col.width - 1.5) as string[];
    const first = tableTop + (headerHeight - lines.length * 2.5) / 2 + 2;
    const tx = col.align === "left" ? x + 1.5 : x + col.width / 2;
    lines.forEach((line, i) => doc.text(line, tx, first + i * 2.5, { align: col.align }));
    x += col.width;
  }

  // --- body -------------------------------------------------------------------------------------
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.7);
  doc.setTextColor(INK);
  data.subjects.forEach((s, i) => {
    const baseline = tableTop + headerHeight + i * rowHeight + rowHeight / 2 + 1;
    const cells = [
      String(i + 1),
      s.subject_name,
      s.short_code ?? "",
      dec(s.class_score),
      dec(s.exam_score),
      dec(s.total),
      dec(s.class_average),
      dec(s.class_lowest),
      dec(s.class_highest),
      s.grade ?? "",
      // Position out of the number on roll, exactly as the paper card writes it: "2/16".
      s.position === null ? "" : rank(s.position, data.enrolledCount),
      s.remark ?? "",
    ];
    let cx = MARGIN;
    cells.forEach((value, j) => {
      const col = cols[j]!;
      const tx = col.align === "left" ? cx + 1.5 : cx + col.width / 2;
      fitCell(doc, value, tx, baseline, col.width - 3, col.align, 6.7);
      cx += col.width;
    });
  });

  // --- grid drawn once over the finished table — cleaner corners than per-cell rects ------------
  const bottom = tableTop + headerHeight + data.subjects.length * rowHeight;
  doc.rect(MARGIN, tableTop, CONTENT_WIDTH, bottom - tableTop);
  doc.line(MARGIN, tableTop + headerHeight, RIGHT, tableTop + headerHeight);
  let gx = MARGIN;
  for (const col of cols.slice(0, -1)) {
    gx += col.width;
    doc.line(gx, tableTop, gx, bottom);
  }
  for (let i = 1; i < data.subjects.length; i++) {
    const ly = tableTop + headerHeight + i * rowHeight;
    doc.line(MARGIN, ly, RIGHT, ly);
  }
  return bottom;
}

/** The eight totals under the table, in the four column-pairs the template groups them into. */
function summaryLine(doc: jsPDF, data: ReportCardData, top: number): number {
  const height = 13;
  doc.setFillColor(...TINT);
  doc.rect(MARGIN, top, CONTENT_WIDTH, height, "FD");

  const groups: [string, string][][] = [
    [
      ["Number Of Passes", data.passes === null ? "—" : String(data.passes)],
      ["Total Score", data.totalScore === null ? "—" : dec(data.totalScore)],
    ],
    [
      ["Average Score", data.averageScore === null ? "—" : dec(data.averageScore)],
      ["Class Average", data.classAverage === null ? "—" : dec(data.classAverage)],
    ],
    [
      ["Lowest Class Ave.", data.classLowestAverage === null ? "—" : dec(data.classLowestAverage)],
      ["Highest Class Ave.", data.classHighestAverage === null ? "—" : dec(data.classHighestAverage)],
    ],
    [
      ["Position In Class", rank(data.position, data.enrolledCount)],
      // Labelled with the level so the second rank is not mistaken for a repeat of the first.
      [
        `Position in ${data.levelName ?? "Level"}`,
        rank(data.levelPosition, data.levelSize),
      ],
    ],
  ];

  const columnWidth = CONTENT_WIDTH / groups.length;
  doc.setFontSize(7.6);
  groups.forEach((group, c) => {
    group.forEach(([label, value], r) => {
      const x = MARGIN + 2.5 + c * columnWidth;
      const y = top + 5 + r * 5.5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(MUTED);
      doc.text(`${label}:`, x, y, { maxWidth: columnWidth - 16 });
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...NAVY);
      doc.text(value, x + columnWidth - 5, y, { align: "right" });
    });
  });

  doc.setTextColor(INK);
  return top + height;
}

/** Attendance, conduct, the two remarks, the head's signature and the term's closing lines. */
function signedSection(doc: jsPDF, data: ReportCardData, top: number): void {
  const boxTop = top + 3;
  let y = boxTop + 7;
  const leftX = MARGIN + 4;
  const midX = MARGIN + CONTENT_WIDTH / 2;

  /** Label, value, and the ruled blank the paper form leaves for it. */
  const inline = (label: string, value: string | null, x: number, ruleWidth: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(MUTED);
    doc.text(`${label}:`, x, y);
    const valueX = x + doc.getTextWidth(`${label}:`) + 2.5;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(INK);
    doc.text(value?.trim() || "—", valueX, y, { maxWidth: ruleWidth - (valueX - x) - 2 });
    doc.setDrawColor(185, 190, 205);
    doc.line(valueX, y + 1.4, x + ruleWidth, y + 1.4);
    doc.setDrawColor(...RULE);
  };

  /**
   * A remark over its own ruled lines. Capped at three lines: the field allows a thousand
   * characters and a teacher who uses them all must not push the signature off the page.
   */
  const remark = (label: string, value: string | null) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(MUTED);
    doc.text(`${label}:`, leftX, y);
    const textX = leftX + 46;
    const width = RIGHT - 4 - textX;
    const lines = (doc.splitTextToSize(value?.trim() || "—", width) as string[]).slice(0, 3);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(INK);
    lines.forEach((line, i) => {
      doc.text(line, textX, y + i * 5);
      doc.setDrawColor(185, 190, 205);
      doc.line(textX, y + i * 5 + 1.4, RIGHT - 4, y + i * 5 + 1.4);
      doc.setDrawColor(...RULE);
    });
    y += lines.length * 5 + 3;
  };

  const attendance =
    data.attendanceTotal === 0
      ? null
      : `${data.attendancePresent} out of ${data.attendanceTotal}`;

  inline("Attendance", attendance, leftX, 70);
  inline("Interest", data.interest, midX, 78);
  y += 7;
  inline("Conduct", data.conduct, leftX, 70);
  inline("Attitude", data.attitude, midX, 78);
  y += 8;

  remark("Class Teacher's Remarks", data.classTeacherRemark);
  remark("Head Teacher's Remarks", data.headTeacherRemark);

  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(MUTED);
  doc.text("Head Teacher's Signature:", RIGHT - 4 - 60, y, { align: "right" });
  doc.setDrawColor(185, 190, 205);
  doc.line(RIGHT - 4 - 58, y + 1.4, RIGHT - 4, y + 1.4);
  doc.setDrawColor(...RULE);
  y += 9;

  inline(
    "Next Term Begins",
    data.reopeningDate ? formatDate(data.reopeningDate) : null,
    leftX,
    75,
  );
  y += 7;
  inline("Promotion", data.promotedTo, leftX, 100);
  y += 5;

  doc.setTextColor(INK);
  doc.rect(MARGIN, boxTop, CONTENT_WIDTH, y - boxTop);
  footer(doc, y + 6);
}

/**
 * The school's motto, closing the page in its own colours — the one place a report card is allowed
 * a flourish, because it is the only line on it that isn't about this particular child.
 */
function footer(doc: jsPDF, top: number): void {
  // Pinned to the bottom margin when the card is short, so it reads as a footer rather than as a
  // stray line hanging under the last box.
  const y = Math.max(top, doc.internal.pageSize.getHeight() - 10);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y - 4, RIGHT, y - 4);
  doc.setLineWidth(0.25);
  doc.setDrawColor(...RULE);

  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(7.5);
  doc.setTextColor(...NAVY);
  doc.text(BRAND.motto, PAGE_WIDTH / 2, y, { align: "center" });
  doc.setTextColor(INK);
}

export function reportCardFilename(data: ReportCardData): string {
  const student = `${data.studentLastName} ${data.studentFirstName}`
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const term = data.termName.replace(/[^a-zA-Z0-9]+/g, "-");
  return `Report-${student}-${term}.pdf`;
}

/** Render and hand to the browser as a download; split like the receipt so drawing stays testable. */
export async function downloadReportCard(data: ReportCardData): Promise<void> {
  const logo = await loadImageData(data.logoSrc);
  renderReportCard(data, logo).save(reportCardFilename(data));
}

/** Exported for the layout test — the twelve columns must exactly fill the card's width. */
export const reportCardColumns = columns;
export const REPORT_CARD_CONTENT_WIDTH = CONTENT_WIDTH;
