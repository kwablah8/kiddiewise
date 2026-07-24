import type {
  DashboardStatsVM,
  DashboardTrendsVM,
  TrendPointVM,
  ClassPerformanceVM,
  RecentActivityVM,
  UpcomingEventVM,
} from "@/lib/validators/dashboard";
import type { SidebarCountsVM } from "@/lib/validators/sidebar";
import type {
  StudentDetailVM,
  ParentListItemVM,
  GuardianVM,
} from "@/lib/validators/people";
import type {
  AcademicYearVM,
  TermVM,
  ClassVM,
  SubjectVM,
  StaffVM,
  AssignmentVM,
} from "@/lib/validators/academics";
import type { InquiryVM } from "@/lib/validators/inquiries";
import type { GradeBandVM, AssessmentTypeVM } from "@/lib/validators/grading";
import type { AssessmentRecord, ResultRecord } from "@/lib/mock/assessment-records";
import type { ParentAnnouncementVM, AttendanceStatus } from "@/lib/validators/parent";
import type { AttendanceRecord } from "@/lib/mock/attendance-records";

// students/staff are static demo figures; new_inquiries is derived live in lib/data/sidebar.ts.
export const mockSidebarCounts: Pick<SidebarCountsVM, "students" | "staff"> = {
  students: 248,
  staff: 32,
};

export const mockDashboardStats: DashboardStatsVM = {
  total_students: 248,
  total_staff: 32,
  // total_revenue is the sum of mockFeeTrend below (187,500).
  total_revenue: 187500,
  attendance_rate: 94,
};

// SEAM: month-over-month deltas the real dashboard_stats RPC doesn't supply yet — see the
// dashboardTrendsVM comment in lib/validators/dashboard.ts. `revenue: -32` deliberately mirrors
// mockFeeTrend's actual last-two-month delta (26,000 vs 38,250 ≈ -32%) so the Total Revenue
// card and the Fee Collection Trend chart never contradict each other on screen.
export const mockDashboardTrends: DashboardTrendsVM = {
  students: 8,
  staff: 3,
  revenue: -32,
  attendance: 2,
};

export const mockFeeTrend: TrendPointVM[] = [
  { month: "2026-01", value: 22000 },
  { month: "2026-02", value: 31500 },
  { month: "2026-03", value: 28750 },
  { month: "2026-04", value: 41000 },
  { month: "2026-05", value: 38250 },
  { month: "2026-06", value: 26000 },
];

export const mockEnrollmentTrend: TrendPointVM[] = [
  { month: "2026-01", value: 12 },
  { month: "2026-02", value: 18 },
  { month: "2026-03", value: 9 },
  { month: "2026-04", value: 24 },
  { month: "2026-05", value: 15 },
  { month: "2026-06", value: 21 },
];

export const mockClassPerformance: ClassPerformanceVM[] = [
  { class_id: "c1", class_name: "Creche", level: "Nursery", students: 14, average_score: null },
  { class_id: "c2", class_name: "Nursery 1", level: "Nursery", students: 19, average_score: null },
  { class_id: "c3", class_name: "KG 1", level: "Kindergarten", students: 22, average_score: 88.6 },
  { class_id: "c4", class_name: "KG 2", level: "Kindergarten", students: 21, average_score: 86.2 },
  { class_id: "c5", class_name: "Basic 1", level: "Primary", students: 28, average_score: 82.4 },
  { class_id: "c6", class_name: "Basic 2", level: "Primary", students: 26, average_score: 79.8 },
  { class_id: "c7", class_name: "Basic 4", level: "Primary", students: 25, average_score: 77.3 },
  { class_id: "c8", class_name: "Basic 6", level: "Primary", students: 24, average_score: 80.1 },
  { class_id: "c9", class_name: "JHS 1A", level: "JHS", students: 30, average_score: 71.5 },
  { class_id: "c10", class_name: "JHS 2A", level: "JHS", students: 31, average_score: 74.1 },
  { class_id: "c11", class_name: "JHS 3A", level: "JHS", students: 28, average_score: 76.9 },
];

export const mockRecentActivities: RecentActivityVM[] = [
  {
    id: "a1",
    action: "enrolled a student",
    entity_type: "student",
    actor_name: "Ama Mensah",
    created_at: "2026-07-20T09:12:00Z",
  },
  {
    id: "a2",
    action: "recorded a payment",
    entity_type: "invoice",
    actor_name: "Kofi Owusu",
    created_at: "2026-07-20T08:03:00Z",
  },
  {
    id: "a3",
    action: "published terminal reports",
    entity_type: "terminal_report",
    actor_name: "Efua Asante",
    created_at: "2026-07-19T15:47:00Z",
  },
  {
    id: "a4",
    action: "created an announcement",
    entity_type: "announcement",
    actor_name: "Yaw Boateng",
    created_at: "2026-07-19T11:20:00Z",
  },
  {
    id: "a5",
    action: "reviewed an admissions inquiry",
    entity_type: "admissions_inquiry",
    actor_name: "Ama Mensah",
    created_at: "2026-07-18T14:05:00Z",
  },
  {
    id: "a6",
    action: "updated a class assignment",
    entity_type: "class",
    actor_name: "Kwesi Appiah",
    created_at: "2026-07-18T09:41:00Z",
  },
];

export const mockUpcomingEvents: UpcomingEventVM[] = [
  { id: "e1", title: "Mid-Term Exams", start_at: "2026-07-28T08:00:00Z", location: "Main Hall" },
  { id: "e2", title: "PTA Meeting", start_at: "2026-08-02T16:00:00Z", location: "Assembly Ground" },
  { id: "e3", title: "Inter-House Sports", start_at: "2026-08-14T09:00:00Z", location: "School Field" },
  { id: "e4", title: "Speech and Prize-Giving Day", start_at: "2026-08-21T10:00:00Z", location: "Main Hall" },
  { id: "e5", title: "Staff Training Workshop", start_at: "2026-08-25T13:00:00Z", location: null },
];

