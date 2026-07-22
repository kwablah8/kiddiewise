import type { Database } from "@/lib/supabase/types";

type Tables = Database["public"]["Tables"];
type Fns = Database["public"]["Functions"];

export type Student = Tables["students"]["Row"];
export type Profile = Tables["profiles"]["Row"];
export type ClassRow = Tables["classes"]["Row"];
export type DashboardStats = Fns["dashboard_stats"]["Returns"][number];
export type EnrollmentTrendPoint = Fns["enrollment_trend"]["Returns"][number];
export type FeeTrendPoint = Fns["fee_collection_trend"]["Returns"][number];
export type ClassPerformanceRow = Fns["class_performance"]["Returns"][number];
// …extend per slice as screens need row types.
