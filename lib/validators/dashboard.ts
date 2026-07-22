import { z } from "zod";

export const dashboardStatsVM = z.object({
  total_students: z.number(),
  total_staff: z.number(),
  total_revenue: z.number(),
  attendance_rate: z.number(),
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
