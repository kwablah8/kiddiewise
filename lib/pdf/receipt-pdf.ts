import { GState, jsPDF } from "jspdf";
import { BRAND } from "@/lib/brand";
import { formatAmount, formatDate } from "@/lib/format";
import { amountInWords, receiptFilename, type ReceiptData } from "@/lib/receipt";
import type { PaymentMethod } from "@/lib/validators/fees";
import { loadImageData, type PdfImage } from "./image";

/** jsPDF's colour setters take RGB triples; `BRAND.palette` is the CSS-shaped fact. */
function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const MARGIN = 14;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 148;
const RIGHT = PAGE_WIDTH - MARGIN;

/** The three boxes the school's form prints, in the order it prints them. */
const METHOD_BOXES: { key: PaymentMethod; label: string }[] = [
  { key: "cash", label: "Cash" },
  { key: "cheque", label: "Cheque" },
  { key: "mobile_money", label: "Momo" },
];

/**
 * A leaning bar, the shape the school's letterhead is built from.
 *
 * Drawn from the top-left corner: across, down-and-back by `skew`, then back along the bottom. A
 * negative `skew` leans the other way, which is how the bottom band mirrors the top one.
 */
function chevron(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  skew: number,
): void {
  doc.lines([[width, 0], [-skew, height], [-width, 0]], x, y, [1, 1], "F", true);
}

/**
 * The banded artwork across the top and bottom of the school's stationery: rules running in from
 * the page edge, meeting angled blocks at the other end.
 *
 * `dir` is 1 for the top band (shapes hang downward from `edge`) and -1 for the bottom, which is
 * the same drawing mirrored. Full-bleed by design, the bands run to the paper's edge on the
 * school's own template, and stopping them at the margin would read as a boxed-in header.
 */
function band(doc: jsPDF, edge: number, dir: 1 | -1): void {
  const deep = rgb(BRAND.palette.deep);
  const strong = rgb(BRAND.palette.strong);
  const accent = rgb(BRAND.palette.accent);

  /** Rect from an outer edge inward, so the caller thinks in "distance from the paper's edge". */
  const bar = (x: number, offset: number, width: number, height: number) =>
    doc.rect(x, dir > 0 ? edge + offset : edge - offset - height, width, height, "F");

  const lean = (x: number, offset: number, width: number, height: number, skew: number) =>
    chevron(doc, x, dir > 0 ? edge + offset : edge - offset - height, width, height, skew * dir);

  // Rules first, running in from the left edge, the longer one outermost. They are drawn long and
  // then covered by the blocks below, a rule that stopped short of the angle would leave a sliver
  // of white between the two, and one drawn on top would read as a stray line across the block.
  doc.setFillColor(...deep);
  bar(0, 0.6, 120, 1.5);
  bar(0, 3.6, 96, 0.8);

  // The gold block sits furthest out and widest, so the eye reads gold-then-navy at a glance,
  // the order the crest itself uses.
  doc.setFillColor(...accent);
  lean(112, 0, PAGE_WIDTH - 112, 6.4, 7);

  doc.setFillColor(...strong);
  lean(88, 1.4, 46, 6.4, 7);
}

/**
 * The crest, printed pale and large behind the body, the watermark on the school's own template.
 *
 * 6% because this has to survive a school's mono laser: any heavier and the body text sits on a
 * grey field, any lighter and it vanishes. Opacity is reset immediately; a stray graphics state
 * would wash out everything drawn afterwards.
 */
function watermark(doc: jsPDF, logo: PdfImage): void {
  const size = 82;
  doc.setGState(new GState({ opacity: 0.06 }));
  doc.addImage(logo.dataUrl, logo.format, (PAGE_WIDTH - size) / 2, 34, size, size);
  doc.setGState(new GState({ opacity: 1 }));
}

/** The form's dotted rule. Callers draw their value on top of it, where a pen would have. */
function leader(doc: jsPDF, from: number, to: number, y: number): void {
  doc.setDrawColor(155);
  doc.setLineWidth(0.25);
  doc.setLineDashPattern([0.4, 0.9], 0);
  doc.line(from, y, to, y);
  doc.setLineDashPattern([], 0);
  doc.setLineWidth(0.2);
}

/**
 * Greedy wrap across lines of DIFFERENT widths, the sum in words starts after its label and
 * continues on a full second line that stops short of the "GHc" field.
 *
 * Measures with the caller's current font, so set it before calling.
 */
function wrapAcross(doc: jsPDF, text: string, widths: number[]): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let i = 0;

  for (const width of widths) {
    let line = "";
    for (; i < words.length; i += 1) {
      const word = words[i];
      if (word === undefined) break;
      const next = line ? `${line} ${word}` : word;
      // A single word wider than the line still has to go somewhere, or this never advances.
      if (line && doc.getTextWidth(next) > width) break;
      line = next;
    }
    lines.push(line);
    if (i >= words.length) break;
  }

  return lines;
}

