import { describe, expect, it } from "vitest";
import { BRAND } from "@/lib/brand";
import { amountInWords, buildReceipt, receiptFilename, receiptNumber } from "@/lib/receipt";
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
  recorded_by_name: "Ama Mensah",
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

describe("amountInWords", () => {
  it("spells a plain cedi amount the way the receipt book does", () => {
    expect(amountInWords(450)).toBe("Four hundred and fifty Ghana cedis only");
  });

  it("carries pesewas when the amount is not whole", () => {
    expect(amountInWords(1250.5)).toBe(
      "One thousand two hundred and fifty Ghana cedis and fifty pesewas only",
    );
  });

  it("puts 'and' before a remainder under a hundred", () => {
    expect(amountInWords(2_450_075)).toBe(
      "Two million four hundred and fifty thousand and seventy-five Ghana cedis only",
    );
  });

  it("hyphenates compound tens", () => {
    expect(amountInWords(76)).toBe("Seventy-six Ghana cedis only");
  });

  it("keeps the singular for one cedi and one pesewa", () => {
    expect(amountInWords(1.01)).toBe("One Ghana cedi and one pesewa only");
  });

  it("rounds to the pesewa rather than spelling a fraction of one", () => {
    expect(amountInWords(19.999)).toBe("Twenty Ghana cedis only");
  });

  it("spells a part-cedi payment without pretending it is nothing", () => {
    expect(amountInWords(0.5)).toBe("Zero Ghana cedis and fifty pesewas only");
  });
});

describe("buildReceipt", () => {
  const data = buildReceipt({
    payment,
    schoolName: "Kiddiewise School Complex",
    methodLabel: "Mobile money",
    logoUrl: null,
  });

  it("carries the payment onto the receipt", () => {
    expect(data).toMatchObject({
      receiptNo: "RCP-9C1F2B7A",
      schoolName: "Kiddiewise School Complex",
      studentName: "Kofi Mensah",
      className: "Basic 4",
      amount: 450,
      method: "Mobile money",
      reference: "MP2607.1432.A1",
    });
  });

  // The label prints; the raw method is what decides which of the form's three boxes is ticked, so
  // the receipt has to carry both.
  it("carries the raw method alongside its label, for the tick box", () => {
    expect(data.methodKey).toBe("mobile_money");
  });

  // The line attests who took the money, so it must survive a reprint by anyone else, see the
  // note on buildReceipt. Asserted here because the regression it guards (the signed-in admin's
  // name on a colleague's receipt, or the parent's own name on theirs) is invisible on screen.
  it("names the officer who recorded the payment, not whoever is printing it", () => {
    expect(data.issuedBy).toBe("Ama Mensah");
  });

  it("falls back to the school office when the recorder's profile is gone", () => {
    const orphaned = buildReceipt({
      payment: { ...payment, recorded_by_name: null },
      schoolName: "S",
      methodLabel: "Cash",
      logoUrl: null,
    });
    expect(orphaned.issuedBy).toBe("the school office");
  });

  it("keeps a missing reference as null rather than inventing one", () => {
    const noRef = buildReceipt({
      payment: { ...payment, reference: null },
      schoolName: "S",
      methodLabel: "Cash",
      logoUrl: null,
    });
    expect(noRef.reference).toBeNull();
  });
});

describe("buildReceipt logo", () => {
  it("prefers the tenant's own uploaded logo", () => {
    const uploaded =
      "https://example.supabase.co/storage/v1/object/public/school-logos/abc/logo.png";
    const data = buildReceipt({
      payment,
      schoolName: "S",
      methodLabel: "Cash",
      logoUrl: uploaded,
    });
    expect(data.logoSrc).toBe(uploaded);
  });

  it("falls back to the bundled crest when the school has not uploaded one", () => {
    const data = buildReceipt({
      payment,
      schoolName: "S",
      methodLabel: "Cash",
      logoUrl: null,
    });
    expect(data.logoSrc).toBe(BRAND.crest.src);
  });
});

describe("receiptFilename", () => {
  it("names the file for the student and receipt, not just 'receipt.pdf'", () => {
    const data = buildReceipt({
      payment,
      schoolName: "S",
      methodLabel: "Cash",
      logoUrl: null,
    });
    expect(receiptFilename(data)).toBe("RCP-9C1F2B7A-Kofi-Mensah.pdf");
  });

  it("strips punctuation that would break a filename", () => {
    const data = buildReceipt({
      payment: { ...payment, student_name: "N'Diaye  Kwame-Junior" },
      schoolName: "S",
      methodLabel: "Cash",
      logoUrl: null,
    });
    expect(receiptFilename(data)).toBe("RCP-9C1F2B7A-N-Diaye-Kwame-Junior.pdf");
  });
});