// Marketing admissions inquiries (03-DATABASE §8). Spans every status so Admissions (Slice 4)
// renders real variety; `desired_class` values deliberately mix real class names (Basic 1/2/3,
// JHS 1/2 → match mockClasses) with unmatched ones (KG 2, Creche → the "unassigned" convert path).
// Dated mid–late July 2026 to sit alongside the other dashboard fixtures. Count of `new` = 3.
export const mockInquiries: InquiryVM[] = [
  {
    id: "inq-01",
    applicant_name: "Kwame Mensah",
    parent_name: "Grace Mensah",
    parent_email: "grace.mensah@example.com",
    parent_phone: "+233 24 555 1010",
    desired_class: "JHS 1",
    message: "We are relocating to Accra and would like to enroll our son for the coming term.",
    status: "new",
    created_at: "2026-07-22T08:15:00Z",
  },
  {
    id: "inq-02",
    applicant_name: "Ama Owusu",
    parent_name: "Kofi Owusu",
    parent_email: "kofi.owusu@example.com",
    parent_phone: "+233 20 555 2020",
    desired_class: "KG 2",
    message: "Please advise on the admissions process and available places.",
    status: "new",
    created_at: "2026-07-21T14:40:00Z",
  },
  {
    id: "inq-03",
    applicant_name: "Yaw Boateng",
    parent_name: "Abena Boateng",
    parent_email: "abena.boateng@example.com",
    parent_phone: null,
    desired_class: "Basic 3",
    message: null,
    status: "new",
    created_at: "2026-07-20T10:05:00Z",
  },
  {
    id: "inq-04",
    applicant_name: "Efua Sarpong",
    parent_name: "Daniel Sarpong",
    parent_email: "daniel.sarpong@example.com",
    parent_phone: "+233 27 555 3030",
    desired_class: "Basic 1",
    message: "Interested in a place for our daughter. She currently attends a school in Kumasi.",
    status: "reviewing",
    created_at: "2026-07-18T09:30:00Z",
  },
  {
    id: "inq-05",
    applicant_name: "Nana Adjei",
    parent_name: "Comfort Adjei",
    parent_email: "comfort.adjei@example.com",
    parent_phone: "+233 24 555 4040",
    desired_class: "JHS 2",
    message: "Following up on our visit last week — happy to proceed.",
    status: "accepted",
    created_at: "2026-07-15T11:20:00Z",
  },
  {
    id: "inq-06",
    applicant_name: "Adwoa Danso",
    parent_name: "Michael Danso",
    parent_email: "michael.danso@example.com",
    parent_phone: "+233 20 555 5050",
    desired_class: "Creche",
    message: "Enquiring about crèche availability for a two-year-old.",
    status: "rejected",
    created_at: "2026-07-12T16:00:00Z",
  },
  {
    id: "inq-07",
    applicant_name: "Kojo Appiah",
    parent_name: "Linda Appiah",
    parent_email: "linda.appiah@example.com",
    parent_phone: "+233 26 555 6060",
    desired_class: "Basic 2",
    message: "Thank you for the warm welcome during our tour.",
    status: "converted",
    created_at: "2026-07-08T13:10:00Z",
  },
];

// ---------------------------------------------------------------------------
// Academics (Years/Terms · Classes · Subjects · Staff · Assignments) — Slice 3.
// This is now the single source of truth for classes: People (Students +
// Parents, Slice 2) reads the same `mockClasses` array via `classOf()` below,
// and `lib/data/people.ts#listClassOptions` derives from `store.classes`
// (which is seeded from `mockClasses`), so a class created via Academics
// shows up in the student form's class dropdown without a second fixture set.
// ---------------------------------------------------------------------------

// Raw fixture record shapes mirror the generated `Database` row types (minus
// `school_id`/`created_at`, which are server/RLS concerns) — NOT the VMs,
// since VM fields like `term_count`/`class_teacher_name`/`student_count`/
// `subject_count`/`class_count`/`class_name`/`subject_name`/`teacher_name` are derived by
// the store + `lib/data/academics.ts`, never hand-authored here.
type AcademicYearFixture = Omit<AcademicYearVM, "term_count">;
type TermFixture = TermVM;
type ClassFixture = Omit<ClassVM, "class_teacher_name" | "student_count" | "subject_count">;
type SubjectFixture = Omit<SubjectVM, "class_count">;
type StaffFixture = Omit<StaffVM, "class_count" | "subject_count">;
type AssignmentFixture = Omit<AssignmentVM, "class_name" | "subject_name" | "teacher_name">;

// Today (fixture authoring date) sits in Third Term of the 2025/2026 academic
// year — matches the rest of the dashboard fixtures (events/activities dated
// July 2026) so "the active year/term" never looks inconsistent across screens.
export const mockAcademicYears: AcademicYearFixture[] = [
  {
    id: "ay-1",
    name: "2025/2026",
    start_date: "2025-09-01",
    end_date: "2026-07-31",
    is_active: true,
  },
  {
    id: "ay-2",
    name: "2026/2027",
    start_date: "2026-09-01",
    end_date: "2027-07-31",
    is_active: false,
  },
];

export const mockTerms: TermFixture[] = [
  {
    id: "trm-1",
    academic_year_id: "ay-1",
    name: "First Term",
    ordinal: 1,
    start_date: "2025-09-01",
    end_date: "2025-12-12",
    is_active: false,
  },
  {
    id: "trm-2",
    academic_year_id: "ay-1",
    name: "Second Term",
    ordinal: 2,
    start_date: "2026-01-05",
    end_date: "2026-03-27",
    is_active: false,
  },
  {
    id: "trm-3",
    academic_year_id: "ay-1",
    name: "Third Term",
    ordinal: 3,
    start_date: "2026-04-20",
    end_date: "2026-07-31",
    is_active: true,
  },
];