/** Draw an italic field label and return where its dotted rule should start. */
function label(doc: jsPDF, text: string, x: number, y: number): number {
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(55);
  doc.text(text, x, y);
  return x + doc.getTextWidth(text) + 2.5;
}

/** Draw a value on the rule below its own baseline, clipped to the space the rule leaves. */
function value(doc: jsPDF, text: string, x: number, ruleY: number, maxWidth: number): void {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(20);
  doc.text(doc.splitTextToSize(text, maxWidth)[0] ?? "", x, ruleY - 1.8);
}

/**
 * Draw a fee receipt on the school's own Official Receipt form and hand it to the browser as a
 * download.
 *
 * The layout is the school's stationery, field for field: its banded letterhead, the crest
 * watermarked behind the body, and the six lines it asks for, received from, the sum in words and
 * figures, what the payment was for, which of Cash/Cheque/Momo, and who received it. Values are
 * typeset on the dotted rules where a pen would have written them, so a parent holding one
 * recognises the same slip the office has always issued.
 *
 * Two things the printed form has no field for are added rather than dropped: the receipt number
 * and the date. A pad of numbered slips carries both on the counterfoil; a generated document has
 * no counterfoil, and without them a reprint cannot be matched to the payment it settles.
 *
 * jsPDF rather than a print stylesheet: "print to PDF" depends on the operating system's print
 * dialog, which on a school's shared Windows machine is as likely to reach a printer with no paper
 * as a file. A generated document downloads the same way everywhere and can be attached to a
 * WhatsApp message, which is how these actually reach parents. jsPDF is the one dependency added
 * outside the original stack.
 *
 * Client-side, so no server round-trip and nothing to store: the receipt is a rendering of a
 * payment row that already exists, not a second copy of it.
 *
 * A5 landscape, not A4. A fee receipt is a slip, the school's own template fills the top third of
 * a portrait page and leaves the rest to be cut off, and A5 landscape is that block at its own
 * size, two to an A4 sheet.
 *
 * `logo` arrives ALREADY DECODED (see `./image`) rather than being fetched here, so this stays
 * synchronous and DOM-free. Pass null or omit it and the crest and its watermark are simply
 * absent, a receipt without them still settles a debt.
 */
