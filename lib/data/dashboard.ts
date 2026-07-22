import { simulate } from "./_devState";
import * as fx from "@/lib/mock/fixtures";
import type {
  DashboardStatsVM,
  DashboardTrendsVM,
  TrendPointVM,
  ClassPerformanceVM,
  RecentActivityVM,
  UpcomingEventVM,
} from "@/lib/validators/dashboard";

export const getDashboardStats = (): Promise<DashboardStatsVM> =>
  simulate(fx.mockDashboardStats, {
    total_students: 0,
    total_staff: 0,
    total_revenue: 0,
    attendance_rate: 0,
  });

// SEAM: no RPC supplies month-over-month deltas yet — integration must add a dashboard_trends
// RPC (or extend dashboard_stats). See docs/superpowers/plans/FOLLOWUPS.md
export const getDashboardTrends = (): Promise<DashboardTrendsVM> =>
  simulate(fx.mockDashboardTrends, { students: 0, staff: 0, revenue: 0, attendance: 0 });
export const getFeeTrend = (): Promise<TrendPointVM[]> => simulate(fx.mockFeeTrend, []);
export const getEnrollmentTrend = (): Promise<TrendPointVM[]> =>
  simulate(fx.mockEnrollmentTrend, []);
export const getClassPerformance = (): Promise<ClassPerformanceVM[]> =>
  simulate(fx.mockClassPerformance, []);
export const getRecentActivities = (): Promise<RecentActivityVM[]> =>
  simulate(fx.mockRecentActivities, []);
export const getUpcomingEvents = (): Promise<UpcomingEventVM[]> =>
  simulate(fx.mockUpcomingEvents, []);