export const mockSubjects: SubjectFixture[] = [
  { id: "sub-01", name: "Mathematics", code: "MATH" },
  { id: "sub-02", name: "English Language", code: "ENG" },
  { id: "sub-03", name: "Integrated Science", code: "SCI" },
  { id: "sub-04", name: "Social Studies", code: "SOC" },
  { id: "sub-05", name: "French", code: null },
  { id: "sub-06", name: "Religious and Moral Education", code: "RME" },
  { id: "sub-07", name: "Information and Communication Technology", code: "ICT" },
  { id: "sub-08", name: "Creative Arts", code: null },
];

// staff_no assigned in order (TCH-1..TCH-6) — mirrors nextStaffNo()'s
// max-existing+1 rule so seeding and the auto-assign logic never disagree.
export const mockStaff: StaffFixture[] = [
  {
    id: "stf-01",
    first_name: "Efua",
    last_name: "Owusu",
    email: "efua.owusu@school.edu.gh",
    phone: "+233 24 100 1001",
    staff_no: "TCH-1",
    department: "Mathematics",
    is_active: true,
  },
  {
    id: "stf-02",
    first_name: "Kwabena",
    last_name: "Sarpong",
    email: "kwabena.sarpong@school.edu.gh",
    phone: "+233 20 100 1002",
    staff_no: "TCH-2",
    department: "Science",
    is_active: true,
  },
  {
    id: "stf-03",
    first_name: "Adjoa",
    last_name: "Boateng",
    email: "adjoa.boateng@school.edu.gh",
    phone: null,
    staff_no: "TCH-3",
    department: "Languages",
    is_active: true,
  },
  {
    id: "stf-04",
    first_name: "Yaw",
    last_name: "Antwi",
    email: "yaw.antwi@school.edu.gh",
    phone: "+233 27 100 1004",
    staff_no: "TCH-4",
    department: "Social Studies",
    is_active: true,
  },
  {
    id: "stf-05",
    first_name: "Abena",
    last_name: "Frimpong",
    email: "abena.frimpong@school.edu.gh",
    phone: "+233 26 100 1005",
    staff_no: "TCH-5",
    department: null,
    is_active: true,
  },
  {
    id: "stf-06",
    first_name: "Kojo",
    last_name: "Asare",
    email: "kojo.asare@school.edu.gh",
    phone: null,
    staff_no: "TCH-6",
    department: null,
    is_active: false,
  },
];

// Same ids/names/levels the Slice-2 placeholder `mockClassOptions` used, so
// existing student fixtures below (which reference `cls-1`..`cls-6`) keep
// resolving; capacity + class_teacher_id are the Slice-3 additions. `cls-5`
// deliberately has a null capacity and no class teacher for the "—" fallback
// states in Unit B's classes table.
export const mockClasses: ClassFixture[] = [
  { id: "cls-1", name: "Basic 1", level: "Primary", capacity: 30, class_teacher_id: "stf-01" },
  { id: "cls-2", name: "Basic 2", level: "Primary", capacity: 30, class_teacher_id: "stf-02" },
  { id: "cls-3", name: "Basic 3", level: "Primary", capacity: 32, class_teacher_id: "stf-03" },
  { id: "cls-4", name: "JHS 1", level: "JHS", capacity: 35, class_teacher_id: "stf-04" },
  { id: "cls-5", name: "JHS 2", level: "JHS", capacity: null, class_teacher_id: null },
  { id: "cls-6", name: "JHS 3", level: "JHS", capacity: 35, class_teacher_id: "stf-05" },
];

// class_subjects: unique per (class_id, subject_id); teacher_id optional
// ("Unassigned"). `stf-06` (inactive) deliberately teaches nothing, so a
// staff row can legitimately show class_count/subject_count of 0.
export const mockClassSubjects: AssignmentFixture[] = [
  { id: "as-01", class_id: "cls-1", subject_id: "sub-01", teacher_id: "stf-01" },
  { id: "as-02", class_id: "cls-1", subject_id: "sub-02", teacher_id: "stf-01" },
  { id: "as-03", class_id: "cls-1", subject_id: "sub-03", teacher_id: "stf-02" },
  { id: "as-04", class_id: "cls-1", subject_id: "sub-08", teacher_id: null },
  { id: "as-05", class_id: "cls-2", subject_id: "sub-01", teacher_id: "stf-02" },
  { id: "as-06", class_id: "cls-2", subject_id: "sub-02", teacher_id: "stf-03" },
  { id: "as-07", class_id: "cls-2", subject_id: "sub-04", teacher_id: "stf-04" },
  { id: "as-08", class_id: "cls-3", subject_id: "sub-01", teacher_id: "stf-01" },
  { id: "as-09", class_id: "cls-3", subject_id: "sub-03", teacher_id: "stf-02" },
  { id: "as-10", class_id: "cls-3", subject_id: "sub-06", teacher_id: "stf-05" },
  { id: "as-11", class_id: "cls-4", subject_id: "sub-01", teacher_id: "stf-04" },
  { id: "as-12", class_id: "cls-4", subject_id: "sub-02", teacher_id: "stf-03" },
  { id: "as-13", class_id: "cls-4", subject_id: "sub-05", teacher_id: "stf-05" },
  { id: "as-14", class_id: "cls-4", subject_id: "sub-07", teacher_id: null },
  { id: "as-15", class_id: "cls-5", subject_id: "sub-01", teacher_id: "stf-01" },
  { id: "as-16", class_id: "cls-5", subject_id: "sub-03", teacher_id: "stf-02" },
  { id: "as-17", class_id: "cls-5", subject_id: "sub-04", teacher_id: "stf-04" },
  { id: "as-18", class_id: "cls-6", subject_id: "sub-01", teacher_id: "stf-05" },
  { id: "as-19", class_id: "cls-6", subject_id: "sub-02", teacher_id: "stf-03" },
  { id: "as-20", class_id: "cls-6", subject_id: "sub-07", teacher_id: "stf-05" },
  { id: "as-21", class_id: "cls-6", subject_id: "sub-06", teacher_id: null },
];

