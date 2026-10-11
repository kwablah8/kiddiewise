import { describe, expect, it } from "vitest";
import { columnsFor, columnsToCsv, exportFilename, pdfRows, type ExportColumn } from "@/lib/export";
import {
  classFeeColumns,
  classFeeDetails,
  feesFilterLabels,
  paymentColumns,
  paymentDetails,
} from "@/lib/fees/export";
import { buildRegisterSummary, registerSummaryColumns, registerSummaryDetails } from "@/lib/attendance";
import { buildCheckinRows, checkinColumns, checkinDetails } from "@/lib/gate-export";
import { resultsColumns, resultsDetails } from "@/lib/reports/export";
import type { TerminalReportRowVM, TerminalReportSheetVM } from "@/lib/validators/reports";
import type { PaymentVM, StudentFeeVM } from "@/lib/validators/fees";
import type { PresenceDayVM } from "@/lib/validators/gate";

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

describe("register summary", () => {
  const students = [
    { id: "s2", first_name: "Yaw", last_name: "Boateng", admission_no: "K-2" },
    { id: "s1", first_name: "Ama", last_name: "Mensah", admission_no: "K-1" },
  ];

  it("tallies each student's marks, by name, and rates present and late as attended", () => {
    const rows = buildRegisterSummary(students, [
      { student_id: "s1", status: "present" },
      { student_id: "s1", status: "late" },
      { student_id: "s1", status: "absent" },
      { student_id: "s1", status: "present" },
    ]);
    expect(rows.map((r) => r.name)).toEqual(["Ama Mensah", "Yaw Boateng"]);
    expect(rows[0]).toMatchObject({ present: 2, late: 1, absent: 1, marked: 4, pct: 75 });
  });

  it("keeps a student with no marks, with no rate rather than 0%", () => {
    const [ama, yaw] = buildRegisterSummary(students, [{ student_id: "s1", status: "present" }]);
    expect(ama!.pct).toBe(100);
    expect(yaw).toMatchObject({ marked: 0, pct: null });
    expect(columnsToCsv(registerSummaryColumns, [yaw!])).toContain("K-2,Yaw Boateng,0,0,0,0,");
    expect(pdfRows(registerSummaryColumns, [yaw!])[0]!.at(-1)).toBe("—");
  });

  it("reports the class rate across every marked day", () => {
    const rows = buildRegisterSummary(students, [
      { student_id: "s1", status: "present" },
      { student_id: "s1", status: "absent" },
    ]);
    expect(registerSummaryDetails(["Basic 1"], rows)).toEqual(["Basic 1", "2 students", "Class attendance 50%"]);
    expect(registerSummaryDetails([], buildRegisterSummary(students, []))).toEqual(["2 students"]);
  });
});

describe("check-in export", () => {
  const scan = (over: Partial<PresenceDayVM> & { id: string; name: string; kind?: "student" | "staff" }): PresenceDayVM => ({
    date: "2026-10-08",
    device_user_id: over.id,
    person: { kind: over.kind ?? "student", id: over.id, name: over.name, detail: "Basic 1" },
    arrived_at: "2026-10-08T07:42:00.000Z",
    left_at: null,
    late: false,
    ...over,
  });
  const classOf = new Map<string, string | null>([["a", "c1"], ["b", "c2"]]);

  it("keeps one kind of person, narrows to a class, and orders by day then name", () => {
    const presence = [
      scan({ id: "b", name: "Zed", date: "2026-10-07" }),
      scan({ id: "a", name: "Yaa", date: "2026-10-09" }),
      scan({ id: "a", name: "Yaa", date: "2026-10-07" }),
      scan({ id: "t", name: "Mr Staff", kind: "staff" }),
    ];
    expect(buildCheckinRows(presence, "student", null, classOf).map((r) => `${r.date} ${r.name}`)).toEqual([
      "2026-10-07 Yaa",
      "2026-10-07 Zed",
      "2026-10-09 Yaa",
    ]);
    expect(buildCheckinRows(presence, "student", "c1", classOf)).toHaveLength(2);
    expect(buildCheckinRows(presence, "staff", "c1", classOf)).toHaveLength(1);
  });

  it("writes 24-hour times to the spreadsheet and 12-hour times on paper", () => {
    const row = buildCheckinRows([scan({ id: "a", name: "Yaa", late: true })], "student", null, classOf);
    const columns = checkinColumns("student", "Africa/Accra");
    expect(columnsToCsv(columns, row)).toContain("2026-10-08,Yaa,Basic 1,07:42,,Late");
    expect(pdfRows(columns, row)[0]).toEqual(["08 Oct 2026", "Yaa", "Basic 1", "7:42 AM", "—", "Late"]);
    expect(checkinDetails(["Basic 1"], row)).toEqual(["Basic 1", "1 check-in", "1 late"]);
  });
});

