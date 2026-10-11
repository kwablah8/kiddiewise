import { describe, expect, it } from "vitest";
import { columnsToCsv, exportFilename, pdfRows, type ExportColumn } from "@/lib/export";
import {
  classFeeColumns,
  classFeeDetails,
  feesFilterLabels,
  paymentColumns,
  paymentDetails,
} from "@/lib/fees/export";
import type { PaymentVM, StudentFeeVM } from "@/lib/validators/fees";

const payment = (over: Partial<PaymentVM> = {}): PaymentVM => ({
  id: "p1",
  student_id: "s1",
  student_name: "Ama Mensah",
  class_name: "Basic 1",
  amount: 1200,
  method: "mobile_money",
  reference: "MM-123",
  paid_at: "2026-10-09T10:30:00+00:00",
  fee_label: "School fees",
  recorded_by_name: "Kofi Admin",
  ...over,
});

const studentFee = (over: Partial<StudentFeeVM> = {}): StudentFeeVM => ({
  id: "i1",
  student_id: "s1",
  student_name: "Ama Mensah",
  class_name: "Basic 1",
  fee_term: "first",
  expected: 1500,
  discount: 0,
  scholarship_type: null,
  paid: 1000,
  arrears: 0,
  balance: 500,
  status: "partial",
  ...over,
});

describe("columnsToCsv", () => {
  const cols: ExportColumn<{ n: string; v: number }>[] = [
    { header: "Name", width: 1, pdf: (r) => r.n },
    { header: "Value", width: 1, pdf: (r) => `GHS ${r.v}`, csv: (r) => String(r.v) },
  ];

  it("uses the spreadsheet cell where there is one and the printed cell otherwise", () => {
    expect(columnsToCsv(cols, [{ n: "A", v: 5 }])).toBe("﻿Name,Value\r\nA,5");
    expect(pdfRows(cols, [{ n: "A", v: 5 }])).toEqual([["A", "GHS 5"]]);
  });

  it("quotes a cell that contains a comma", () => {
    expect(columnsToCsv(cols, [{ n: "Mensah, Ama", v: 1 }])).toContain('"Mensah, Ama"');
  });
});

describe("exportFilename", () => {
  it("names the kind, the school and the date", () => {
    expect(exportFilename("payments", "Snab Learners School", "csv")).toMatch(
      /^payments-Snab-Learners-School-\d{4}-\d{2}-\d{2}\.csv$/,
    );
  });
});

describe("payment export", () => {
  it("writes plain amounts and a plain date in the spreadsheet", () => {
    const csv = columnsToCsv(paymentColumns, [payment()]);
    expect(csv).toContain("2026-10-09");
    expect(csv).toContain(",1200.00");
    expect(csv).not.toContain("GHS");
  });

  it("leaves a missing reference empty in the spreadsheet and a dash on paper", () => {
    const row = payment({ reference: null, recorded_by_name: null });
    expect(columnsToCsv(paymentColumns, [row])).toContain("Mobile Money,,,1200.00");
    expect(pdfRows(paymentColumns, [row])[0]).toContain("—");
  });

  it("totals the payments in the report details", () => {
    expect(paymentDetails(["Basic 1"], [payment(), payment({ id: "p2", amount: 300 })])).toEqual([
      "Basic 1",
      "2 payments",
      "Total GHS 1,500.00",
    ]);
  });
});

describe("class fee export", () => {
  it("writes the balance as a plain number", () => {
    const csv = columnsToCsv(classFeeColumns, [studentFee()]);
    expect(csv).toContain("First Term");
    expect(csv).toContain("1500.00,1000.00,500.00,Partial");
  });

  it("sums expected, paid and outstanding in the report details", () => {
    const details = classFeeDetails([], [studentFee(), studentFee({ id: "i2", expected: 500, paid: 500, balance: 0 })]);
    expect(details).toEqual([
      "2 students",
      "Expected GHS 2,000.00",
      "Paid GHS 1,500.00",
      "Outstanding GHS 500.00",
    ]);
  });
});

describe("feesFilterLabels", () => {
  it("names the class, year and term in force, and nothing for an open filter", () => {
    const classes = [{ id: "c1", name: "Basic 1" }];
    const years = [{ id: "y1", name: "2026/2027" }];
    expect(feesFilterLabels({ class_id: "c1", academic_year_id: "y1", term: "second" }, classes, years)).toEqual([
      "Basic 1",
      "2026/2027",
      "Second Term",
    ]);
    expect(feesFilterLabels({}, classes, years)).toEqual([]);
  });
});
