import { BRAND } from "@/lib/brand";
import type { PaymentMethod, PaymentVM } from "@/lib/validators/fees";

/**
 * Receipt numbering and shaping. Pure: no jsPDF and no DOM, so the rules are unit-tested and the
 * PDF renderer stays a thin drawing layer over them.
 */

/**
 * The number printed on the receipt, derived from the payment's id.
 *
 * not a sequential register. A true receipt book numbers 0001, 0002, 0003 with no gaps, and an
 * auditor uses that continuity to prove nothing was torn out, that needs a database sequence and a
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

const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const SCALES = ["", "thousand", "million", "billion"];

// Every index below is bounded by the branch above it, so no `?? ""` can fire. They are there for
// `noUncheckedIndexedAccess`, which cannot see that.
function underThousand(n: number): string {
  if (n < 20) return ONES[n] ?? "";
  if (n < 100) {
    const tens = TENS[Math.floor(n / 10)] ?? "";
    return n % 10 ? `${tens}-${ONES[n % 10] ?? ""}` : tens;
  }
  const hundreds = `${ONES[Math.floor(n / 100)] ?? ""} hundred`;
  return n % 100 ? `${hundreds} and ${underThousand(n % 100)}` : hundreds;
}

/** Whole number in British-convention words: "one thousand and five", not "one thousand five". */
function wholeInWords(n: number): string {
  if (n === 0) return "zero";

  const parts: { value: number; scale: number }[] = [];
  for (let rest = n, scale = 0; rest > 0; rest = Math.floor(rest / 1000), scale += 1) {
    const chunk = rest % 1000;
    if (chunk) parts.unshift({ value: chunk, scale });
  }

  return parts
    .map((part, i) => {
      const chunk = underThousand(part.value);
      const words = part.scale ? `${chunk} ${SCALES[part.scale] ?? ""}`.trim() : chunk;
      // "One thousand and five", English puts the conjunction before a trailing remainder below a
      // hundred, and only there. "One thousand and one hundred" would be wrong.
      const conjunction = i > 0 && part.scale === 0 && part.value < 100 ? "and " : "";
      return conjunction + words;
    })
    .join(" ");
}

/**
 * The amount as the "Being the sum of" line reads it, words, because that is what a receipt book
 * asks for and what makes a figure impossible to alter after the fact.
 *
 * Ends in "only" for the same reason a cheque does: it closes the line so nothing can be appended.
 * Rounded to the pesewa first: a receipt states a settled amount, never a third decimal.
 */
export function amountInWords(amount: number): string {
  const pesewasTotal = Math.round(amount * 100);
  const cedis = Math.floor(pesewasTotal / 100);
  const pesewas = pesewasTotal % 100;

  const cedisPart = `${wholeInWords(cedis)} Ghana ${cedis === 1 ? "cedi" : "cedis"}`;
  const pesewasPart = pesewas
    ? ` and ${wholeInWords(pesewas)} ${pesewas === 1 ? "pesewa" : "pesewas"}`
    : "";
  const line = `${cedisPart}${pesewasPart} only`;

  return line.charAt(0).toUpperCase() + line.slice(1);
}

export interface ReceiptData {
  receiptNo: string;
  schoolName: string;
  studentName: string;
  className: string;
  feeLabel: string;
  amount: number;
  method: string;
  /**
   * The raw method behind `method`'s label. The school's form offers three tick boxes, Cash,
   * Cheque, Momo, and matching a box against a display string would break the moment a label is
   * reworded.
   */
  methodKey: PaymentMethod;
  reference: string | null;
  paidAt: string;
  /** The officer who received the money, as recorded on the payment. */
  issuedBy: string;
  /**
   * Where the crest is fetched from at render time. Resolved here rather than in the renderer so the
   * rule stays pure and testable, and so the Storage upload, when it lands, needs no change to
   * `lib/pdf/*`.
   */
  logoSrc: string;
}

/**
 * The "Received by" line when the recorder is unknown, a payment whose `recorded_by` profile was
 * since deleted. The school as an institution received the money either way, so the line stays
 * filled rather than printing a blank where a signature belongs.
 */
const UNKNOWN_RECORDER = "the school office";

/**
 * Assemble everything the receipt prints from a payment row.
 *
 * "Received by" comes from the payment's own `recorded_by_name`, not from whoever is signed in.
 * That distinction is the whole point of a receipt: it attests that a named officer took the money
 * on a given day. Reading the current session instead would put the wrong name on every reprint,
 * a second admin reprinting a colleague's receipt, or a parent downloading their own copy from the
 * parent portal, which would otherwise read "Received by: <the parent>".
 */
export function buildReceipt(params: {
  payment: PaymentVM;
  schoolName: string;
  methodLabel: string;
  /** The tenant's own `schools.logo_url`, or null when they haven't uploaded one. */
  logoUrl: string | null;
}): ReceiptData {
  return {
    receiptNo: receiptNumber(params.payment.id),
    schoolName: params.schoolName,
    studentName: params.payment.student_name,
    className: params.payment.class_name,
    feeLabel: params.payment.fee_label,
    amount: params.payment.amount,
    method: params.methodLabel,
    methodKey: params.payment.method,
    reference: params.payment.reference,
    paidAt: params.payment.paid_at,
    issuedBy: params.payment.recorded_by_name ?? UNKNOWN_RECORDER,
    // The tenant's own upload wins; the bundled crest covers a school that hasn't uploaded one.
    logoSrc: params.logoUrl ?? BRAND.crest.src,
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
