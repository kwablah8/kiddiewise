"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import * as data from "@/lib/data/dashboard";

export const useDashboardStats = () =>
  useQuery({ queryKey: queryKeys.dashboard.stats, queryFn: data.getDashboardStats });
export const useFeeTrend = () =>
  useQuery({ queryKey: queryKeys.dashboard.feeTrend, queryFn: data.getFeeTrend });
export const useEnrollmentTrend = () =>
  useQuery({ queryKey: queryKeys.dashboard.enrollmentTrend, queryFn: data.getEnrollmentTrend });
export const useClassPerformance = () =>
  useQuery({ queryKey: queryKeys.dashboard.classPerformance, queryFn: data.getClassPerformance });
export const useRecentActivities = () =>
  useQuery({ queryKey: queryKeys.dashboard.recentActivities, queryFn: data.getRecentActivities });
export const useUpcomingEvents = () =>
  useQuery({ queryKey: queryKeys.dashboard.upcomingEvents, queryFn: data.getUpcomingEvents });
