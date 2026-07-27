import { describe, expect, it } from "vitest";
import { buildReceipt, receiptFilename, receiptNumber } from "@/lib/receipt";
import type { PaymentVM } from "@/lib/validators/fees";

const payment: PaymentVM = {
  id: "9c1f2b7a-4d51-4a0e-8f3b-2b6d5e7a1c40",
  student_id: "stu-1",
  student_name: "Kofi Mensah",
  class_name: "Basic 4",
  amount: 450,
  method: "mobile_money",
  reference: "MP2607.1432.A1",
  paid_at: "2026-07-27T10:15:00.000Z",
  fee_label: "Full year",
};

describe("receiptNumber", () => {
  it("is stable for a payment, so a reprint matches the original", () => {
    expect(receiptNumber(payment.id)).toBe(receiptNumber(payment.id));
  });

  it("is readable aloud — uppercase, no hyphens from the uuid", () => {
    expect(receiptNumber(payment.id)).toBe("RCP-9C1F2B7A");
  });

  it("distinguishes two payments", () => {
    expect(receiptNumber("11111111-0000-0000-0000-000000000000")).not.toBe(
      receiptNumber("22222222-0000-0000-0000-000000000000"),
    );
  });
});

describe("buildReceipt", () => {
  const data = buildReceipt({
    payment,
    schoolName: "SNAB Learners International School",
    methodLabel: "Mobile money",
    issuedBy: "Ama Mensah",
  });

  it("carries the payment onto the receipt", () => {
    expect(data).toMatchObject({
      receiptNo: "RCP-9C1F2B7A",
      schoolName: "SNAB Learners International School",
      studentName: "Kofi Mensah",
      className: "Basic 4",
      amount: 450,
      method: "Mobile money",
      reference: "MP2607.1432.A1",
      issuedBy: "Ama Mensah",
    });
  });

  it("keeps a missing reference as null rather than inventing one", () => {
    const noRef = buildReceipt({
      payment: { ...payment, reference: null },
      schoolName: "S",
      methodLabel: "Cash",
      issuedBy: "A",
    });
    expect(noRef.reference).toBeNull();
  });
});

describe("receiptFilename", () => {
  it("names the file for the student and receipt, not just 'receipt.pdf'", () => {
    const data = buildReceipt({
      payment,
      schoolName: "S",
      methodLabel: "Cash",
      issuedBy: "A",
    });
    expect(receiptFilename(data)).toBe("RCP-9C1F2B7A-Kofi-Mensah.pdf");
  });

  it("strips punctuation that would break a filename", () => {
    const data = buildReceipt({
      payment: { ...payment, student_name: "N'Diaye  Kwame-Junior" },
      schoolName: "S",
      methodLabel: "Cash",
      issuedBy: "A",
    });
    expect(receiptFilename(data)).toBe("RCP-9C1F2B7A-N-Diaye-Kwame-Junior.pdf");
  });
});