// Grading scale — percentage bands, contiguous, covering 0–100 (A/B/C/D/E/F). Editable by the admin.
export const mockGradeBands: GradeBandVM[] = [
  { id: "gb-01", min_score: 80, max_score: 100, grade: "A", remark: "Excellent" },
  { id: "gb-02", min_score: 70, max_score: 79, grade: "B", remark: "Very Good" },
  { id: "gb-03", min_score: 60, max_score: 69, grade: "C", remark: "Good" },
  { id: "gb-04", min_score: 50, max_score: 59, grade: "D", remark: "Credit" },
  { id: "gb-05", min_score: 40, max_score: 49, grade: "E", remark: "Pass" },
  { id: "gb-06", min_score: 0, max_score: 39, grade: "F", remark: "Fail" },
];

// Assessment types — weights sum to 100 (Class Test 20 + Mid-Term 30 + End-of-Term 50).
export const mockAssessmentTypes: AssessmentTypeVM[] = [
  { id: "atype-01", name: "Class Test", weight: 20 },
  { id: "atype-02", name: "Mid-Term Exam", weight: 30 },
  { id: "atype-03", name: "End-of-Term Exam", weight: 50 },
];

// ---------------------------------------------------------------------------
// People (Students + Parents) — Slice 2. Classes above (`mockClasses`) are
// now owned by Academics (Slice 3); `classOf()` below just looks them up.
// ---------------------------------------------------------------------------

const parentsBase: Omit<ParentListItemVM, "children_names">[] = [
  {
    id: "prt-01",
    first_name: "Yaw",
    last_name: "Mensah",
    email: "yaw.mensah@example.com",
    phone: "+233 24 111 2222",
    occupation: "Teacher",
  },
  {
    id: "prt-02",
    first_name: "Abena",
    last_name: "Owusu",
    email: "abena.owusu@example.com",
    phone: "+233 20 222 3333",
    occupation: "Trader",
  },
  {
    id: "prt-03",
    first_name: "Kofi",
    last_name: "Asante",
    email: "kofi.asante@example.com",
    phone: "+233 24 333 4444",
    occupation: "Engineer",
  },
  {
    id: "prt-04",
    first_name: "Efua",
    last_name: "Darko",
    email: "efua.darko@example.com",
    phone: "+233 27 444 5555",
    occupation: null,
  },
  {
    id: "prt-05",
    first_name: "Kwabena",
    last_name: "Boateng",
    email: "kwabena.boateng@example.com",
    phone: "+233 20 555 6666",
    occupation: "Farmer",
  },
  {
    id: "prt-06",
    first_name: "Adjoa",
    last_name: "Sarpong",
    email: "adjoa.sarpong@example.com",
    phone: "+233 24 666 7777",
    occupation: "Nurse",
  },
  {
    id: "prt-07",
    first_name: "Kwesi",
    last_name: "Antwi",
    email: "kwesi.antwi@example.com",
    phone: "+233 26 777 8888",
    occupation: null,
  },
  {
    id: "prt-08",
    first_name: "Akosua",
    last_name: "Frimpong",
    email: "akosua.frimpong@example.com",
    phone: "+233 24 888 9999",
    occupation: "Seamstress",
  },
  {
    id: "prt-09",
    first_name: "Kojo",
    last_name: "Appiah",
    email: "kojo.appiah@example.com",
    phone: null,
    occupation: null,
  },
  {
    id: "prt-10",
    first_name: "Esi",
    last_name: "Yeboah",
    email: "esi.yeboah@example.com",
    phone: "+233 20 999 0000",
    occupation: "Accountant",
  },
];

function guardianOf(
  parentId: string,
  relationship: GuardianVM["relationship"],
  isPrimary: boolean,
): GuardianVM {
  const parent = parentsBase.find((p) => p.id === parentId);
  if (!parent) throw new Error(`Unknown fixture parent id: ${parentId}`);
  return {
    parent_profile_id: parent.id,
    name: `${parent.first_name} ${parent.last_name}`,
    email: parent.email,
    occupation: parent.occupation ?? null,
    relationship,
    is_primary: isPrimary,
  };
}

function classOf(classId: string | null): Pick<StudentFixture, "class_id" | "class_name"> {
  if (!classId) return { class_id: null, class_name: null };
  const cls = mockClasses.find((c) => c.id === classId);
  if (!cls) throw new Error(`Unknown fixture class id: ${classId}`);
  return { class_id: cls.id, class_name: cls.name };
}

type StudentFixture = Omit<StudentDetailVM, "guardian_names">;

