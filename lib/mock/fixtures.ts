import type {
  DashboardStatsVM,
  TrendPointVM,
  ClassPerformanceVM,
  RecentActivityVM,
  UpcomingEventVM,
} from "@/lib/validators/dashboard";
import type { SidebarCountsVM } from "@/lib/validators/sidebar";

export const mockSidebarCounts: SidebarCountsVM = {
  students: 248,
  staff: 32,
};

export const mockDashboardStats: DashboardStatsVM = {
  total_students: 248,
  total_staff: 32,
  total_revenue: 187500,
  attendance_rate: 94,
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
