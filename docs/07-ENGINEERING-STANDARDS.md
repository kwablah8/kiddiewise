# 07 — Engineering Standards

Version 1.1 · Status: reflects the wired backend

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
- **Where things live** (see the layout section of `README.md`), one responsibility per layer:
  - `lib/validators/` — Zod schemas: source of truth for shapes (view-models **and** write
    inputs). Types are `z.infer`red, never hand-written.
  - `lib/data/` — **reads**: PostgREST queries returning view-models, doing all joins/derivation
    here. Runs in the browser; RLS scopes it. Shared helpers in `lib/data/_client.ts`.
  - `lib/actions/` — **writes**: Server Actions (`"use server"`) that validate then persist. No
    read/derive logic. Shared plumbing (tenant context, error translation, provisioning) in
    `lib/actions/_server.ts`, which is `server-only`.
  - `lib/queries/` — React Query hooks + **centralized query keys** (`lib/queries/keys.ts`);
    the only data layer a component imports.
  - `lib/<domain>.ts` — **pure business logic** (grading, attendance, routing), unit-tested.
  - `lib/toast.tsx` — the ONLY toast entry point. Components never import a toast library directly,
    so the implementation can be swapped in one file.
  - `lib/supabase/` — clients + generated types · `lib/auth/` — session + access helpers ·
    `lib/permissions/` — role/scope helpers mirroring RLS.
  - `supabase/migrations/` — schema + RLS (the DB source of truth).
- **No business logic in components.** Components render and dispatch; logic lives in `lib/`,
  server actions, or the database. A component reaches data **only** through a `lib/queries` hook —
  never `lib/data` or `lib/actions` directly.

---

## 3. Data layer

Data flows through **one seam**, each layer with a single job — this is how separation of
concerns is enforced in practice:

```
validators (Zod contracts)
  → data (read + derive)      → queries (hooks + keys)  → components   [reads]
  → actions (validate + write) → queries (mutation)      → components   [writes]
```

- **Reads (`lib/data/*`):** return view-models; do all joins and derived fields here (never in
  components). Copy-on-read so callers can't mutate the source. Server Components for first
  paint; React Query for interactive/paginated data. Query keys + hooks are centralised in
  `lib/queries/` — never scatter raw Supabase calls through components.
- **Writes (`lib/actions/*`):** validate input with **Zod first**, then persist. The hook that
  calls the action **invalidates the shared query keys** it affects on success (and revalidates
  the route for SSR reads). Actions don't read or derive.
- **Pure logic (`lib/<domain>.ts`):** business rules (grade derivation, roster building, access
  routing) live in pure, unit-tested helpers — not in data, actions, or components.
- **Cross-portal consistency is invalidation, not duplication.** Because portals are derived
  views of shared tables (`docs/02-ARCHITECTURE.md` §3), a write only needs to invalidate the
  affected keys; every other portal's view re-derives on its next fetch. Never write the same
  fact into two places to "keep them in sync." When a mutation spans domains, invalidate **all**
  affected key groups (e.g. `useLinkGuardian` invalidates both `students` and `parents`;
  `saveAttendance` invalidates `attendance`, which the parent summary and dashboard rate derive from).
- **Never trust the client for `school_id`** — the server/DB derives it from the session.
- **Privileged operations** (account provisioning, batch report generation) run server-side with
  the service-role key only; verify the caller's authority in code before acting.
- Prefer **DB views / RPC** for aggregates (dashboard stats, trends) over client-side math.
- **Derive, don't store — except for snapshots.** A result's grade is derived from the current bands
  on every read, so correcting the scale re-grades everything at once; `results.grade`/`remark` are
  therefore written as NULL. A terminal report is the opposite: it is the official record of a term,
  so its average, position and attendance ARE stored, frozen at generation, and must not drift when a
  teacher later edits a mark. Ask which kind of fact you have before choosing.
- **Regeneration must preserve human input.** PostgREST upserts replace the whole row, so anything a
  person typed (report remarks) or decided (`is_published`) has to be read and merged back in, or
  arithmetic silently destroys it.
- **An `!inner` embed requires read access to the embedded table.** A missing policy there returns
  zero rows rather than an error — the failure mode is a silently empty screen. Test the JOIN, not
  just the two tables (see `tests/rls/parent-scope.test.ts`).

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

- The stack listed in `README.md` is the allowed set. **Adding a dependency requires a written
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
- **Feature branches**, PRs reviewed against the conventions in `README.md` and the definition
  of done below.
- Schema changes are **migrations only**. Never hand-edit the database through the dashboard.
- Keep `README.md` and `/docs` truthful: if reality diverges from a doc, update the doc in the
  same change.

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
responsive; typed with no `any`; and consistent with the design system.
