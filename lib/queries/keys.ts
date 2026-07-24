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
  academics: {
    years: ["academics", "years"] as const,
    terms: (yearId?: string) => ["academics", "terms", yearId ?? null] as const,
    activeContext: ["academics", "active-context"] as const,
    classes: ["academics", "classes"] as const,
    class: (id: string) => ["academics", "classes", id] as const,
    subjects: ["academics", "subjects"] as const,
    staff: ["academics", "staff"] as const,
    staffMember: (id: string) => ["academics", "staff", id] as const,
    assignments: (classId: string) => ["academics", "assignments", classId] as const,
    assignmentsByStaff: (staffId: string) =>
      ["academics", "assignments", "by-staff", staffId] as const,
  },
  inquiries: {
    all: ["inquiries"] as const,
    detail: (id: string) => ["inquiries", id] as const,
  },
  grading: {
    bands: ["grading", "bands"] as const,
    types: ["grading", "types"] as const,
  },
  assessments: {
    list: (filters: unknown) => ["assessments", "list", filters] as const,
    detail: (id: string) => ["assessments", id] as const,
  },
  teacher: {
    dashboard: (teacherId: string) => ["teacher", "dashboard", teacherId] as const,
  },
  parent: {
    children: ["parent", "children"] as const,
    announcements: ["parent", "announcements"] as const,
  },
} as const;
