export const queryKeys = {
  school: {
    current: ["school", "current"] as const,
  },
  sidebar: {
    counts: ["sidebar", "counts"] as const,
  },
  promotion: {
    candidates: (classId: string, yearId: string) =>
      ["promotion", "candidates", classId, yearId] as const,
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
    stats: ["students", "stats"] as const,
    academics: (id: string) => ["students", id, "academics"] as const,
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
    mine: (teacherId: string) => ["assessments", "mine", teacherId] as const,
    scoreSheet: (id: string) => ["assessments", id, "score-sheet"] as const,
  },
  teacher: {
    dashboard: (teacherId: string) => ["teacher", "dashboard", teacherId] as const,
    classes: (teacherId: string) => ["teacher", "classes", teacherId] as const,
  },
  attendance: {
    roster: (classId: string, date: string) => ["attendance", "roster", classId, date] as const,
  },
  fees: {
    overview: (filter: unknown) => ["fees", "overview", filter] as const,
    structures: (filter: unknown) => ["fees", "structures", filter] as const,
    payments: (filter: unknown) => ["fees", "payments", filter] as const,
    classFees: (filter: unknown) => ["fees", "class-fees", filter] as const,
    extraStructures: (filter: unknown) => ["fees", "extra-structures", filter] as const,
    extraAssignments: (filter: unknown) => ["fees", "extra-assignments", filter] as const,
  },
  reports: {
    sheet: (classId: string, termId: string) => ["reports", "sheet", classId, termId] as const,
  },
  parent: {
    children: ["parent", "children"] as const,
    announcements: ["parent", "announcements"] as const,
    child: (id: string) => ["parent", "child", id] as const,
    attendance: (id: string) => ["parent", "attendance", id] as const,
    results: (id: string) => ["parent", "results", id] as const,
    report: (id: string) => ["parent", "report", id] as const,
  },
} as const;
