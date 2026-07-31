/**
 * tr_class_teacher_write / trs_* (migration 0028): the class TEACHER — not just any teacher of the
 * class — compiles their class's terminal reports, and parents see subject rows only once the
 * report is published. seedTwoSchools makes teacherA a subject teacher of classA_taught; the
 * beforeAll promotes them to its class teacher, which is the relationship these policies gate on.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { admin, seedTwoSchools, signInAs, type Seeded } from "./helpers";

let s: Seeded;
let termId: string;
let reportId: string;

beforeAll(async () => {
  s = await seedTwoSchools();
  const svc = admin();

  const { error: ctErr } = await svc
    .from("classes")
    .update({ class_teacher_id: s.teacherA })
    .eq("id", s.classA_taught);
  if (ctErr) throw new Error(`class teacher seed: ${ctErr.message}`);

  const { data: term, error: termErr } = await svc
    .from("terms")
    .select("id, academic_year_id")
    .eq("school_id", s.schoolA)
    .limit(1)
    .single();
  if (termErr) throw new Error(`term lookup: ${termErr.message}`);
  termId = term!.id;

  const teacher = await signInAs(s.teacherAEmail);
  const { data: report, error } = await teacher
    .from("terminal_reports")
    .insert({
      school_id: s.schoolA,
      student_id: s.studentA1,
      class_id: s.classA_taught,
      term_id: termId,
      academic_year_id: term!.academic_year_id,
      average_score: 74,
      attendance_present: 50,
      attendance_total: 55,
    })
    .select("id")
    .single();
  if (error) throw new Error(`class-teacher report insert should pass: ${error.message}`);
  reportId = report!.id;
});

describe("class teacher compiles their own class", () => {
  it("writes the card fields and subject rows for their class", async () => {
    const teacher = await signInAs(s.teacherAEmail);

    const { error: updateErr } = await teacher
      .from("terminal_reports")
      .update({ conduct: "Respectful and helpful", promoted_to: "Basic 2" })
      .eq("id", reportId);
    expect(updateErr).toBeNull();

    const { error: subjectErr } = await teacher.from("terminal_report_subjects").insert({
      school_id: s.schoolA,
      report_id: reportId,
      student_id: s.studentA1,
      subject_name: "Mathematics",
      class_score: 40,
      exam_score: 34,
      total: 74,
      position: 1,
      remark: "Very Good",
    });
    expect(subjectErr).toBeNull();
  });

  it("CANNOT create a report for a class where they are not the class teacher", async () => {
    const teacher = await signInAs(s.teacherAEmail);
    const { data: term } = await admin()
      .from("terms")
      .select("academic_year_id")
      .eq("id", termId)
      .single();
    const { error } = await teacher.from("terminal_reports").insert({
      school_id: s.schoolA,
      student_id: s.studentA2,
      class_id: s.classA_untaught, // teaches nothing there, certainly not class teacher
      term_id: termId,
      academic_year_id: term!.academic_year_id,
    });
    expect(error).not.toBeNull();
  });
});

describe("parents and the subject snapshot", () => {
  it("sees nothing while the report is a draft, everything once published", async () => {
    const parent = await signInAs(s.parentAEmail);

    const before = await parent
      .from("terminal_report_subjects")
      .select("subject_name")
      .eq("report_id", reportId);
    expect(before.data).toHaveLength(0);

    const { error: pubErr } = await admin()
      .from("terminal_reports")
      .update({ is_published: true })
      .eq("id", reportId);
    if (pubErr) throw new Error(pubErr.message);

    const after = await parent
      .from("terminal_report_subjects")
      .select("subject_name, total")
      .eq("report_id", reportId);
    expect(after.data).toHaveLength(1);
    expect(after.data![0]!.subject_name).toBe("Mathematics");
  });
});
