"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppRouter } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

/**
 * Client-side session. Wraps Supabase auth plus the caller's `profiles` row behind the
 * `{ profile, isLoading, signOut }` contract the app shell and every portal already consume.
 *
 * Two effects, deliberately not one: the auth listener only records WHO is signed in, and a second
 * effect fetches their profile. Supabase warns against awaiting inside an `onAuthStateChange`
 * callback, the client serialises auth operations, so a query awaited in the callback can deadlock
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
  const router = useAppRouter();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<UserId>(undefined);
  const [fetched, setFetched] = useState<FetchedProfile | null>(null);
  // The identity the cached React Query data belongs to, so a change of account can drop it.
  const cacheOwnerRef = useRef<UserId>(undefined);

  useEffect(() => {
    const supabase = createClient();
    // onAuthStateChange fires INITIAL_SESSION on subscribe, so this covers the first read too,
    // no separate getUser() call, and therefore no race between the two.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextId = session?.user?.id ?? null;

      // React Query keys are not per-user, and its cache outlives a sign-out (the QueryClient is
      // created once in app/providers.tsx). On a shared front-desk machine that means the next person
      // to sign in would briefly see the previous user's children, results and fees rendered from
      // stale cache. Drop every cached query whenever the signed-in identity actually changes,
      // sign-out (-> null) and account switch (one id -> another) alike. clear() is synchronous, so
      // this stays safe inside the auth callback (which must not await). The first INITIAL_SESSION
      // (undefined -> id|null) seeds the owner without clearing an already-empty cache.
      const owner = cacheOwnerRef.current;
      if (owner !== undefined && owner !== nextId) {
        queryClient.clear();
      }
      cacheOwnerRef.current = nextId;

      setUserId(nextId);
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Only the signed-IN case needs an effect. The signed-out case is derived below instead of being
  // written to state, which keeps this effect free of a synchronous setState.
  useEffect(() => {
    if (typeof userId !== "string") return;

    let active = true;
    (async () => {
      const supabase = createClient();
      // Retry a failed profile read before giving up. Previously any error here (a dropped request on
      // a flaky Ghanaian school connection, a momentary Supabase blip) resolved to `data: null`, which
      // the guard reads as "no profile" and bounces a legitimately-signed-in user to /login mid-task.
      // Only a SUCCESSFUL read with no row is a real "not provisioned"; a transient failure keeps the
      // last known state so the session survives the blip and the next event retries.
      for (let attempt = 0; attempt < 3 && active; attempt++) {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
        if (!active) return;
        if (!error) {
          setFetched({ forUserId: userId, profile: data ?? null });
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
      }
      // Every attempt failed: keep any state we already had for this user rather than forcing a logout.
      if (active) setFetched((prev) => prev ?? { forUserId: userId, profile: null });
    })();

    return () => {
      active = false;
    };
  }, [userId]);

  const signOut = useCallback(async () => {
    await createClient().auth.signOut();
    // Eagerly here too, not only via the auth listener: drop the outgoing user's cached data before
    // the /login navigation so none of it can flash on the way out.
    queryClient.clear();
    router.push("/login");
  }, [router, queryClient]);

  // An auth user with no profile row can't be scoped to a school or a role, so there is nothing
  // safe to render; it stays null and the guard sends them to /login.
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
