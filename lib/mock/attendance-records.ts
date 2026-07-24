import type { AttendanceStatus } from "@/lib/validators/attendance";

// Mirrors the 0007 `attendance` table minus tenant/audit columns (school_id/created_at/updated_at).
export interface AttendanceRecord {
  student_id: string;
  class_id: string;
  term_id: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  marked_by: string | null;
}
