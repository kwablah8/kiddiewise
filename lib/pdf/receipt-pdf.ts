import { jsPDF } from "jspdf";
import { formatDate, formatGHS } from "@/lib/format";
import { receiptFilename, type ReceiptData } from "@/lib/receipt";

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
 */
export function renderReceipt(data: ReceiptData): jsPDF {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a5" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const right = pageWidth - margin;

  // --- Header -----------------------------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(data.schoolName, margin, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text("Official fee receipt", margin, 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(data.receiptNo, right, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(formatDate(data.paidAt), right, 24, { align: "right" });

  doc.setDrawColor(210);
  doc.line(margin, 29, right, 29);

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
  doc.setFillColor(244, 246, 250);
  doc.rect(right - 62, amountBoxTop, 62, 24, "F");
  doc.setTextColor(120);
  doc.setFontSize(8);
  doc.text("AMOUNT PAID", right - 4, amountBoxTop + 8, { align: "right" });
  doc.setTextColor(0);
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
 * Split from `renderReceipt` so the drawing can be exercised outside a browser — `.save()` is the
 * only part that needs a DOM, and a layout bug should be findable without one.
 */
export function downloadReceipt(data: ReceiptData): void {
  renderReceipt(data).save(receiptFilename(data));
}