export function renderReceipt(data: ReceiptData, logo?: PdfImage | null): jsPDF {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a5" });

  const deep = rgb(BRAND.palette.deep);
  const strong = rgb(BRAND.palette.strong);

  // --- The school's stationery ---------------------------------------------------------------
  band(doc, 6, 1);
  band(doc, PAGE_HEIGHT - 6, -1);
  if (logo) watermark(doc, logo);

  // --- Letterhead ----------------------------------------------------------------------------
  // The crest is square (512x512) so a square draw is undistorted, and its white background sits
  // flush on white paper, no chip needed, unlike the on-screen <Crest> against navy.
  const crestSize = 13;
  if (logo) {
    doc.addImage(logo.dataUrl, logo.format, MARGIN, 19, crestSize, crestSize);
  }
  // Original geometry when there is no crest, rather than a 13mm hole where one failed to load.
  const nameX = logo ? MARGIN + crestSize + 4 : MARGIN;

  // Centred within the identity block, same arrangement as the report card's own letterhead
  // (lib/pdf/report-card.ts#letterhead): name, then each contact field on its own centred line,
  // address uppercase, email/tel prefixed. No motto — that block's just the school's name and how
  // to reach it, matching the report card exactly rather than carrying its own separate layout.
  const blockWidth = 92;
  const blockCenterX = nameX + blockWidth / 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...deep);
  // Spaced caps, as the name is set on the school's letterhead. Split over two lines when it is
  // long, so it never runs into the title.
  const nameLines = doc.splitTextToSize(data.schoolName.toUpperCase(), blockWidth);
  doc.text(nameLines.slice(0, 2), blockCenterX, 24.5, {
    align: "center",
    charSpace: 0.35,
    lineHeightFactor: 1.3,
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.3);
  doc.setTextColor(120);
  let contactY = nameLines.length > 1 ? 31.5 : 27;
  const contactLines = [
    ...(data.schoolAddress?.split("\n").map((l) => l.trim().toUpperCase()) ?? []),
    data.schoolEmail ? `Email: ${data.schoolEmail}` : "",
    data.schoolPhone ? `Tel: ${data.schoolPhone}` : "",
  ].filter(Boolean);
  for (const line of contactLines) {
    doc.text(line, blockCenterX, contactY, { align: "center", maxWidth: blockWidth });
    contactY += 3.4;
  }

  // The form's own title, in the serif it is printed in.
  doc.setFont("times", "bold");
  doc.setFontSize(19);
  doc.setTextColor(...deep);
  doc.text("Official Receipt", RIGHT, 26, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...strong);
  doc.text(`No. ${data.receiptNo}`, RIGHT, 33, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(110);
  doc.text(formatDate(data.paidAt), RIGHT, 38.5, { align: "right" });

  // --- The form ------------------------------------------------------------------------------
  const receivedY = 52;
  const fromX = label(doc, "Received from", MARGIN, receivedY);
  leader(doc, fromX, RIGHT, receivedY);
  value(doc, data.studentName, fromX + 2, receivedY, RIGHT - fromX - 4);

  // The sum in words, then in figures against the form's pre-printed "GHc". Words first because
  // that is the line that cannot be altered after the fact.
  const sumY = 65;
  const wordsY = 76;
  const sumX = label(doc, "Being the sum of", MARGIN, sumY);
  const ghcX = 130;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const words = wrapAcross(doc, amountInWords(data.amount), [
    RIGHT - sumX - 4,
    ghcX - MARGIN - 6,
  ]);

  leader(doc, sumX, RIGHT, sumY);
  leader(doc, MARGIN, ghcX - 4, wordsY);
  doc.setTextColor(20);
  doc.text(words[0] ?? "", sumX + 2, sumY - 1.8);
  if (words[1]) doc.text(words[1], MARGIN + 2, wordsY - 1.8);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(55);
  doc.text("GHc", ghcX, wordsY);
  const figureX = ghcX + doc.getTextWidth("GHc") + 3;
  leader(doc, figureX, RIGHT, wordsY);
  // Sits against the "GHc" it belongs to rather than at the far right of the rule, a figure
  // written on a receipt starts where the field starts, and the dotted tail after it is what keeps
  // a second figure from being appended.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...strong);
  doc.text(formatAmount(data.amount), figureX + 3, wordsY - 1.8);

  // What the money was for, and which class it was for, a parent with two children here needs the
  // second half of that sentence.
  const forY = 89;
  const forX = label(doc, "For the payment of", MARGIN, forY);
  leader(doc, forX, RIGHT, forY);
  value(doc, `${data.feeLabel} — ${data.className}`, forX + 2, forY, RIGHT - forX - 4);

  // --- Method, reference, and who took it ----------------------------------------------------
  const methodY = 102;
  let boxX = MARGIN;
  for (const box of METHOD_BOXES) {
    const textEnd = label(doc, box.label, boxX, methodY);
    tickBox(doc, textEnd + 1, methodY - 3.6, data.methodKey === box.key);
    boxX = textEnd + 16;
  }

  // Bank transfers and the "other" catch-all have no box on the printed form. Naming the method
  // beside the boxes beats ticking the nearest one, which would put a wrong fact on a document a
  // parent may bring back months later.
  const unboxed = !METHOD_BOXES.some((b) => b.key === data.methodKey);
  const notes = [unboxed ? data.method : null, data.reference ? `Ref. ${data.reference}` : null]
    .filter(Boolean)
    .join("   ·   ");
  if (notes) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(105);
    doc.text(notes, boxX + 2, methodY);
  }

  const receivedByY = 117;
  const byX = label(doc, "Received by", 120, receivedByY);
  leader(doc, byX, RIGHT, receivedByY);
  value(doc, data.issuedBy, byX + 2, receivedByY, RIGHT - byX - 4);

  // --- Footer --------------------------------------------------------------------------------
  // Says plainly what the document is worth. A receipt that does not say it was computer-generated
  // invites a parent to ask which office stamped it. Nothing balances it on the right: that corner
  // is where the office's own stamp lands on a printed slip.
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(125);
  doc.text("Computer-generated receipt — valid without a signature.", MARGIN, 130);

  return doc;
}

/** The form's tick box, ticked or empty. A check mark, not a fill, a filled box scans as redacted. */
function tickBox(doc: jsPDF, x: number, y: number, ticked: boolean): void {
  const width = 5.6;
  const height = 4.4;

  doc.setDrawColor(...rgb(BRAND.palette.deep));
  doc.setLineWidth(0.3);
  doc.rect(x, y, width, height);

  if (!ticked) return;
  doc.setDrawColor(...rgb(BRAND.palette.strong));
  doc.setLineWidth(0.8);
  doc.lines([[1.6, 1.8], [2.6, -3.4]], x + 1.1, y + 2.2);
  doc.setLineWidth(0.2);
}

/**
 * Render and hand it to the browser as a download.
 *
 * Split from `renderReceipt` so the drawing can be exercised outside a browser, `.save()` and the
 * logo fetch are the only parts that need a DOM, and a layout bug should be findable without one.
 */
export async function downloadReceipt(data: ReceiptData): Promise<void> {
  const logo = await loadImageData(data.logoSrc);
  renderReceipt(data, logo).save(receiptFilename(data));
}
