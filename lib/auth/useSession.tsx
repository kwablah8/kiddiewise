"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

/**
 * Client-side session. Wraps Supabase auth plus the caller's `profiles` row behind the
 * `{ profile, isLoading, signOut }` contract the app shell and every portal already consume.
 *
 * Two effects, deliberately not one: the auth listener only records WHO is signed in, and a second
 * effect fetches their profile. Supabase warns against awaiting inside an `onAuthStateChange`
 * callback — the client serialises auth operations, so a query awaited in the callback can deadlock
 * against the very token refresh that triggered it. Splitting them keeps the callback synchronous.
 */

interface SessionContextValue {
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

// undefined = we haven't heard from the auth listener yet · null = definitively signed out.
type UserId = string | null | undefined;

// The fetched profile is tagged with the user it belongs to. Without that tag, switching accounts
// would briefly render the previous user's profile against the new session.
interface FetchedProfile {
  forUserId: string;
  profile: Profile | null;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [userId, setUserId] = useState<UserId>(undefined);
  const [fetched, setFetched] = useState<FetchedProfile | null>(null);

  useEffect(() => {
    const supabase = createClient();
    // onAuthStateChange fires INITIAL_SESSION on subscribe, so this covers the first read too —
    // no separate getUser() call, and therefore no race between the two.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Only the signed-IN case needs an effect. The signed-out case is derived below instead of being
  // written to state, which keeps this effect free of a synchronous setState.
  useEffect(() => {
    if (typeof userId !== "string") return;

    let active = true;
    createClient()
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        if (active) setFetched({ forUserId: userId, profile: data ?? null });
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const signOut = useCallback(async () => {
    await createClient().auth.signOut();
    router.push("/login");
  }, [router]);

  // An auth user with no profile row can't be scoped to a school or a role, so there is nothing
  // safe to render — it stays null and the guard sends them to /login.
  const isCurrent = typeof userId === "string" && fetched?.forUserId === userId;

  const value: SessionContextValue = {
    profile: isCurrent ? fetched.profile : null,
    // Loading until the auth listener has spoken, and then until this user's profile has arrived.
    isLoading: userId === undefined || (userId !== null && !isCurrent),
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