describe("class results export", () => {
  const subject = (name: string, code: string | null, cls: number, exam: number) => ({
    subject_name: name,
    short_code: code,
    class_score: cls,
    exam_score: exam,
    total: cls + exam,
    class_average: null,
    class_lowest: null,
    class_highest: null,
    grade: null,
    position: null,
    remark: null,
  });
  const row = (over: Partial<TerminalReportRowVM> = {}): TerminalReportRowVM => ({
    id: "r1",
    student_id: "s1",
    student_name: "Ama Mensah",
    student_first_name: "Ama",
    student_last_name: "Mensah",
    admission_no: "K-1",
    subject_count: 2,
    total_score: 150,
    average_score: 75,
    overall_grade: "B",
    position: 2,
    passes: 2,
    class_average: null,
    class_lowest_average: null,
    class_highest_average: null,
    level_position: null,
    level_size: null,
    attendance_present: 12,
    attendance_total: 14,
    class_teacher_comment: null,
    head_teacher_comment: null,
    conduct: null,
    attitude: null,
    interest: null,
    promoted_to: null,
    enrolled_count: 30,
    subjects: [subject("Mathematics", "MATH", 30, 50), subject("English", null, 20, 50)],
    is_published: false,
    generated_at: "2026-10-01T00:00:00Z",
    ...over,
  });

  it("prints a total per subject and gives the spreadsheet class, exam and total", () => {
    const columns = resultsColumns([row()]);
    expect(pdfRows(columnsFor(columns, "pdf"), [row()])[0]).toEqual([
      "K-1", "Ama Mensah", "70", "80", "150", "75%", "B", "2", "12/14",
    ]);
    const csv = columnsToCsv(columns, [row()]);
    expect(csv).toContain("English (Class),English (Exam),English (Total),Mathematics (Class),Mathematics (Exam),Mathematics (Total)");
    expect(csv).toContain("K-1,Ama Mensah,20,50,70,30,50,80,150,75,B,2,12,14");
  });

  it("heads a printed subject column with its short code, or the name when it has none", () => {
    const headers = columnsFor(resultsColumns([row()]), "pdf").map((c) => c.header);
    expect(headers).toContain("MATH");
    expect(headers).toContain("English");
  });

  it("leaves a subject a student has no row for blank, and takes subjects from every student", () => {
    const other = row({ student_id: "s2", student_name: "Yaw Boateng", subjects: [subject("Science", null, 10, 40)] });
    const columns = resultsColumns([row(), other]);
    expect(columnsToCsv(columns, [other])).toContain("Yaw Boateng,,,,,,,10,40,50");
    expect(columns.filter((c) => c.only === "csv" && c.header.startsWith("Science"))).toHaveLength(3);
  });

  it("has only the overall figures before a class is generated, and no zero for a missing average", () => {
    const draft = row({ id: null, subjects: [], average_score: null, total_score: null, overall_grade: null, position: null, attendance_present: 0, attendance_total: 0 });
    expect(pdfRows(columnsFor(resultsColumns([draft]), "pdf"), [draft])[0]).toEqual([
      "K-1", "Ama Mensah", "—", "—", "—", "—", "—",
    ]);
    expect(columnsToCsv(resultsColumns([draft]), [draft])).toContain("K-1,Ama Mensah,,,,,0,0");
  });

  it("says how many reports are generated", () => {
    const sheet = { rows: [row(), row()], generated_count: 1 } as TerminalReportSheetVM;
    expect(resultsDetails(["Basic 1"], sheet)).toEqual(["Basic 1", "1 of 2 reports generated"]);
  });
});
