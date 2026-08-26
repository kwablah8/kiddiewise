/**
 * Client-side list filtering, shared by every searchable table.
 *
 * Client-side on purpose. These lists are a single school's, tens of staff, a few hundred parents,
 * a dozen subjects, and React Query already holds the rows. Filtering in the browser is instant,
 * costs no round-trip, and works offline-ish on the flaky connections these screens are used over.
 * The students list is the one exception: it searches server-side because a roster is the one table
 * that genuinely grows, and its query is already paginated.
 *
 * Kept here rather than inline in each table so that "search" means the same thing everywhere, an
 * admin who learns that typing two words narrows the staff list should not find the fees list
 * behaving differently.
 */

/**
 * Does a row match what was typed?
 *
 * Every term must appear somewhere in the row, but not necessarily in the same field and not in
 * order, so "ama men" finds "Ama Mensah", and "mensah ama" finds her too. Matching whole-query-
 * as-one-substring would fail both, which is exactly what people type when they half-remember a
 * name. Nulls are skipped rather than stringified, so an empty phone column never matches "null".
 */
export function matchesQuery(query: string, ...fields: (string | number | null | undefined)[]) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const haystack = fields
    .filter((f) => f !== null && f !== undefined)
    .map((f) => String(f).toLowerCase())
    .join(" ");

  return terms.every((term) => haystack.includes(term));
}
