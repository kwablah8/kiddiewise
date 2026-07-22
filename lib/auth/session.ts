import type { Profile } from "@/lib/types";

// SEAM: replace with Supabase auth. In the real integration this constant disappears —
// `useSession` will call `supabase.auth.getUser()` and fetch the matching `profiles` row
// by `auth.uid()` instead of returning a hardcoded profile.
export const mockAdminProfile: Profile = {
  id: "00000000-0000-0000-0000-000000000001",
  school_id: "00000000-0000-0000-0000-0000000000a1",
  first_name: "Ama",
  last_name: "Mensah",
  email: "ama.mensah@greenfield.edu.gh",
  role: "school_admin",
  phone: "+233 24 555 0110",
  department: null,
  staff_no: "ADM-1",
  avatar_url: null,
  is_active: true,
  created_at: "2026-01-05T08:00:00Z",
};

const SESSION_STORAGE_KEY = "sm.mockSession";

// SEAM: replace with Supabase's real session persistence (cookies via @supabase/ssr).
// This is a client-only flag standing in for "is there an active auth session".
export function isMockSessionActive(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SESSION_STORAGE_KEY) === "1";
}

// SEAM: replace with the real sign-in call (`supabase.auth.signInWithPassword`).
export function setMockSessionActive(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, "1");
}

// SEAM: replace with `supabase.auth.signOut()`.
export function clearMockSessionActive(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}
