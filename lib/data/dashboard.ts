import { simulate } from "./_devState";
import * as fx from "@/lib/mock/fixtures";
import type {
  DashboardStatsVM,
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
export const getFeeTrend = (): Promise<TrendPointVM[]> => simulate(fx.mockFeeTrend, []);
export const getEnrollmentTrend = (): Promise<TrendPointVM[]> =>
  simulate(fx.mockEnrollmentTrend, []);
export const getClassPerformance = (): Promise<ClassPerformanceVM[]> =>
  simulate(fx.mockClassPerformance, []);
export const getRecentActivities = (): Promise<RecentActivityVM[]> =>
  simulate(fx.mockRecentActivities, []);
export const getUpcomingEvents = (): Promise<UpcomingEventVM[]> =>
  simulate(fx.mockUpcomingEvents, []);
