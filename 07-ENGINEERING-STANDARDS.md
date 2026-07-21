# 07 — Engineering Standards

Version 1.0 · Status: Planning / MVP

How we write and organise code. The goal is production-quality software a senior engineer
would sign off on — clean, modular, maintainable, and boring in the best way.

---

## 1. Language & typing

- **TypeScript everywhere.** `strict` mode on. **No `any`** — use `unknown` + narrowing, or
  fix the type.
- Types flow from two sources of truth: **generated Supabase types** (from the live schema)
  and **Zod schemas**. Application types are inferred from these, not hand-duplicated.
- Regenerate DB types whenever the schema changes; commit them so app and DB never drift.

---

## 2. Project conventions

- **File/folder naming:** kebab-case for files and route segments; PascalCase for components;
  camelCase for functions/variables; UPPER_SNAKE for constants.
- **Feature-first organisation:** group by domain (students, attendance, results…), not by
  file type. Shared primitives live in `components/ui`, cross-cutting logic in `lib/`.
- **Where things live** (see `CLAUDE.md` §5):
  - `lib/validators/` — Zod schemas (source of truth for shapes)
  - `lib/queries/` — React Query hooks + data access
  - `lib/supabase/` — clients + generated types
  - `lib/permissions/` — role/scope helpers mirroring RLS
  - `supabase/migrations/` — schema + RLS (the DB source of truth)
- **No business logic in components.** Components render and dispatch; logic lives in
  `lib/`, server actions, or the database.

---

## 3. Data layer

- **Reads:** Server Components for first paint; React Query for interactive/paginated data.
  Centralise query keys and hooks in `lib/queries/` — never scatter raw Supabase calls
  through components.
- **Writes:** Server Actions (or route handlers) validated by Zod before hitting Supabase;
  on success, invalidate the relevant query keys / revalidate the route.
- **Never trust the client for `school_id`** — the server/DB derives it from the session.
- **Privileged operations** (account provisioning, batch report generation) run server-side
  with the service-role key only; verify the caller's authority in code before acting.
- Prefer **DB views / RPC** for aggregates (dashboard stats, trends) over client-side math.

---

## 4. Validation & error handling

- **Zod at every boundary:** form input, server action input, and API payloads. Infer TS
  types from the schema (`z.infer`).
- **Fail loudly server-side, gracefully client-side.** Map errors to human messages; never
  surface raw errors or stack traces to users.
- Every mutation path handles: validation failure, permission/RLS rejection, network/DB
  error, and success — matching the four UI states in `docs/06-UI-UX-STANDARDS.md`.
- Preserve user input on error; never wipe a form because a save failed.

---

## 5. Components & styling

- Small, composable, single-responsibility components. Extract when a pattern repeats a
  third time — not before (avoid premature abstraction).
- Use **shadcn/ui** primitives as the base; theme them to the design tokens rather than
  overriding ad hoc. No inline one-off colors outside the token set.
- Tailwind utility classes; extract to a component (not a soup of `@apply`) when a pattern
  recurs. Keep class lists readable.
- Every list/table/dashboard implements loading (skeleton), empty, error, and success states.

---

## 6. Dependencies

- The stack in `CLAUDE.md` §3 is the allowed set. **Adding a dependency requires a written
  reason** in the relevant doc and sign-off.
- Prefer platform primitives (Supabase, Next.js, the standard library) over new packages.
- No unmaintained, oversized, or single-use dependencies for things we can write in a few
  lines.

---

## 7. Testing (pragmatic for MVP)

- **RLS is tested first-class:** for each sensitive table, verify a user from School A cannot
  read/write School B's rows, and that role scopes hold (teacher can't touch unassigned
  classes; parent can't see unlinked children). These tests are the safety net for the whole
  tenancy model.
- **Zod schemas** get unit tests for the tricky validation rules.
- **Critical flows** (attendance marking, result submission, promotion, payment recording)
  get at least a happy-path + one failure-path test.
- Full UI test coverage is not an MVP goal; correctness of data boundaries is.

---

## 8. Git & workflow

- **Small, focused commits** with clear messages (conventional-commit style encouraged:
  `feat:`, `fix:`, `chore:`, `docs:`).
- **Feature branches**, PRs reviewed against the golden rules in `CLAUDE.md` §4 and the
  definition of done in §8.
- Schema changes are **migrations only** — never hand-edit the database via the dashboard.
- Keep `CLAUDE.md` and `/docs` truthful: if reality diverges from a doc, update the doc in
  the same change.

---

## 9. Performance & quality

- Query only what a screen needs; paginate lists; index by `school_id` and common filters.
- Use skeletons to keep perceived performance high; avoid layout shift.
- Optimise images (Next.js image handling) for photos and gallery.
- No console noise, no dead code, no commented-out blocks left behind.

---

## 10. Definition of done (repeat of the contract)

A feature is done only when: data model + RLS migration applied; Zod schema + generated
types in place; all four UI states implemented; tenancy verified (no cross-school leakage);
responsive; typed with no `any`; and consistent with the design system. See `CLAUDE.md` §8.
