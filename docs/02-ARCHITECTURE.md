# 02 — Architecture

Version 1.0 · Status: Planning / MVP

How the system is put together, how requests flow, and how multi-tenancy is enforced.

---

## 1. High-level shape

One **Next.js (App Router)** application talks to **Supabase** for auth, data, storage, and
background logic. There is no separate custom backend service in the MVP — Supabase *is* the
backend, and its Row Level Security (RLS) is the real trust boundary.

```
┌───────────────────────────────────────────────┐
│                Next.js app (Vercel)            │
│                                                │
│  (marketing)   (auth)        (app)             │
│   public       login/reset    admin / teacher  │
│   pages                       / parent subtrees│
│                                                │
│  Server Components ── read ──► Supabase (RLS)  │
│  Server Actions   ── write ─► Supabase (RLS)   │
│  Client Components ─ React Query ─► Supabase   │
└──────────────┬─────────────────────────────────┘
               │
        ┌──────▼───────────────────────────────┐
        │            Supabase                   │
        │  Postgres + RLS │ Auth │ Storage       │
        │  Realtime │ Edge Functions (svc role)  │
        └───────────────────────────────────────┘
```

**Why one app, not four:** the reference build serves every audience from one domain
(`/dashboard`, `/teacher/dashboard`, …). A single app means one auth session, one design
system, one deploy, and shared data-access code. Audiences are separated by **route groups**
and guarded by role, not by separate deployments. A separate Expo parent app is a future
track and will consume the same Supabase project.

---

## 2. Route structure

```
app/
  (marketing)/            # public, unauthenticated
    page.tsx              # home
    about/  admissions/  news/  gallery/  contact/
  (auth)/
    login/  reset-password/  update-password/
  (app)/                  # requires an authenticated session
    layout.tsx            # authed shell: resolves profile + role, renders sidebar
    dashboard/            # admin home
    students/  staff/  parents/  classes/  subjects/
    academic/             # years + terms
    admissions/  assessments/  fees/  grading/
    terminal-reports/  promotion/  announcements/  settings/
    teacher/              # staff portal (role: teacher)
      dashboard/  attendance/  grade/  assessment/
    parent/               # parent portal (role: parent)
      dashboard/  children/  attendance/  results/
```

Route groups (`(marketing)`, `(auth)`, `(app)`) don't affect the URL — they organise layouts
and access. The `(app)` layout resolves the current user's profile once and drives which
subtree and navigation the user sees.

---

## 3. Rendering & data-flow strategy

Default to **React Server Components** for reads and page shells; drop to **client
components** only where interactivity requires it (forms, tables with client state, realtime).

