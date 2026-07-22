export const queryKeys = {
  dashboard: {
    stats: ["dashboard", "stats"] as const,
    feeTrend: ["dashboard", "fee-trend"] as const,
    enrollmentTrend: ["dashboard", "enrollment-trend"] as const,
    classPerformance: ["dashboard", "class-performance"] as const,
    recentActivities: ["dashboard", "recent-activities"] as const,
    upcomingEvents: ["dashboard", "upcoming-events"] as const,
  },
} as const;
