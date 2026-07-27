import { jsPDF } from "jspdf";
import { BRAND } from "@/lib/brand";
import { formatDate, formatGHS } from "@/lib/format";
import { receiptFilename, type ReceiptData } from "@/lib/receipt";
import { loadImageData, type PdfImage } from "./image";

/** jsPDF's colour setters take RGB triples; `BRAND.palette` is the CSS-shaped fact. */
function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Draw a fee receipt and hand it to the browser as a download.
 *
 * jsPDF rather than a print stylesheet: "print to PDF" depends on the operating system's print
 * dialog, which on a school's shared Windows machine is as likely to reach a printer with no paper
 * as a file. A generated document downloads the same way everywhere and can be attached to a
 * WhatsApp message, which is how these actually reach parents. It is the one dependency added
 * outside the locked stack in CLAUDE.md §3.
 *
 * Client-side, so no server round-trip and nothing to store: the receipt is a rendering of a
 * payment row that already exists, not a second copy of it.
 *
 * A5 landscape, not A4. A fee receipt is a slip — printed on A4 it is 80% empty space, and schools
 * here commonly cut them two to a sheet.
 *
 * `logo` arrives ALREADY DECODED (see `./image`) rather than being fetched here, so this stays
 * synchronous and DOM-free. Pass null or omit it and the header falls back to its pre-crest
 * geometry — a receipt without the crest still settles a debt.
 */
export function renderReceipt(data: ReceiptData, logo?: PdfImage | null): jsPDF {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a5" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const right = pageWidth - margin;

  const deep = rgb(BRAND.palette.deep);
  const strong = rgb(BRAND.palette.strong);
  const accent = rgb(BRAND.palette.accent);
  const tint = rgb(BRAND.palette.tint);

  // --- Header -----------------------------------------------------------------------------
  // The crest is square (512x512) so a square draw is undistorted, and its white background sits
  // flush on white paper — no chip needed, unlike the on-screen <Crest> against navy.
  const crestSize = 14;
  if (logo) {
    doc.addImage(logo.dataUrl, logo.format, margin, 11, crestSize, crestSize);
  }
  // Original geometry when there is no crest, rather than a 14mm hole where one failed to load.
  const textX = logo ? margin + crestSize + 5 : margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...deep);
  doc.text(data.schoolName, textX, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text("Official fee receipt", textX, 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...strong);
  doc.text(data.receiptNo, right, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(formatDate(data.paidAt), right, 24, { align: "right" });

  // Navy for most of the width, then gold to the edge. A two-tone rule carries the brand at a
  // fraction of the ink of a reversed-out header band — these get printed on a school's shared
  // office laser, often a mono one, where a solid fill comes out muddy.
  const ruleY = 29;
  const goldStart = margin + (right - margin) * 0.7;
  doc.setLineWidth(0.6);
  doc.setDrawColor(...deep);
  doc.line(margin, ruleY, goldStart, ruleY);
  doc.setDrawColor(...accent);
  doc.line(goldStart, ruleY, right, ruleY);
  // Back to jsPDF's default so the footer rule below is unaffected.
  doc.setLineWidth(0.2);

  // --- Body -------------------------------------------------------------------------------
  // Label/value pairs down the left; the amount gets its own emphasis block on the right, because
  // the amount is the one figure anyone checks twice.
  const rows: [string, string][] = [
    ["Received from", data.studentName],
    ["Class", data.className],
    ["Being payment for", data.feeLabel],
    ["Method", data.method],
    ["Reference", data.reference ?? "—"],
  ];

  let y = 39;
  for (const [label, value] of rows) {
    doc.setTextColor(120);
    doc.setFontSize(8);
    doc.text(label.toUpperCase(), margin, y);
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text(value, margin, y + 5.5);
    y += 13;
  }

  const amountBoxTop = 36;
  doc.setFillColor(...tint);
  doc.rect(right - 62, amountBoxTop, 62, 24, "F");
  doc.setTextColor(120);
  doc.setFontSize(8);
  doc.text("AMOUNT PAID", right - 4, amountBoxTop + 8, { align: "right" });
  doc.setTextColor(...strong);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text(formatGHS(data.amount), right - 4, amountBoxTop + 18, { align: "right" });

  // --- Footer -----------------------------------------------------------------------------
  const footerY = doc.internal.pageSize.getHeight() - 16;
  doc.setDrawColor(210);
  doc.line(margin, footerY - 6, right, footerY - 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Issued by ${data.issuedBy}`, margin, footerY);
  // Says plainly what the document is worth. A receipt that does not say it was computer-generated
  // invites a parent to ask which office stamped it.
  doc.text("Computer-generated receipt — valid without a signature.", right, footerY, {
    align: "right",
  });

  return doc;
}

/**
 * Render and hand it to the browser as a download.
 *
 * Split from `renderReceipt` so the drawing can be exercised outside a browser — `.save()` and the
 * logo fetch are the only parts that need a DOM, and a layout bug should be findable without one.
 */
export async function downloadReceipt(data: ReceiptData): Promise<void> {
  const logo = await loadImageData(data.logoSrc);
  renderReceipt(data, logo).save(receiptFilename(data));
}