**Reads**
- Page-level, first-paint data → Server Components using the **server** Supabase client
  (reads through RLS with the user's session).
- Interactive / revalidating / paginated data → **React Query** hooks in client components,
  calling the **browser** Supabase client.

**Writes**
- Prefer **Server Actions** (or route handlers) that use the server Supabase client, so
  mutations run with the user's identity and pass through RLS. On success, revalidate the
  affected React Query keys / server cache.
- Every write validates input with a **Zod** schema before it touches the database
  (`docs/07-ENGINEERING-STANDARDS.md`).

**Privileged writes (service role)**
- A few operations need elevated rights the logged-in user doesn't have — e.g. an admin
  **creating login accounts** for teachers/parents, generating terminal reports across many
  rows, or computing platform-wide stats. These run **server-side only** via a Supabase
  **Edge Function** or a server action holding the service-role key. The service key never
  reaches the browser, and these paths still enforce tenancy in code (verify the caller is a
  school_admin for the target `school_id`).

### The data seam (current implementation)

Until Supabase is wired, every feature runs against a **typed in-memory seam** that mirrors the
architecture above one-to-one, so the swap is mechanical. The layers (full contract in
`docs/07-ENGINEERING-STANDARDS.md` §3):

`fixtures → store → lib/data (read + derive) → lib/queries (hooks + keys) → components`,
and for writes `component → lib/queries mutation → lib/actions (validate + persist)`.

- `lib/mock/` holds seed **fixtures** and a single in-memory **store** (the stand-in database),
  tagged `// SEAM:`; it resets on reload.
- `lib/data/*` returns **copies** of store rows (copy-on-read) and performs all **derivation**
  (joins, computed fields) — never the component. `lib/data/_devState.ts#simulate` fakes the four
  UI states via `?mockState=loading|empty|error`.
- `lib/actions/*` validate with Zod, then mutate the store.
- Pure business rules live in unit-tested `lib/<domain>.ts` helpers (e.g. `lib/attendance.ts`,
  `lib/grading.ts`).

Swapping to Supabase changes only the **bodies** of `lib/data/*` and `lib/actions/*` (plus the
`useSession` source). View-model shapes, Zod schemas, query keys, and every component stay put.

### Cross-portal data flow & consistency

The four portals are **views over one shared schema**, not four datasets — this is what makes the
app work together end to end:

- **Single source of truth.** Each fact is written once to its canonical table. A teacher marks
  `attendance`; that same table backs the parent's attendance percentage, the admin's class
  register, and the dashboard attendance rate. No fact is copied between portals.
- **Derive, don't duplicate.** Cross-cutting numbers (attendance %, class roll counts, averages,
  dashboard totals) are **derived on read** — via DB views/RPC (`docs/03-DATABASE.md` §12) or a
  pure `lib/` helper — so they can never drift from the rows they summarise.
- **RLS scopes each read.** The same query returns each caller their slice: a teacher sees their
  classes, a parent their children, an admin the whole school. One query, many scopes.
- **Writes propagate by invalidation, not cross-wiring.** A mutation invalidates the shared
  **query keys** it affects; every mounted view keyed on that data refetches. Portals never call
  into each other. For live cross-*user* updates, selective **Realtime** (§8) pushes the same
  invalidation.

**Worked example — a teacher saves attendance for a class:**

1. `saveAttendance` upserts `attendance` rows (one per student, unique `(student_id, date)`).
2. It invalidates the `["attendance", …]` keys.
3. Everything deriving from those rows updates: the teacher's roster reloads; the **parent**
   child-attendance summary/percentage updates; the **admin** class register and
   `dashboard_stats` attendance rate recompute. Nothing was written twice — each surface simply
   re-derives.

The same shape holds for results/grades (teacher enters → parent results view + admin terminal
report), enrollments (admin enrols → teacher roster + class counts), and announcements.

---

## 4. Supabase clients

Three ways the app talks to Supabase — never mix them up:

| Client | Runs in | Auth context | Use for |
|---|---|---|---|
| Browser client | Client components | User session (cookie) | React Query reads, realtime subscriptions |
| Server client | Server components / actions / route handlers | User session (from cookies) | SSR reads, user-scoped writes |
| Service client | Server-only (Edge Functions / trusted actions) | **Bypasses RLS** — full access | Account creation, admin-only batch ops |

Middleware refreshes the Supabase session on navigation and redirects unauthenticated users
away from `(app)` routes to `/login`.

---

## 5. Multi-tenancy (the core invariant)

Every tenant-owned row carries a `school_id`. A user's `school_id` and `role` live on their
`profiles` row, keyed to `auth.uid()`. RLS policies resolve the caller's school from their
profile and restrict every read/write to that school. Details and policy patterns in
`docs/03-DATABASE.md` and `docs/04-AUTH-AND-PERMISSIONS.md`.

The rule in one line: **the application never sends `school_id` from the client as a trust
signal — the database derives it from the authenticated user.**

`super_admin` is the only role that operates across schools, and only on platform-level
tables (managing schools, platform settings).

---

## 6. Authentication flow (summary)

