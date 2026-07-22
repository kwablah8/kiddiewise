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
  ClassOptionVM,
  GuardianVM,
} from "@/lib/validators/people";

export const mockSidebarCounts: SidebarCountsVM = {
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

// ---------------------------------------------------------------------------
// People (Students + Parents) — Slice 2. Classes are mocked here until the
// Academics UI (Slice 3) owns the real class list.
// ---------------------------------------------------------------------------

export const mockClassOptions: ClassOptionVM[] = [
  { id: "cls-1", name: "Basic 1", level: "Primary" },
  { id: "cls-2", name: "Basic 2", level: "Primary" },
  { id: "cls-3", name: "Basic 3", level: "Primary" },
  { id: "cls-4", name: "JHS 1", level: "JHS" },
  { id: "cls-5", name: "JHS 2", level: "JHS" },
  { id: "cls-6", name: "JHS 3", level: "JHS" },
];

const parentsBase: Omit<ParentListItemVM, "children_names">[] = [
  {
    id: "prt-01",
    first_name: "Yaw",
    last_name: "Mensah",
    email: "yaw.mensah@example.com",
    phone: "+233 24 111 2222",
  },
  {
    id: "prt-02",
    first_name: "Abena",
    last_name: "Owusu",
    email: "abena.owusu@example.com",
    phone: "+233 20 222 3333",
  },
  {
    id: "prt-03",
    first_name: "Kofi",
    last_name: "Asante",
    email: "kofi.asante@example.com",
    phone: "+233 24 333 4444",
  },
  {
    id: "prt-04",
    first_name: "Efua",
    last_name: "Darko",
    email: "efua.darko@example.com",
    phone: "+233 27 444 5555",
  },
  {
    id: "prt-05",
    first_name: "Kwabena",
    last_name: "Boateng",
    email: "kwabena.boateng@example.com",
    phone: "+233 20 555 6666",
  },
  {
    id: "prt-06",
    first_name: "Adjoa",
    last_name: "Sarpong",
    email: "adjoa.sarpong@example.com",
    phone: "+233 24 666 7777",
  },
  {
    id: "prt-07",
    first_name: "Kwesi",
    last_name: "Antwi",
    email: "kwesi.antwi@example.com",
    phone: "+233 26 777 8888",
  },
  {
    id: "prt-08",
    first_name: "Akosua",
    last_name: "Frimpong",
    email: "akosua.frimpong@example.com",
    phone: "+233 24 888 9999",
  },
  {
    id: "prt-09",
    first_name: "Kojo",
    last_name: "Appiah",
    email: "kojo.appiah@example.com",
    phone: null,
  },
  {
    id: "prt-10",
    first_name: "Esi",
    last_name: "Yeboah",
    email: "esi.yeboah@example.com",
    phone: "+233 20 999 0000",
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
    relationship,
    is_primary: isPrimary,
  };
}

function classOf(classId: string | null): Pick<StudentFixture, "class_id" | "class_name"> {
  if (!classId) return { class_id: null, class_name: null };
  const cls = mockClassOptions.find((c) => c.id === classId);
  if (!cls) throw new Error(`Unknown fixture class id: ${classId}`);
  return { class_id: cls.id, class_name: cls.name };
}

type StudentFixture = Omit<StudentDetailVM, "guardian_names">;

// ~24 students spanning all enrollment_status values and both assigned/unassigned classes,
// so the list/detail UIs (Unit B) have real variety to render against.
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
