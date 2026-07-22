export const queryKeys = {
  sidebar: {
    counts: ["sidebar", "counts"] as const,
  },
  dashboard: {
    stats: ["dashboard", "stats"] as const,
    trends: ["dashboard", "trends"] as const,
    feeTrend: ["dashboard", "fee-trend"] as const,
    enrollmentTrend: ["dashboard", "enrollment-trend"] as const,
    classPerformance: ["dashboard", "class-performance"] as const,
    recentActivities: ["dashboard", "recent-activities"] as const,
    upcomingEvents: ["dashboard", "upcoming-events"] as const,
  },
  students: {
    all: ["students"] as const,
    detail: (id: string) => ["students", id] as const,
  },
  parents: {
    all: ["parents"] as const,
  },
  classes: {
    options: ["classes", "options"] as const,
  },
} as const;
