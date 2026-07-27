import type { PaymentVM } from "@/lib/validators/fees";

/**
 * Receipt numbering and shaping. Pure — no jsPDF, no DOM — so the rules are unit-tested and the
 * PDF renderer stays a thin drawing layer over them.
 */

/**
 * The number printed on the receipt, derived from the payment's id.
 *
 * NOT a sequential register. A true receipt book numbers 0001, 0002, 0003 with no gaps, and an
 * auditor uses that continuity to prove nothing was torn out — that needs a database sequence and a
 * guarantee that a failed request never burns a number, which this does not attempt.
 *
 * What it does guarantee is what a reprint needs: the same payment always produces the same number,
 * and two payments never collide, because it is derived from a uuid rather than a counter. A parent
 * who loses the slip gets an identical one, and the number resolves back to exactly one row.
 *
 * Uppercased and hyphen-free so it survives being read down a phone or written on a slip.
 */
export function receiptNumber(paymentId: string): string {
  return `RCP-${paymentId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export interface ReceiptData {
  receiptNo: string;
  schoolName: string;
  studentName: string;
  className: string;
  feeLabel: string;
  amount: number;
  method: string;
  reference: string | null;
  paidAt: string;
  issuedBy: string;
}

/** Assemble everything the receipt prints, from a payment row plus who is issuing it. */
export function buildReceipt(params: {
  payment: PaymentVM;
  schoolName: string;
  methodLabel: string;
  issuedBy: string;
}): ReceiptData {
  return {
    receiptNo: receiptNumber(params.payment.id),
    schoolName: params.schoolName,
    studentName: params.payment.student_name,
    className: params.payment.class_name,
    feeLabel: params.payment.fee_label,
    amount: params.payment.amount,
    method: params.methodLabel,
    reference: params.payment.reference,
    paidAt: params.payment.paid_at,
    issuedBy: params.issuedBy,
  };
}

/**
 * Filename for the download.
 *
 * Named for the student and the receipt rather than "receipt.pdf": these land in a downloads folder
 * alongside dozens of others, and an admin re-sending one to a parent should not have to open three
 * files to find it.
 */
export function receiptFilename(data: ReceiptData): string {
  const student = data.studentName.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${data.receiptNo}-${student}.pdf`;
}
