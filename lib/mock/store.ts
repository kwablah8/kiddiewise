import * as fx from "./fixtures";
import type {
  StudentListItemVM,
  ParentListItemVM,
  GuardianVM,
  BloodGroup,
} from "@/lib/validators/people";
import type { AcademicYearVM, TermVM, ClassVM, SubjectVM, StaffVM, StaffRole, AssignmentVM } from "@/lib/validators/academics";
import type { InquiryVM } from "@/lib/validators/inquiries";
import type { GradeBandVM, AssessmentTypeVM } from "@/lib/validators/grading";
import type { AssessmentRecord, ResultRecord } from "@/lib/mock/assessment-records";
import type { ParentAnnouncementVM } from "@/lib/validators/parent";
import type { FeeStructureVM, ExtraFeeStructureVM } from "@/lib/validators/fees";
import { applyAttendanceUpsert, type UpsertMeta } from "@/lib/attendance";
import type { AttendanceStatus } from "@/lib/validators/attendance";

// SEAM: in-memory only (resets on reload). Real backend replaces reads/writes in lib/data +
// lib/actions; the store shape here mirrors the tables (students + student_guardians + profiles
// + classes) closely enough that swapping in real queries is a drop-in.
type StudentRecord = Omit<StudentListItemVM, "guardian_names"> & {
  date_of_birth: string;
  guardians: GuardianVM[];
  other_names: string | null;
  blood_group: BloodGroup | null;
  enrollment_date: string | null;
  medical_conditions: string | null;
  allergies: string | null;
  prev_school_name: string | null;
  prev_class_ended: string | null;
  prev_average_score: string | null;
  prev_year_attended: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  town: string | null;
  initial_academic_year_id: string | null;
  initial_term_id: string | null;
};

// Academics raw records mirror the generated `Database` row shapes (minus `school_id`/
// `created_at`); derived VM-only fields (term_count, class_teacher_name, student_count,
// subject_count, class_count, class_name, subject_name, teacher_name) are computed at read time
// in lib/data/academics.ts, never stored — so they can never go stale after a mutation.
type AcademicYearRecord = Omit<AcademicYearVM, "term_count">;
type TermRecord = TermVM;
type ClassRecord = Omit<ClassVM, "class_teacher_name" | "student_count" | "subject_count">;
type SubjectRecord = Omit<SubjectVM, "class_count">;
type StaffRecord = Omit<StaffVM, "class_count" | "subject_count">;
type AssignmentRecord = Omit<AssignmentVM, "class_name" | "subject_name" | "teacher_name">;
// Marketing Admissions/Contact inquiries (03-DATABASE §8 `admissions_inquiries`). Seeded from
// `mockInquiries`; further rows are appended by the anonymous `submitInquiry` action.
type InquiryRecord = InquiryVM;
type GradeBandRecord = GradeBandVM;
type AssessmentTypeRecord = AssessmentTypeVM;

// Seed by copying (not referencing) fixtures, and deep-copy each student's guardians array so
// mutations never leak back into the shared fixture module.
const students: StudentRecord[] = fx.mockStudents.map((s) => ({
  ...s,
  guardians: s.guardians.map((g) => ({ ...g })),
}));
const parents: ParentListItemVM[] = fx.mockParents.map((p) => ({
  ...p,
  children_names: [...p.children_names],
}));
const academicYears: AcademicYearRecord[] = fx.mockAcademicYears.map((y) => ({ ...y }));
const terms: TermRecord[] = fx.mockTerms.map((t) => ({ ...t }));
const classes: ClassRecord[] = fx.mockClasses.map((c) => ({ ...c }));
const subjects: SubjectRecord[] = fx.mockSubjects.map((s) => ({ ...s }));
const staff: StaffRecord[] = fx.mockStaff.map((s) => ({ ...s }));
const classSubjects: AssignmentRecord[] = fx.mockClassSubjects.map((a) => ({ ...a }));
const inquiries: InquiryRecord[] = fx.mockInquiries.map((i) => ({ ...i }));
const gradeBands: GradeBandRecord[] = fx.mockGradeBands.map((b) => ({ ...b }));
const assessmentTypes: AssessmentTypeRecord[] = fx.mockAssessmentTypes.map((t) => ({ ...t }));
// Assessments + results (read-only oversight). Seeded by copying the fixtures.
const assessments: AssessmentRecord[] = fx.mockAssessments.map((a) => ({ ...a }));
const results: ResultRecord[] = fx.mockResults.map((r) => ({ ...r }));
// Parent-facing announcements (Parent portal). Copy-on-seed like the rest.
const announcements: ParentAnnouncementVM[] = fx.mockParentAnnouncements.map((a) => ({ ...a }));
// Per-child attendance records (Parent portal). Copy-on-seed like the rest.
const attendance = fx.mockAttendance.map((a) => ({ ...a }));
// Per-child subject results + published terminal reports (Parent portal).
const childSubjectResults = fx.mockChildSubjectResults.map((r) => ({ ...r }));
const terminalReports = fx.mockTerminalReports.map((r) => ({ ...r }));
// Fees (core spine). Copy-on-seed like the rest.
const feeStructures: FeeStructureVM[] = fx.mockFeeStructures.map((f) => ({ ...f }));
const studentFeeRecords = fx.mockStudentFeeRecords.map((r) => ({ ...r }));
const payments = fx.mockPayments.map((p) => ({ ...p }));
const extraFeeRecords = fx.mockExtraFeeRecords.map((e) => ({ ...e }));
const extraFeeStructures: ExtraFeeStructureVM[] = fx.mockExtraFeeStructures.map((e) => ({ ...e }));