// ~24 students spanning all enrollment_status values and both assigned/unassigned classes,
// so the list/detail UIs (Unit B) have real variety to render against.
// Fields left null below (not repeated in comments): initial_academic_year_id, initial_term_id —
// no student is seeded with an initial-assignment year/term (Slice 3 academics aren't wired to
// admission yet); students created via the form can set these going forward.
export const mockStudents: StudentFixture[] = [
  {
    id: "stu-01",
    admission_no: "KID-0001",
    first_name: "Kwame",
    last_name: "Asante",
    date_of_birth: "2019-03-14",
    gender: "male",
    enrollment_status: "active",
    photo_url: null,
    other_names: "Kofi",
    blood_group: "O+",
    enrollment_date: "2023-09-01",
    medical_conditions: "Mild asthma",
    allergies: "Peanuts",
    prev_school_name: "Little Angels Academy",
    prev_class_ended: "KG 2",
    prev_average_score: "88",
    prev_year_attended: "2022",
    email: null,
    phone: "+233 24 555 0101",
    address: "12 Ring Road",
    city: "Accra",
    town: "Osu",
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf("cls-1"),
    guardians: [guardianOf("prt-01", "father", true), guardianOf("prt-02", "mother", false)],
  },
  {
    id: "stu-02",
    admission_no: "KID-0002",
    first_name: "Ama",
    last_name: "Boateng",
    date_of_birth: "2019-07-22",
    gender: "female",
    enrollment_status: "active",
    photo_url: null,
    other_names: "Adjoa",
    blood_group: "A+",
    enrollment_date: "2023-09-01",
    medical_conditions: null,
    allergies: "Seafood",
    prev_school_name: "Sunrise Montessori",
    prev_class_ended: "KG 2",
    prev_average_score: "91",
    prev_year_attended: "2022",
    email: null,
    phone: "+233 20 555 0102",
    address: "8 Spintex Road",
    city: "Accra",
    town: "Spintex",
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf("cls-1"),
    guardians: [guardianOf("prt-01", "father", true), guardianOf("prt-02", "mother", false)],
  },
  {
    id: "stu-03",
    admission_no: "KID-0003",
    first_name: "Kwesi",
    last_name: "Owusu",
    date_of_birth: "2018-11-05",
    gender: "male",
    enrollment_status: "active",
    photo_url: null,
    other_names: null,
    blood_group: "B+",
    enrollment_date: "2022-09-05",
    medical_conditions: "Eczema",
    allergies: null,
    prev_school_name: "Bright Kids Prep",
    prev_class_ended: "KG 1",
    prev_average_score: "76",
    prev_year_attended: "2021",
    email: null,
    phone: "+233 24 555 0103",
    address: "45 Liberation Road",
    city: "Accra",
    town: "Dzorwulu",
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf("cls-1"),
    guardians: [guardianOf("prt-03", "father", true), guardianOf("prt-04", "mother", false)],
  },
  {
    id: "stu-04",
    admission_no: "KID-0004",
    first_name: "Efua",
    last_name: "Mensah",
    date_of_birth: "2018-09-30",
    gender: "female",
    enrollment_status: "inactive",
    photo_url: null,
    other_names: "Abena",
    blood_group: null,
    enrollment_date: "2022-09-05",
    medical_conditions: null,
    allergies: null,
    prev_school_name: null,
    prev_class_ended: null,
    prev_average_score: null,
    prev_year_attended: null,
    email: null,
    phone: null,
    address: "3 Osu Badu Street",
    city: "Accra",
    town: "Osu",
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf("cls-1"),
    guardians: [guardianOf("prt-03", "father", true), guardianOf("prt-04", "mother", false)],
  },
  {
    id: "stu-05",
    admission_no: "KID-0005",
    first_name: "Yaw",
    last_name: "Darko",
    date_of_birth: "2018-02-17",
    gender: "male",
    enrollment_status: "active",
    photo_url: null,
    other_names: null,
    blood_group: null,
    enrollment_date: null,
    medical_conditions: null,
    allergies: null,
    prev_school_name: null,
    prev_class_ended: null,
    prev_average_score: null,
    prev_year_attended: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    town: null,
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf("cls-2"),
    guardians: [guardianOf("prt-03", "father", true), guardianOf("prt-04", "mother", false)],
  },
  {
    id: "stu-06",
    admission_no: "KID-0006",
    first_name: "Abena",
    last_name: "Sarpong",
    date_of_birth: "2017-12-09",
    gender: "female",
    enrollment_status: "active",
    photo_url: null,
    other_names: null,
    blood_group: null,
    enrollment_date: null,
    medical_conditions: null,
    allergies: null,
    prev_school_name: null,
    prev_class_ended: null,
    prev_average_score: null,
    prev_year_attended: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    town: null,
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf("cls-2"),
    guardians: [guardianOf("prt-05", "father", true)],
  },
  {
    id: "stu-07",
    admission_no: "KID-0007",
    first_name: "Kofi",
    last_name: "Antwi",
    date_of_birth: "2017-05-26",
    gender: "male",
    enrollment_status: "active",
    photo_url: null,
    other_names: null,
    blood_group: null,
    enrollment_date: null,
    medical_conditions: null,
    allergies: null,
    prev_school_name: null,
    prev_class_ended: null,
    prev_average_score: null,
    prev_year_attended: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    town: null,
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf("cls-2"),
    guardians: [guardianOf("prt-05", "father", true)],
  },
  {
    id: "stu-08",
    admission_no: "KID-0008",
    first_name: "Akosua",
    last_name: "Adjei",
    date_of_birth: "2017-08-13",
    gender: "female",
    enrollment_status: "transferred",
    photo_url: null,
    other_names: null,
    blood_group: null,
    enrollment_date: null,
    medical_conditions: null,
    allergies: null,
    prev_school_name: null,
    prev_class_ended: null,
    prev_average_score: null,
    prev_year_attended: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    town: null,
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf("cls-3"),
    guardians: [guardianOf("prt-07", "guardian", true)],
  },
  {
    id: "stu-09",
    admission_no: "KID-0009",
    first_name: "Kwabena",
    last_name: "Osei",
    date_of_birth: "2016-04-02",
    gender: "male",
    enrollment_status: "active",
    photo_url: null,
    other_names: null,
    blood_group: null,
    enrollment_date: null,
    medical_conditions: null,
    allergies: null,
    prev_school_name: null,
    prev_class_ended: null,
    prev_average_score: null,
    prev_year_attended: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    town: null,
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf("cls-3"),
    guardians: [guardianOf("prt-08", "mother", true), guardianOf("prt-09", "father", false)],
  },
  {
    id: "stu-10",
    admission_no: "KID-0010",
    first_name: "Adwoa",
    last_name: "Frimpong",
    date_of_birth: "2016-10-19",
    gender: "female",
    enrollment_status: "active",
    photo_url: null,
    other_names: null,
    blood_group: null,
    enrollment_date: null,
    medical_conditions: null,
    allergies: null,
    prev_school_name: null,
    prev_class_ended: null,
    prev_average_score: null,
    prev_year_attended: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    town: null,
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf("cls-3"),
    guardians: [guardianOf("prt-08", "mother", true), guardianOf("prt-09", "father", false)],
  },
  {
    id: "stu-11",
    admission_no: "KID-0011",
    first_name: "Kwaku",
    last_name: "Appiah",
    date_of_birth: "2016-06-24",
    gender: "male",
    enrollment_status: "withdrawn",
    photo_url: null,
    other_names: null,
    blood_group: null,
    enrollment_date: null,
    medical_conditions: null,
    allergies: null,
    prev_school_name: null,
    prev_class_ended: null,
    prev_average_score: null,
    prev_year_attended: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    town: null,
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf("cls-3"),
    guardians: [guardianOf("prt-08", "mother", true), guardianOf("prt-09", "father", false)],
  },
  {
    id: "stu-12",
    admission_no: "KID-0012",
    first_name: "Afua",
    last_name: "Yeboah",
    date_of_birth: "2013-01-11",
    gender: "female",
    enrollment_status: "active",
    photo_url: null,
    other_names: null,
    blood_group: null,
    enrollment_date: null,
    medical_conditions: null,
    allergies: null,
    prev_school_name: null,
    prev_class_ended: null,
    prev_average_score: null,
    prev_year_attended: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    town: null,
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf("cls-4"),
    guardians: [guardianOf("prt-10", "mother", true)],
  },
  {
    id: "stu-13",
    admission_no: "KID-0013",
    first_name: "Nana",
    last_name: "Agyemang",
    date_of_birth: "2013-09-08",
    gender: "male",
    enrollment_status: "active",
    photo_url: null,
    other_names: null,
    blood_group: null,
    enrollment_date: null,
    medical_conditions: null,
    allergies: null,
    prev_school_name: null,
    prev_class_ended: null,
    prev_average_score: null,
    prev_year_attended: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    town: null,
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf("cls-4"),
    guardians: [guardianOf("prt-02", "mother", true), guardianOf("prt-01", "father", false)],
  },
  {
    id: "stu-14",
    admission_no: "KID-0014",
    first_name: "Akua",
    last_name: "Kusi",
    date_of_birth: "2013-03-27",
    gender: "female",
    enrollment_status: "active",
    photo_url: null,
    other_names: null,
    blood_group: null,
    enrollment_date: null,
    medical_conditions: null,
    allergies: null,
    prev_school_name: null,
    prev_class_ended: null,
    prev_average_score: null,
    prev_year_attended: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    town: null,
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf("cls-4"),
    guardians: [guardianOf("prt-02", "mother", true), guardianOf("prt-01", "father", false)],
  },
  {
    id: "stu-15",
    admission_no: "KID-0015",
    first_name: "Yaa",
    last_name: "Oduro",
    date_of_birth: "2012-11-14",
    gender: "female",
    enrollment_status: "active",
    photo_url: null,
    other_names: null,
    blood_group: null,
    enrollment_date: null,
    medical_conditions: null,
    allergies: null,
    prev_school_name: null,
    prev_class_ended: null,
    prev_average_score: null,
    prev_year_attended: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    town: null,
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf("cls-5"),
    guardians: [guardianOf("prt-06", "mother", true)],
  },
  {
    id: "stu-16",
    admission_no: "KID-0016",
    first_name: "Kojo",
    last_name: "Amoah",
    date_of_birth: "2012-07-02",
    gender: "male",
    enrollment_status: "graduated",
    photo_url: null,
    other_names: null,
    blood_group: null,
    enrollment_date: null,
    medical_conditions: null,
    allergies: null,
    prev_school_name: null,
    prev_class_ended: null,
    prev_average_score: null,
    prev_year_attended: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    town: null,
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf("cls-5"),
    guardians: [guardianOf("prt-06", "mother", true)],
  },
  {
    id: "stu-17",
    admission_no: "KID-0017",
    first_name: "Abla",
    last_name: "Nyarko",
    date_of_birth: "2012-05-20",
    gender: "female",
    enrollment_status: "active",
    photo_url: null,
    other_names: null,
    blood_group: null,
    enrollment_date: null,
    medical_conditions: null,
    allergies: null,
    prev_school_name: null,
    prev_class_ended: null,
    prev_average_score: null,
    prev_year_attended: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    town: null,
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf("cls-5"),
    guardians: [guardianOf("prt-03", "father", true)],
  },
  {
    id: "stu-18",
    admission_no: "KID-0018",
    first_name: "Fiifi",
    last_name: "Danso",
    date_of_birth: "2012-02-09",
    gender: "male",
    enrollment_status: "transferred",
    photo_url: null,
    other_names: null,
    blood_group: null,
    enrollment_date: null,
    medical_conditions: null,
    allergies: null,
    prev_school_name: null,
    prev_class_ended: null,
    prev_average_score: null,
    prev_year_attended: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    town: null,
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf("cls-5"),
    guardians: [guardianOf("prt-03", "father", true)],
  },
  {
    id: "stu-19",
    admission_no: "KID-0019",
    first_name: "Esi",
    last_name: "Ansah",
    date_of_birth: "2011-10-30",
    gender: "female",
    enrollment_status: "active",
    photo_url: null,
    other_names: null,
    blood_group: null,
    enrollment_date: null,
    medical_conditions: null,
    allergies: null,
    prev_school_name: null,
    prev_class_ended: null,
    prev_average_score: null,
    prev_year_attended: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    town: null,
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf("cls-6"),
    guardians: [guardianOf("prt-09", "father", true)],
  },
  {
    id: "stu-20",
    admission_no: "KID-0020",
    first_name: "Kwadwo",
    last_name: "Gyasi",
    date_of_birth: "2011-08-16",
    gender: "male",
    enrollment_status: "active",
    photo_url: null,
    other_names: null,
    blood_group: null,
    enrollment_date: null,
    medical_conditions: null,
    allergies: null,
    prev_school_name: null,
    prev_class_ended: null,
    prev_average_score: null,
    prev_year_attended: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    town: null,
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf("cls-6"),
    guardians: [guardianOf("prt-09", "father", true)],
  },
  {
    id: "stu-21",
    admission_no: "KID-0021",
    first_name: "Adjoa",
    last_name: "Baah",
    date_of_birth: "2019-01-05",
    gender: "female",
    enrollment_status: "active",
    photo_url: null,
    other_names: null,
    blood_group: null,
    enrollment_date: null,
    medical_conditions: null,
    allergies: null,
    prev_school_name: null,
    prev_class_ended: null,
    prev_average_score: null,
    prev_year_attended: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    town: null,
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf(null),
    guardians: [],
  },
  {
    id: "stu-22",
    admission_no: "KID-0022",
    first_name: "Kwamena",
    last_name: "Tetteh",
    date_of_birth: "2011-04-22",
    gender: "male",
    enrollment_status: "active",
    photo_url: null,
    other_names: null,
    blood_group: null,
    enrollment_date: null,
    medical_conditions: null,
    allergies: null,
    prev_school_name: null,
    prev_class_ended: null,
    prev_average_score: null,
    prev_year_attended: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    town: null,
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf("cls-6"),
    guardians: [guardianOf("prt-10", "mother", true)],
  },
  {
    id: "stu-23",
    admission_no: "KID-0023",
    first_name: "Araba",
    last_name: "Quaye",
    date_of_birth: "2011-12-18",
    gender: "female",
    enrollment_status: "graduated",
    photo_url: null,
    other_names: null,
    blood_group: null,
    enrollment_date: null,
    medical_conditions: null,
    allergies: null,
    prev_school_name: null,
    prev_class_ended: null,
    prev_average_score: null,
    prev_year_attended: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    town: null,
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf("cls-6"),
    guardians: [guardianOf("prt-04", "mother", true)],
  },
  {
    id: "stu-24",
    admission_no: "KID-0024",
    first_name: "Ekow",
    last_name: "Sackey",
    date_of_birth: "2019-06-11",
    gender: "male",
    enrollment_status: "active",
    photo_url: null,
    other_names: null,
    blood_group: null,
    enrollment_date: null,
    medical_conditions: null,
    allergies: null,
    prev_school_name: null,
    prev_class_ended: null,
    prev_average_score: null,
    prev_year_attended: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    town: null,
    initial_academic_year_id: null,
    initial_term_id: null,
    ...classOf(null),
    guardians: [],
  },
];

