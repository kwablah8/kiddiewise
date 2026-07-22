import { z } from "zod";

// NOTE: the real `dashboard_stats(school_id)` RPC (docs/03-DATABASE §12) returns only the four
// bare totals below — no comparison figures. The `_trend` fields are a deliberate VM-layer
// enrichment (this is exactly what a Zod view-model is for per this file's own convention:
// "joined/derived shapes the API will return") so the required stat-card trend pills
// (`06-UI §5/§6`, `01-REQ Admin §Dashboard`) have real, typed data to render. At integration,
// `getDashboardStats` will need to compute these four percentages (e.g. current vs prior period)
// alongside the totals — a small, additive RPC change, not a seam break.
export const dashboardStatsVM = z.object({
  total_students: z.number(),
  students_trend: z.number(),
  total_staff: z.number(),
  staff_trend: z.number(),
  total_revenue: z.number(),
  revenue_trend: z.number(),
  attendance_rate: z.number(),
  attendance_trend: z.number(),
});

export const trendPointVM = z.object({ month: z.string(), value: z.number() });

export const classPerformanceVM = z.object({
  class_id: z.string(),
  class_name: z.string(),
  level: z.string(),
  students: z.number(),
  average_score: z.number().nullable(),
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
export type TrendPointVM = z.infer<typeof trendPointVM>;
export type ClassPerformanceVM = z.infer<typeof classPerformanceVM>;
export type RecentActivityVM = z.infer<typeof recentActivityVM>;
export type UpcomingEventVM = z.infer<typeof upcomingEventVM>;
