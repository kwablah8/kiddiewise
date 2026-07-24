import type { Profile } from "@/lib/types";

// SEAM: replace with Supabase auth. In the real integration these constants disappear — `useSession`
// calls `supabase.auth.getUser()` and fetches the matching `profiles` row by `auth.uid()`.
export const mockAdminProfile: Profile = {
  id: "00000000-0000-0000-0000-000000000001",
  school_id: "00000000-0000-0000-0000-0000000000a1",
  first_name: "Ama",
  last_name: "Mensah",
  email: "admin@school.com",
  role: "school_admin",
  phone: "+233 24 555 0110",
  department: null,
  staff_no: "ADM-1",
  avatar_url: null,
  is_active: true,
  created_at: "2026-01-05T08:00:00Z",
};

// Mirrors the `stf-01` staff fixture. id === "stf-01" ON PURPOSE so class_subjects.teacher_id and
// classes.class_teacher_id resolve to this teacher (mock-only; post-Supabase, profiles.id IS the teacher).
export const mockTeacherProfile: Profile = {
  id: "stf-01",
  school_id: "00000000-0000-0000-0000-0000000000a1",
  first_name: "Efua",
  last_name: "Owusu",
  email: "teacher@school.com",
  role: "teacher",
  phone: "+233 24 100 1001",
  department: "Mathematics",
  staff_no: "TCH-1",
  avatar_url: null,
  is_active: true,
  created_at: "2026-01-05T08:00:00Z",
};

// Mirrors the `prt-01` guardian fixtures (Yaw Mensah, guardian of stu-01 + stu-02). id === "prt-01"
// ON PURPOSE so student_guardians links resolve (mock-only; post-Supabase, profiles.id IS the parent).
export const mockParentProfile: Profile = {
  id: "prt-01",
  school_id: "00000000-0000-0000-0000-0000000000a1",
  first_name: "Yaw",
  last_name: "Mensah",
  email: "parent@school.com",
  role: "parent",
  phone: "+233 24 111 2222",
  department: null,
  staff_no: null,
  avatar_url: null,
  is_active: true,
  created_at: "2026-01-05T08:00:00Z",
};

export type MockRole = "school_admin" | "teacher" | "parent";

const MOCK_PROFILES: Record<MockRole, Profile> = {
  school_admin: mockAdminProfile,
  teacher: mockTeacherProfile,
  parent: mockParentProfile,
};

export function profileForMockRole(role: MockRole): Profile {
  return MOCK_PROFILES[role];
}

// Demo-login helper: which mock identity a typed email signs in as (default admin). SEAM: the real login
// learns the role from the fetched `profiles` row, not from the email.
export function mockRoleForEmail(email: string): MockRole {
  const e = email.trim().toLowerCase();
  if (e === mockTeacherProfile.email) return "teacher";
  if (e === mockParentProfile.email) return "parent";
  return "school_admin";
}

const SESSION_STORAGE_KEY = "sm.mockSession";

// SEAM: client-only stand-in for "is there an active auth session, and as whom". Stores the active role.
export function setMockSessionActive(role: MockRole = "school_admin"): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, role);
}

export function activeMockRole(): MockRole | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (v === "school_admin" || v === "teacher" || v === "parent") return v;
  if (v === "1") return "school_admin"; // migrate the legacy boolean flag
  return null;
}

// SEAM: replace with `supabase.auth.signOut()`.
export function clearMockSessionActive(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}
