import { db, unwrapList, unwrapSingleRow } from "./_client";
import type {
  DashboardStatsVM,
  DashboardTrendsVM,
  TrendPointVM,
  ClassPerformanceVM,
  RecentActivityVM,
  UpcomingEventVM,
} from "@/lib/validators/dashboard";

// The dashboard reads almost entirely through RPCs rather than table queries. Aggregates over the
// whole school (totals, rates, per-class averages) are the one place a round trip per row would be
// indefensible, and Postgres computes them in one pass under the caller's own RLS.

const ZERO_STATS: DashboardStatsVM = {
  total_students: 0,
  total_staff: 0,
  total_revenue: 0,
  attendance_rate: 0,
};

export async function getDashboardStats(): Promise<DashboardStatsVM> {
  const row = unwrapSingleRow(await db().rpc("dashboard_stats"), "dashboard_stats");
  if (!row) return ZERO_STATS;
  // numeric comes back as string over the wire; the VM contracts numbers.
  return {
    total_students: Number(row.total_students),
    total_staff: Number(row.total_staff),
    total_revenue: Number(row.total_revenue),
    attendance_rate: Number(row.attendance_rate),
  };
}

export async function getDashboardTrends(): Promise<DashboardTrendsVM> {
  const row = unwrapSingleRow(await db().rpc("dashboard_trends"), "dashboard_trends");
  if (!row) return { students: 0, staff: 0, revenue: 0, attendance: 0 };
  return {
    students: Number(row.students),
    staff: Number(row.staff),
    revenue: Number(row.revenue),
    attendance: Number(row.attendance),
  };
}

export async function getFeeTrend(): Promise<TrendPointVM[]> {
  const rows = unwrapList(await db().rpc("fee_collection_trend"), "fee_collection_trend");
  return rows.map((r) => ({ month: r.month, value: Number(r.total) }));
}

export async function getEnrollmentTrend(): Promise<TrendPointVM[]> {
  const rows = unwrapList(await db().rpc("enrollment_trend"), "enrollment_trend");
  return rows.map((r) => ({ month: r.month, value: Number(r.count) }));
}

export async function getClassPerformance(): Promise<ClassPerformanceVM[]> {
  const rows = unwrapList(await db().rpc("class_performance"), "class_performance");
  return rows.map((r) => ({
    class_id: r.class_id,
    class_name: r.class_name,
    level: r.level,
    students: Number(r.students),
    // Null when a class has no submitted results yet, the chart renders that as a gap rather
    // than as a zero, which would read as "they all failed".
    average_score: r.average_score === null ? null : Number(r.average_score),
  }));
}

export async function getRecentActivities(): Promise<RecentActivityVM[]> {
  const rows = unwrapList(
    await db()
      .from("activity_log")
      .select("id, action, entity_type, created_at, actor:profiles(first_name, last_name)")
      .order("created_at", { ascending: false })
      .limit(8),
    "recent activities",
  );

  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    entity_type: r.entity_type,
    // actor_id is nullable (the profile may have been deleted), and the feed still needs a subject.
    actor_name: r.actor ? `${r.actor.first_name} ${r.actor.last_name}` : "A former staff member",
    created_at: r.created_at,
  }));
}

export async function getUpcomingEvents(): Promise<UpcomingEventVM[]> {
  const rows = unwrapList(
    await db()
      .from("events")
      .select("id, title, start_at, location")
      // Upcoming only, a dashboard card listing last term's sports day is noise.
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(5),
    "upcoming events",
  );
  return rows;
}