// children_names is derived from mockStudents' guardian links so the two fixture sets can
// never drift out of sync with each other.
export const mockParents: ParentListItemVM[] = parentsBase.map((p) => ({
  ...p,
  children_names: mockStudents
    .filter((s) => s.guardians.some((g) => g.parent_profile_id === p.id))
    .map((s) => `${s.first_name} ${s.last_name}`),
}));

// ---------------------------------------------------------------------------
// Assessments + Results (read-only oversight) — Slice 5.
// ---------------------------------------------------------------------------

// Assessments the admin monitors (created by teachers in the real app; seeded here). Active term trm-3.
export const mockAssessments: AssessmentRecord[] = [
  { id: "asm-01", class_id: "cls-1", subject_id: "sub-01", term_id: "trm-3", assessment_type_id: "atype-02", title: "Mid-Term Exam", max_score: 30, date: "2026-06-05", is_submitted: true },
  { id: "asm-02", class_id: "cls-1", subject_id: "sub-02", term_id: "trm-3", assessment_type_id: "atype-01", title: "Class Test 1", max_score: 20, date: "2026-05-20", is_submitted: true },
  { id: "asm-03", class_id: "cls-4", subject_id: "sub-01", term_id: "trm-3", assessment_type_id: "atype-03", title: "End-of-Term Exam", max_score: 100, date: "2026-07-10", is_submitted: false },
  { id: "asm-04", class_id: "cls-4", subject_id: "sub-02", term_id: "trm-3", assessment_type_id: "atype-01", title: "Class Test 2", max_score: 20, date: "2026-06-18", is_submitted: true },
  { id: "asm-05", class_id: "cls-5", subject_id: "sub-03", term_id: "trm-3", assessment_type_id: "atype-02", title: "Mid-Term Exam", max_score: 40, date: "2026-06-06", is_submitted: true },
  { id: "asm-06", class_id: "cls-3", subject_id: "sub-01", term_id: "trm-3", assessment_type_id: "atype-01", title: "Class Test 1", max_score: 25, date: null, is_submitted: false },
];