1. User signs in with email/password via Supabase Auth → session cookie set.
2. Middleware keeps the session fresh and gates `(app)` routes.
3. The `(app)` layout loads the user's `profiles` row (role + school_id).
4. The user is routed to their portal: `school_admin`/`super_admin` → `/dashboard`,
   `teacher` → `/teacher/dashboard`, `parent` → `/parent/dashboard`.
5. RLS enforces data boundaries regardless of which URL is requested.

Full flows (reset, admin-provisioned accounts) in `docs/04-AUTH-AND-PERMISSIONS.md`.

---

## 7. Storage

Supabase Storage buckets:

| Bucket | Contents | Access |
|---|---|---|
| `avatars` | Student/staff/parent profile photos | Read: same school; write: admins (and self where allowed) |
| `school-logos` | School branding | Read: public (marketing); write: school_admin |
| `gallery` | Marketing gallery images | Read: public; write: school_admin |
| `reports` | Generated terminal report PDFs | Read: linked parent + school staff; write: service role |

Bucket policies mirror the RLS tenancy model. Store the object path in the relevant table;
never expose service-role signed URLs to the client beyond their needed lifetime.

---

## 8. Realtime (selective)

Realtime is used sparingly where live updates add real value: e.g. reflecting new
announcements or attendance updates without a manual refresh. It is not the default data
path — most screens use standard React Query fetch + revalidate. Subscriptions respect RLS.

---

## 9. Edge Functions (where used)

- **provision-user** — admin-triggered creation of teacher/parent auth accounts + profile
  rows, then an invite/reset email.
- **generate-terminal-report** — assemble a student's per-term report and write a PDF to the
  `reports` bucket.
- Aggregations for dashboard trends may run as SQL views / RPC rather than functions where
  possible; prefer database views for read aggregates.

---

## 10. Environments & configuration

- **Local:** Supabase local stack (or a dev project) + `next dev`.
- **Preview:** Vercel preview deploys against a staging Supabase project.
- **Production:** Vercel + production Supabase project.
- Secrets: Supabase URL + anon key are public-safe client config; the **service-role key and
  any provider secrets are server-only** and never bundled into client code.
- Database schema and RLS live in `supabase/migrations/` and are the source of truth —
  changes go through migrations, never hand-edited in the dashboard.

---

## 11. Deployment

- Web: **Vercel** (App Router, edge/runtime as appropriate).
- Data/auth/storage/functions: **Supabase**.
- Generated TypeScript types are produced from the live schema and committed, so the app and
  database types never drift (`docs/07-ENGINEERING-STANDARDS.md`).

---

## 12. Key architectural decisions (log)

| # | Decision | Rationale |
|---|---|---|
| A1 | Single Next.js app, route groups per audience | One session, one design system, shared data layer; matches reference build |
| A2 | Supabase as the whole backend; no bespoke API service | Speed + production-grade Postgres; avoids MVP backend complexity |
| A3 | RLS is the security boundary | Client is untrusted; UI gating is cosmetic |
| A4 | `school_id` derived server-side, never trusted from client | Prevents cross-tenant leakage |
| A5 | Server Components for reads, Server Actions for writes, React Query for interactive data | Fast first paint, simple mutations, good client UX |
| A6 | Service-role work isolated to server/Edge Functions | Keeps privileged key off the client |
| A7 | Responsive web only for MVP; Expo app later on same Supabase project | Focus; reuse backend |
| A8 | Typed in-memory mock seam (`lib/mock` + `lib/data`/`lib/actions`) with `// SEAM:` markers | Build UI now; swap to Supabase by replacing read/write bodies only, no component churn |
| A9 | One source of truth per fact; portals are derived, RLS-scoped views — never copies | Cross-portal consistency for free; a single write reflects everywhere |
| A10 | Cross-cutting numbers derived on read (DB view/RPC or pure `lib/` helper), never stored twice | Aggregates can't drift from their rows |
| A11 | Writes propagate to other portals via React Query key invalidation (+ selective Realtime) | Decoupled portals; no cross-wiring between surfaces |
