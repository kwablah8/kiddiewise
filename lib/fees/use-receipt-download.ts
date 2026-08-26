"use client";

import { downloadReceipt } from "@/lib/pdf/receipt-pdf";
import { useSchool } from "@/lib/queries/school";
import { buildReceipt } from "@/lib/receipt";
import { toast } from "@/lib/toast";
import { PAYMENT_METHOD_LABEL, type PaymentVM } from "@/lib/validators/fees";

/**
 * Download a payment's receipt as the school's Official Receipt form.
 *
 * Shared by the admin payments ledger and the parent portal so both hand out the SAME document. A
 * parent who lost the slip and downloads their own copy gets an exact match of the one the office
 * printed — same receipt number (`receiptNumber` derives it from the payment id), same "Received
 * by" officer (`recorded_by_name`, never the person doing the printing). Two implementations of
 * this would eventually disagree, and a receipt that disagrees with the school's copy is worse
 * than no receipt.
 *
 * Rendering is client-side and nothing is stored: the receipt is a rendering of an existing
 * `payments` row, not a second copy of it.
 */
export function useReceiptDownload(): (payment: PaymentVM) => Promise<void> {
  const { data: school } = useSchool();

  // Async because the crest has to be fetched and decoded before jsPDF can embed it. A failure to
  // load the crest is swallowed inside `downloadReceipt` and still produces a receipt; this catch is
  // for the rarer case of the render or the save itself failing, which must not be silent when an
  // admin is standing at the desk with a parent — or when a parent is trying to prove they paid.
  return async (payment: PaymentVM) => {
    try {
      await downloadReceipt(
        buildReceipt({
          payment,
          // Read from the tenant, not hardcoded: the receipt is the school's document, and a wrong
          // name on it is worse than a plain one.
          schoolName: school?.name ?? "School",
          methodLabel: PAYMENT_METHOD_LABEL[payment.method],
          // The tenant's own uploaded crest when there is one; buildReceipt falls back to the
          // bundled SLIS crest otherwise.
          logoUrl: school?.logo_url ?? null,
        }),
      );
    } catch {
      toast.error("Couldn't generate the receipt. Please try again.");
    }
  };
}