// Deterministic pseudo-score in [40, 98]% of maxScore, from the student+assessment ids — no RNG, so
// the oversight view is stable across reloads. Generated over each assessment's class roster.
function seedResults(): ResultRecord[] {
  const out: ResultRecord[] = [];
  for (const a of mockAssessments) {
    const roster = mockStudents.filter((s) => s.class_id === a.class_id);
    roster.forEach((s, i) => {
      const h = [...(s.id + a.id)].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      const pct = 40 + ((h + i * 7) % 59); // 40..98
      out.push({ id: `res-${a.id}-${s.id}`, assessment_id: a.id, student_id: s.id, score: Math.round((pct / 100) * a.max_score) });
    });
  }
  return out;
}
export const mockResults: ResultRecord[] = seedResults();

// ---------------------------------------------------------------------------
// Parent-facing announcements (Parent portal, Slice 1). Newest first at read time.
// ---------------------------------------------------------------------------
export const mockParentAnnouncements: ParentAnnouncementVM[] = [
  {
    id: "ann-01",
    title: "Third term resumes Monday",
    body: "Classes resume on Monday. Please ensure pupils arrive by 7:30am in full uniform.",
    audience: "everyone",
    created_at: "2026-07-20T09:00:00Z",
  },
  {
    id: "ann-02",
    title: "PTA meeting this Saturday",
    body: "Our termly Parent–Teacher Association meeting holds this Saturday at 10:00am in the school hall.",
    audience: "parents",
    created_at: "2026-07-18T14:00:00Z",
  },
  {
    id: "ann-03",
    title: "Mid-term exams begin 28 July",
    body: "Mid-term assessments run the week of 28 July. Revision timetables have gone home with pupils.",
    audience: "everyone",
    created_at: "2026-07-15T08:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Attendance — SHARED model (Parent portal reads it; Teacher portal marks it). One rich
// AttendanceRecord shape. Parent-child seeds: prt-01's four children across the term's first two
// weeks (07-01..16). Teacher seeds: every student in stf-01's classes across a recent week
// (07-20..24). Deterministic (P=present, L=late, A=absent); no (student,date) overlap between the
// two seed sets. class_id is looked up from the student; term_id = the active term (trm-3).
// ---------------------------------------------------------------------------
const ATTENDANCE_DATES = [
  "2026-07-01", "2026-07-02", "2026-07-03", "2026-07-06", "2026-07-07", "2026-07-08",
  "2026-07-09", "2026-07-10", "2026-07-13", "2026-07-14", "2026-07-15", "2026-07-16",
];
const ATTENDANCE_STATUS: Record<string, AttendanceStatus> = {
  P: "present",
  L: "late",
  A: "absent",
};
const ATTENDANCE_TERM_ID = "trm-3";

function classIdOf(studentId: string): string {
  return mockStudents.find((s) => s.id === studentId)?.class_id ?? "";
}

// Parent-child seeds: a fixed 12-day pattern per child.
function attendanceFor(studentId: string, pattern: string): AttendanceRecord[] {
  const classId = classIdOf(studentId);
  return pattern.split("").map((ch, i) => ({
    student_id: studentId,
    class_id: classId,
    term_id: ATTENDANCE_TERM_ID,
    date: ATTENDANCE_DATES[i]!,
    status: ATTENDANCE_STATUS[ch]!,
    marked_by: "stf-01",
  }));
}

// Teacher seeds: every student in a class across a recent school week, mostly present.
const TEACHER_ATTENDANCE_DATES = [
  "2026-07-20", "2026-07-21", "2026-07-22", "2026-07-23", "2026-07-24",
];
function classAttendance(classId: string): AttendanceRecord[] {
  const studs = mockStudents.filter((s) => s.class_id === classId);
  const recs: AttendanceRecord[] = [];
  let i = 0;
  for (const d of TEACHER_ATTENDANCE_DATES) {
    for (const s of studs) {
      const status: AttendanceStatus = i % 11 === 0 ? "absent" : i % 7 === 0 ? "late" : "present";
      recs.push({
        student_id: s.id,
        class_id: classId,
        term_id: ATTENDANCE_TERM_ID,
        date: d,
        status,
        marked_by: "stf-01",
      });
      i++;
    }
  }
  return recs;
}

export const mockAttendance: AttendanceRecord[] = [
  ...attendanceFor("stu-01", "PPPLPPAPPPPP"), // 10 present, 1 late, 1 absent → 92%
  ...attendanceFor("stu-02", "PPPPPPPPPPPP"), // all present → 100%
  ...attendanceFor("stu-13", "PAPPLPAPPLPA"), // 7 present, 2 late, 3 absent → 75%
  ...attendanceFor("stu-14", "PPLPPPPPLPPP"), // 10 present, 2 late → 100%
  ...classAttendance("cls-1"),
  ...classAttendance("cls-3"),
  ...classAttendance("cls-5"),
];

// ---------------------------------------------------------------------------
// Results + terminal reports (Parent portal, Slice 3). Per-subject term scores (out of 100; the
// grade/remark are derived at read time from the school's grade bands) and one published terminal
// report per child. Seeded for prt-01's children; stu-14 deliberately has NO report so the parent
// view can show the "not published yet" state. SEAM: teachers author these in the real app.
// ---------------------------------------------------------------------------
export const mockChildSubjectResults: {
  student_id: string;
  subject: string;
  score: number;
  teacher_comment: string | null;
}[] = [
  // stu-01 — Kwame Asante (Basic 1)
  { student_id: "stu-01", subject: "English Language", score: 84, teacher_comment: "Reads fluently and writes with growing confidence." },
  { student_id: "stu-01", subject: "Mathematics", score: 78, teacher_comment: "Strong with numbers; keep practising word problems." },
  { student_id: "stu-01", subject: "Integrated Science", score: 71, teacher_comment: "Curious and asks thoughtful questions." },
  { student_id: "stu-01", subject: "Creative Arts", score: 92, teacher_comment: "Wonderfully imaginative work all term." },
  // stu-02 — Ama Boateng (Basic 1)
  { student_id: "stu-02", subject: "English Language", score: 90, teacher_comment: "An excellent reader and clear writer." },
  { student_id: "stu-02", subject: "Mathematics", score: 88, teacher_comment: "Confident and accurate." },
  { student_id: "stu-02", subject: "Integrated Science", score: 82, teacher_comment: "Enjoys practical activities." },
  { student_id: "stu-02", subject: "Creative Arts", score: 79, teacher_comment: "Neat and careful." },
  // stu-13 — Nana Agyemang (JHS 1)
  { student_id: "stu-13", subject: "English Language", score: 65, teacher_comment: "Improving steadily; read more widely." },
  { student_id: "stu-13", subject: "Mathematics", score: 58, teacher_comment: "Needs more practice with algebra." },
  { student_id: "stu-13", subject: "Integrated Science", score: 74, teacher_comment: "Good grasp of core concepts." },
  { student_id: "stu-13", subject: "Social Studies", score: 69, teacher_comment: "Participates well in discussion." },
  // stu-14 — Akua Kusi (JHS 1) — report intentionally not published
  { student_id: "stu-14", subject: "English Language", score: 81, teacher_comment: "Articulate and well-organised." },
  { student_id: "stu-14", subject: "Mathematics", score: 76, teacher_comment: "Solid problem-solving." },
  { student_id: "stu-14", subject: "Integrated Science", score: 85, teacher_comment: "Excellent lab work." },
  { student_id: "stu-14", subject: "Social Studies", score: 72, teacher_comment: "Thoughtful essays." },
];

export const mockTerminalReports: {
  student_id: string;
  published: boolean;
  class_teacher_remark: string;
}[] = [
  { student_id: "stu-01", published: true, class_teacher_remark: "A diligent pupil who has had an excellent term. Keep it up!" },
  { student_id: "stu-02", published: true, class_teacher_remark: "Ama is a joy to teach and a model to her classmates." },
  { student_id: "stu-13", published: true, class_teacher_remark: "A steady term with real improvement. Focus on Mathematics next term." },
  // stu-14: report prepared but NOT yet published.
];
