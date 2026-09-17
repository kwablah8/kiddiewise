import { z } from "zod";

// Mirrors the real `dashboard_stats(school_id)` RPC (docs/03-DATABASE §12) exactly, four bare
// totals, no comparison figures, so integration is a clean swap, not a seam break.
export const dashboardStatsVM = z.object({
  total_students: z.number(),
  total_staff: z.number(),
  total_revenue: z.number(),
  attendance_rate: z.number(),
});

// Backed by the `dashboard_trends()` RPC (migration 0018). Kept as its own node rather than folded
// into dashboardStatsVM because it answers a different question and comes from a different RPC.
//
// `students`, `staff` and `revenue` are signed RELATIVE percent changes vs last month. `attendance`
// is a PERCENTAGE-POINT difference, because it is already a rate, reporting "attendance up 4%" when
// it moved 92% → 96% would be wrong twice over. Feeds the stat-card trend pills
// (`06-UI §5/§6`, `01-REQ Admin §Dashboard`).
export const dashboardTrendsVM = z.object({
  students: z.number(),
  staff: z.number(),
  revenue: z.number(),
  attendance: z.number(),
});

export const trendPointVM = z.object({ month: z.string(), value: z.number() });

export const classPerformanceVM = z.object({
  class_id: z.string(),
  class_name: z.string(),
  level: z.string(),
  students: z.number(),
  average_score: z.number().nullable(),
});

// Backed by class_attendance_summary() (migration 0040) — counts rather than a pre-computed rate,
// so a zero-record class reads as "no data" instead of a misleading 0%; the rate is derived by callers.
export const classAttendanceVM = z.object({
  class_id: z.string(),
  class_name: z.string(),
  level: z.string(),
  present_count: z.number(),
  total_count: z.number(),
});

export const recentActivityVM = z.object({
  id: z.string(),
  action: z.string(),
  entity_type: z.string(),
  actor_name: z.string(),
  created_at: z.string(),
});

export const upcomingEventVM = z.object({
  id: z.string(),
  title: z.string(),
  start_at: z.string(),
  location: z.string().nullable(),
});

export type DashboardStatsVM = z.infer<typeof dashboardStatsVM>;
export type DashboardTrendsVM = z.infer<typeof dashboardTrendsVM>;
export type TrendPointVM = z.infer<typeof trendPointVM>;
export type ClassPerformanceVM = z.infer<typeof classPerformanceVM>;
export type ClassAttendanceVM = z.infer<typeof classAttendanceVM>;
export type RecentActivityVM = z.infer<typeof recentActivityVM>;
export type UpcomingEventVM = z.infer<typeof upcomingEventVM>;
