import { z } from "zod";

// Mirrors the real `dashboard_stats(school_id)` RPC (docs/03-DATABASE §12) exactly — four bare
// totals, no comparison figures — so integration is a clean swap, not a seam break.
export const dashboardStatsVM = z.object({
  total_students: z.number(),
  total_staff: z.number(),
  total_revenue: z.number(),
  attendance_rate: z.number(),
});

// SEAM: no RPC supplies month-over-month deltas yet — this is a separate, honestly-named node
// (not folded into dashboardStatsVM) so it's obvious at a glance which fields the real RPC
// backs today and which are still a follow-up. See docs/superpowers/plans/FOLLOWUPS.md. Each
// field is a signed percent delta vs last month, feeding the stat-card trend pills
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
export type RecentActivityVM = z.infer<typeof recentActivityVM>;
export type UpcomingEventVM = z.infer<typeof upcomingEventVM>;