export const store = {
  students,
  parents,
  classes,
  academicYears,
  terms,
  subjects,
  staff,
  classSubjects,
  inquiries,
  announcements,
  attendance,
  childSubjectResults,
  terminalReports,
  feeStructures,
  studentFeeRecords,
  payments,
  extraFeeRecords,
  extraFeeStructures,

  addFeeStructure(rec: FeeStructureVM) {
    feeStructures.unshift(rec);
  },
  addExtraFeeStructure(rec: ExtraFeeStructureVM) {
    extraFeeStructures.unshift(rec);
  },

  // Attendance reads/writes (Teacher portal marks; shared with the parent view). Upsert keys on
  // (student_id, date) — the 0007 unique constraint — via the pure helper, rebuilding in place.
  getAttendanceFor(classId: string, date: string) {
    return attendance.filter((r) => r.class_id === classId && r.date === date);
  },
  upsertAttendance(
    entries: { student_id: string; status: AttendanceStatus }[],
    meta: UpsertMeta,
  ) {
    const next = applyAttendanceUpsert(attendance, entries, meta);
    attendance.length = 0;
    attendance.push(...next);
    return entries.length;
  },

  addStudent(rec: StudentRecord) {
    students.unshift(rec);
  },
  updateStudent(id: string, patch: Partial<StudentRecord>) {
    const i = students.findIndex((s) => s.id === id);
    if (i >= 0) students[i] = { ...students[i]!, ...patch };
  },
  admissionExists(no: string, exceptId?: string) {
    return students.some((s) => s.admission_no === no && s.id !== exceptId);
  },
  // Auto admission number: KID-#### where #### = max existing numeric suffix + 1 (mirrors nextStaffNo()).
  nextAdmissionNo() {
    const max = students.reduce((acc, s) => {
      const m = /^KID-(\d+)$/.exec(s.admission_no);
      return Math.max(acc, m ? Number(m[1]) : 0);
    }, 0);
    return `KID-${String(max + 1).padStart(4, "0")}`;
  },
  addParent(p: ParentListItemVM) {
    parents.unshift(p);
  },
  linkGuardian(studentId: string, g: GuardianVM) {
    const s = students.find((x) => x.id === studentId);
    if (!s) return;
    // Single-primary invariant: a student has at most one primary guardian. When a new link is
    // marked primary, demote any existing primaries. (At integration the real path enforces this
    // via a partial unique index on student_guardians(student_id) WHERE is_primary, or in the action.)
    if (g.is_primary) {
      for (const existing of s.guardians) existing.is_primary = false;
    }
    if (!s.guardians.some((x) => x.parent_profile_id === g.parent_profile_id)) {
      s.guardians.push(g);
    }
    // Keep the parent's children_names in sync — the real backend derives both sides of this
    // relationship from the same student_guardians join, so a link changes what both
    // `getStudent`/`listStudents` AND `listParents` return (mirrored by useLinkGuardian
    // invalidating both `students` and `parents` query keys).
    const p = parents.find((x) => x.id === g.parent_profile_id);
    const fullName = `${s.first_name} ${s.last_name}`;
    if (p && !p.children_names.includes(fullName)) {
      p.children_names.push(fullName);
    }
  },

  // ---- Academics -----------------------------------------------------------

  addYear(rec: AcademicYearRecord) {
    academicYears.unshift(rec);
  },
  // Single-active-year invariant (mirrors the DB partial-unique index on
  // academic_years(school_id) WHERE is_active): setting one active demotes all others.
  setActiveYear(id: string) {
    for (const y of academicYears) y.is_active = y.id === id;
  },
  addTerm(rec: TermRecord) {
    terms.unshift(rec);
  },
  // Single-active-term invariant (same partial-unique-index pattern as years, scoped to the
  // whole school — a school has exactly one "current" term regardless of which year it's in).
  setActiveTerm(id: string) {
    for (const t of terms) t.is_active = t.id === id;
  },

  addClass(rec: ClassRecord) {
    classes.unshift(rec);
  },
  updateClass(id: string, patch: Partial<ClassRecord>) {
    const i = classes.findIndex((c) => c.id === id);
    if (i >= 0) classes[i] = { ...classes[i]!, ...patch };
  },

  subjectNameExists(name: string, exceptId?: string) {
    const needle = name.trim().toLowerCase();
    return subjects.some((s) => s.name.trim().toLowerCase() === needle && s.id !== exceptId);
  },
  addSubject(rec: SubjectRecord) {
    subjects.unshift(rec);
  },
  updateSubject(id: string, patch: Partial<SubjectRecord>) {
    const i = subjects.findIndex((s) => s.id === id);
    if (i >= 0) subjects[i] = { ...subjects[i]!, ...patch };
  },

  // staff_no auto-assign, role-aware prefix: teachers get TCH-<n>, administrators ADM-<n>, where
  // n = max existing numeric suffix for that prefix + 1.
  nextStaffNo(role: StaffRole = "teacher") {
    const prefix = role === "teacher" ? "TCH" : "ADM";
    const re = new RegExp(`^${prefix}-(\\d+)$`);
    const max = staff.reduce((acc, s) => {
      const match = re.exec(s.staff_no);
      const n = match ? Number(match[1]) : 0;
      return Math.max(acc, n);
    }, 0);
    return `${prefix}-${max + 1}`;
  },
  addStaff(rec: StaffRecord) {
    staff.unshift(rec);
  },
  updateStaff(id: string, patch: Partial<StaffRecord>) {
    const i = staff.findIndex((s) => s.id === id);
    if (i >= 0) staff[i] = { ...staff[i]!, ...patch };
  },

  assignmentExists(classId: string, subjectId: string) {
    return classSubjects.some((a) => a.class_id === classId && a.subject_id === subjectId);
  },
  assignSubject(rec: AssignmentRecord) {
    classSubjects.unshift(rec);
  },
  unassign(id: string) {
    const i = classSubjects.findIndex((a) => a.id === id);
    if (i >= 0) classSubjects.splice(i, 1);
  },

  // ---- Marketing: admissions inquiries --------------------------------------

  addInquiry(rec: InquiryRecord) {
    inquiries.unshift(rec);
  },
  updateInquiryStatus(id: string, status: InquiryRecord["status"]) {
    const i = inquiries.findIndex((x) => x.id === id);
    if (i >= 0) inquiries[i] = { ...inquiries[i]!, status };
  },

  // ---- Grading + assessments -------------------------------------------------

  gradeBands,
  assessmentTypes,
  assessments,
  results,

  addGradeBand(rec: GradeBandRecord) {
    gradeBands.unshift(rec);
  },
  updateGradeBand(id: string, patch: Partial<GradeBandRecord>) {
    const i = gradeBands.findIndex((b) => b.id === id);
    if (i >= 0) gradeBands[i] = { ...gradeBands[i]!, ...patch };
  },
  deleteGradeBand(id: string) {
    const i = gradeBands.findIndex((b) => b.id === id);
    if (i >= 0) gradeBands.splice(i, 1);
  },

  assessmentTypeNameExists(name: string, exceptId?: string) {
    const needle = name.trim().toLowerCase();
    return assessmentTypes.some((t) => t.name.trim().toLowerCase() === needle && t.id !== exceptId);
  },
  assessmentTypeInUse(id: string) {
    return assessments.some((a) => a.assessment_type_id === id);
  },
  // Teacher creates an assessment (Slice 3a). New assessments have no results yet.
  addAssessment(rec: AssessmentRecord) {
    assessments.unshift(rec);
  },
  addAssessmentType(rec: AssessmentTypeRecord) {
    assessmentTypes.unshift(rec);
  },
  updateAssessmentType(id: string, patch: Partial<AssessmentTypeRecord>) {
    const i = assessmentTypes.findIndex((t) => t.id === id);
    if (i >= 0) assessmentTypes[i] = { ...assessmentTypes[i]!, ...patch };
  },
  deleteAssessmentType(id: string) {
    const i = assessmentTypes.findIndex((t) => t.id === id);
    if (i >= 0) assessmentTypes.splice(i, 1);
  },
};
