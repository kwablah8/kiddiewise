"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";
import { clearMockSessionActive, isMockSessionActive, mockAdminProfile } from "./session";

// SEAM: replace with Supabase auth. This whole module becomes a thin wrapper around
// `supabase.auth.getUser()` / `onAuthStateChange` + a `profiles` fetch; the context shape
// (`{ profile, isLoading, signOut }`) is the final, stable interface consumers rely on.

type SyncState = "loading" | "signed-in" | "signed-out";

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getSnapshot(): SyncState {
  return isMockSessionActive() ? "signed-in" : "signed-out";
}

// The server never knows the client's localStorage flag — render "loading" until the
// client has synced, which is what drives the (app) layout's full-page skeleton.
function getServerSnapshot(): SyncState {
  return "loading";
}

interface SessionContextValue {
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function signOut() {
    // SEAM: replace with `supabase.auth.signOut()`.
    clearMockSessionActive();
    router.push("/login");
  }

  const value: SessionContextValue = {
    profile: state === "signed-in" ? mockAdminProfile : null,
    isLoading: state === "loading",
    signOut,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}
