import { createClient } from "@/lib/supabase/client";

/**
 * Shared plumbing for the read layer.
 *
 * Every `lib/data/*` function is consumed by a React Query hook (`lib/queries/*`), so these run in
 * the BROWSER against PostgREST, carrying the user's session cookie. That is deliberate, not a
 * shortcut: RLS is the security boundary (golden rule 2), so a client-side read is exactly as safe
 * as a server-side one and gets caching, background refetch and optimistic updates for free.
 *
 * Nothing here passes `school_id` — RLS derives it from `auth.uid()` via `current_school_id()`.
 * A read that filters by school in application code would be both redundant and a lie about where
 * tenancy is enforced.
 */
export const db = () => createClient();

/**
 * The active academic year's id, or null while none is active (mid-rollover, or a tenant not yet
 * configured). Every "current class" read scopes its enrollments to this year: promotion appends
 * one enrollment per year and never rewrites history (docs/05-USER-FLOWS.md §7), so without the
 * year filter a promoted student resolves to whichever of their years PostgREST returns first.
 * Callers treat null as "don't filter" — the single-year behaviour — rather than blanking every
 * roster in a tenant that has no active year to scope by.
 */
export async function activeYearId(): Promise<string | null> {
  const res = await db().from("academic_years").select("id").eq("is_active", true).maybeSingle();
  return unwrapMaybe<{ id: string }>(res, "active year")?.id ?? null;
}

interface PostgrestResult<T> {
  data: T | null;
  // `code` is optional here so the same shape accepts both PostgrestError (which always has one)
  // and the plain `{ data: [], error: null }` placeholders used for conditionally-skipped queries.
  error: { message: string; code?: string } | null;
}

/**
 * Unwrap a PostgREST result, throwing on failure.
 *
 * Throwing is the point: React Query turns a rejected queryFn into the `error` state that every
 * screen already renders (golden rule 4). Returning a fallback on error would paint an empty state
 * over a real failure and quietly hide outages.
 */
export function unwrap<T>(res: PostgrestResult<T>, context: string): T {
  if (res.error) throw new Error(`${context}: ${res.error.message}`);
  if (res.data === null) throw new Error(`${context}: no data returned`);
  return res.data;
}

/** Unwrap a list read, treating null as empty — "no rows" is a valid, non-exceptional answer. */
export function unwrapList<T>(res: PostgrestResult<T[]>, context: string): T[] {
  if (res.error) throw new Error(`${context}: ${res.error.message}`);
  return res.data ?? [];
}

/**
 * Unwrap a single-row read where "not found" is expected (a detail page for a deleted record).
 * PGRST116 is PostgREST's "0 rows returned for .single()" — a legitimate null, not an error.
 */
export function unwrapMaybe<T>(res: PostgrestResult<T>, context: string): T | null {
  if (res.error) {
    if (res.error.code === "PGRST116") return null;
    throw new Error(`${context}: ${res.error.message}`);
  }
  return res.data;
}

/** RPCs that return `returns table(...)` come back as an array of one row. */
export function unwrapSingleRow<T>(res: PostgrestResult<T[]>, context: string): T | null {
  const rows = unwrapList(res, context);
  return rows[0] ?? null;
}
