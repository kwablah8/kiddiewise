# 02 — Architecture

Version 1.1 · Status: reflects the wired backend

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
- A few operations need elevated rights the logged-in user doesn't have — chiefly an admin
  **creating login accounts** for teachers/parents, since `profiles.id` is a foreign key to
  `auth.users(id)` and nobody can exist here without an auth record. These run **server-side only**,
  in Server Actions holding the service-role key (`lib/actions/_server.ts`). No Edge Function proved
  necessary: the actions already run on the server, so a second deployable would add no security. The service key never
  reaches the browser, and these paths still enforce tenancy in code (verify the caller is a
  school_admin for the target `school_id`).

### The data layer (wired)

The backend is live. The former in-memory seam is gone — `lib/mock/` has been deleted — and the
layers it stood in for are now the real thing (full contract in
`docs/07-ENGINEERING-STANDARDS.md` §3):

`lib/data (read + derive) → lib/queries (hooks + keys) → components`,
and for writes `component → lib/queries mutation → lib/actions (Server Action: validate + persist)`.

- **Reads run in the browser** through PostgREST, carrying the session cookie. That is safe because
  RLS is the boundary (A3), and it buys caching, background refetch and optimistic updates for free.
  No read passes `school_id` — `current_school_id()` derives it from `auth.uid()`.
- **Writes are Server Actions**, because three things cannot be trusted to the client: `school_id`
  stamped from the session, `auth.uid()` recorded as author, and business rules the client must not be
  able to skip (the admissions state machine, the single-primary-guardian demotion, an assessment's
  `max_score` ceiling).
- `lib/data/*` performs all **derivation** (joins, computed fields) — never the component. Errors
  throw, so React Query renders the error state rather than an empty one painted over a failure.
- **Pure business rules** live in unit-tested `lib/<domain>.ts` helpers (`lib/attendance.ts`,
  `lib/grading.ts`, `lib/results.ts`, `lib/terminal-reports.ts`, `lib/fees/summary.ts`).

The seam did its job: swapping in Supabase changed only the **bodies** of `lib/data/*` and
`lib/actions/*` plus the `useSession` source. View-model shapes, Zod schemas, query keys and every
component were untouched.

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
| `gallery` | ~~Marketing gallery images~~ **SUPERSEDED — see §7a** | Read: public; write: school_admin |
| `reports` | Generated terminal report PDFs | Read: linked parent + school staff; write: service role |

Bucket policies mirror the RLS tenancy model. Store the object path in the relevant table;
never expose service-role signed URLs to the client beyond their needed lifetime.

The `gallery` bucket is **provisioned but will not be wired.** Gallery photos are Sanity assets now
(§7a). The bucket stays in `supabase/migrations/0012_storage.sql` because migrations are immutable
history, not because anything is coming — do not build an upload path against it.

---

## 7a. Sanity — the marketing site's CMS

The platform has **two content stores**, with a hard boundary between them.

| | Supabase | Sanity |
|---|---|---|
| Owns | Operational, tenant-scoped, RLS-governed data — students, enrollments, attendance, results, fees, and the admin-authored `announcements`/`events` that render **inside the portals** | Public editorial content — news posts, gallery photos, and the handful of marketing facts the school revises on its own schedule |
| Audience | Signed-in admins, teachers, parents | Anyone on the public site |
| Security | RLS is the boundary | Published-only, public dataset; no secrets involved |

**This does not violate golden rule 9.** No fact lives in both stores. A news post is not an
announcement: different audience, different voice, no sync between them. If a fact is tenant-scoped or
RLS-governed it is Supabase's, always.

**What Sanity owns, and the test used to decide.** *Sanity owns what changes on the school's calendar,
or what we simply do not know yet. Code keeps everything whose change is a design decision.* So: news,
gallery photos, contact email/phones, office hours, the admissions year and the early-bird sentence, and
the About page's founding story. Not: the school's name/motto/crest (`lib/brand.ts` — shared with the
portal and the generated PDFs, so a Sanity edit could make the two surfaces disagree), the campus
address (rendered by a client component and by the sign-in screen), the tagline, the programs, the
admission flyer artwork, the promo video, or any section prose.

**Sanity is additive and optional.** `lib/marketing/cms/env.ts` returns `null` when
`NEXT_PUBLIC_SANITY_PROJECT_ID` is unset, and every reader in `lib/marketing/cms/read.ts` then falls
back to the values compiled into `lib/marketing/site.ts` / `media.ts`. CI builds this way on purpose.
Unsetting that one variable is the entire rollback.

**Caching — two mechanisms, both needed.** Plain `client.fetch`, tagged, with
`next: { revalidate: 300, tags: [...] }`. No `defineLive`, no `<SanityLive>` — live content is what
caused next-sanity's documented 4–7× request overage on Next 16, and this site has no use for
sub-second updates.

1. **Tags are the fast path.** Publishing fires a Sanity webhook at `POST /api/revalidate-sanity`,
   which expires the matching tag with **`revalidateTag(tag, { expire: 0 })`**. That argument is the
   whole trick: the recommended `"max"` profile is stale-while-revalidate, so the editor who publishes
   and refreshes is served their OLD page while a fresh one builds behind it. Next's docs single out
   `{ expire: 0 }` for "webhooks or third-party services that need immediate expiration" — the next
   request blocks for fresh data instead. `updateTag` is the other route to read-your-own-writes but
   is Server-Action-only and cannot be called from a Route Handler.
2. **Time-based revalidation is the backstop**, at 5 minutes, for a webhook that is never configured,
   whose secret rotates, or that Sanity cannot reach. A broken webhook should be an annoyance, not a
   permanently frozen site with nothing on screen to explain it.

These are not mutually exclusive. `next.tags` and `next.revalidate` are independent `fetch` options
(the only documented conflict is `revalidate` with `cache: "no-store"`). The belief that tags disable
time-based revalidation comes from next-sanity's own `sanityFetch` helper, which internally sets
`revalidate: tags.length ? false : revalidate`; we call `fetch` directly and get both.

**`useCdn: false`** follows from the above. Sanity's CDN would be a second cache whose timing we do
not control, and that actively breaks the fast path: the webhook fires, we re-fetch immediately, and
if the edge has not caught up we cache the OLD content for another full window. We only reach Sanity
when a cache entry is expired — a handful of requests per publish, not per visitor — so the origin
is affordable.

**The webhook is unauthenticated by necessity** (Sanity's servers hold no session with us) and
protected by an HMAC signature over `SANITY_REVALIDATE_SECRET`, verified by `parseBody`. Two
consequences that are easy to get wrong: `/api/revalidate-sanity` must be in the `isPublicPath`
allowlist or the middleware redirects Sanity's POST to `/login` and publishing silently stops
reaching the site; and the signature check must be written `isValidSignature !== true`, because
`parseBody` returns `null` — not `false` — when the header is absent.

**Where the code lives.** Studio-side config and schema in root `sanity/` (mirroring root `supabase/` —
external-system schema plus CLI config, no app logic). App-side reads in `lib/marketing/cms/`, NOT
`lib/data/` (which means "browser-side, RLS-scoped Supabase reads" in this codebase) and NOT
`lib/queries/` (there is no client cache to manage; Next's data cache is the cache). Zod contracts in
`lib/validators/marketing.ts` per rule 10.

**Dependency justification** (required by `docs/07-ENGINEERING-STANDARDS.md` §6):

| Package | Why it is not avoidable |
|---|---|
| `next-sanity` | The official Next.js integration — client, `NextStudio`, Portable Text. **v13 specifically:** v12 on Next 16 caused the request overage above |
| `sanity` | The Studio itself, required to embed it at `/studio` |
| `@sanity/vision` | GROQ playground inside the Studio; the alternative is debugging queries blind |
| `@sanity/image-url` | Resolves the editor's dragged focal point plus crop into `?rect=&fp-x=&fp-y=`. That is real geometry, not the "few lines" §6 asks us to hand-write — and hotspot is a feature the school will use, cropping portrait photos into landscape news cards |
| `@sanity/client` | A declared **peer dependency of `next-sanity`** — pnpm was auto-installing it, so it worked, but a peer the app depends on belongs in `package.json`. Imported directly by `scripts/seed-cms-gallery.ts`, which pnpm's strict resolution would otherwise refuse |
| `styled-components` | A **peer requirement of `sanity`**, not a choice. Studio-only; no app code imports it |

Sanity's own typegen is deliberately **not** used: with three document types, Zod already gives us types
via `z.infer` *and* validates at runtime, which typegen does not. The tradeoff is that a GROQ typo
surfaces as a logged validation failure rather than a typecheck error — which is why every fallback in
`read.ts` logs loudly. Revisit if the schema grows.

**Free-plan consequence to know:** the dataset is public, so an *unpublished* draft is fetchable by
anyone who knows the project id (and the project id ships in the client bundle). Our pages can never
render one — the client pins `perspective: "published"` — but the school should be told not to draft
anything they would not publish.

---

## 8. Realtime (selective)

Realtime is used sparingly where live updates add real value: e.g. reflecting new
announcements or attendance updates without a manual refresh. It is not the default data
path — most screens use standard React Query fetch + revalidate. Subscriptions respect RLS.

---

## 9. Privileged server work (no Edge Functions)

**None are used.** Both jobs originally scoped as Edge Functions ended up elsewhere, and better placed:

- **Account provisioning** — creating a teacher/parent `auth.users` record plus their `profiles` row —
  lives in `lib/actions/_server.ts#provisionUser`, called from Server Actions. Those already run
  server-side, so the service key never reaches the browser either way; a separate deployable would
  have added no security and one more thing to deploy.
- **Terminal report generation** is a Server Action (`lib/actions/reports.ts`) doing set-based SQL
  reads plus pure `lib/terminal-reports.ts` arithmetic. No PDF is written yet — `terminal_reports.pdf_url`
  is unused, and the `reports` bucket is still unwired (`docs/08-ROADMAP.md` §Remaining work).

Read aggregates are database views / RPC rather than functions (§12 of `docs/03-DATABASE.md`).

Should a genuinely out-of-band job appear later — a nightly digest, a webhook receiver, an SMS
callback — an Edge Function is the right home for it. Nothing so far qualifies.

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
| A6 | Service-role work isolated to Server Actions (`lib/actions/_server.ts`) | Keeps the privileged key off the client. No Edge Function was needed — the actions already run server-side |
| A7 | Responsive web only for MVP; Expo app later on same Supabase project | Focus; reuse backend |
| A8 | Built UI against a typed in-memory seam first, then swapped the read/write bodies for Supabase | Worked as intended: components, hooks, validators and query keys were untouched by the swap. `lib/mock/` is now deleted |
| A9 | One source of truth per fact; portals are derived, RLS-scoped views — never copies | Cross-portal consistency for free; a single write reflects everywhere |
| A10 | Cross-cutting numbers derived on read (DB view/RPC or pure `lib/` helper), never stored twice | Aggregates can't drift from their rows |
| A11 | Writes propagate to other portals via React Query key invalidation (+ selective Realtime) | Decoupled portals; no cross-wiring between surfaces |
| A12 | Sanity for public editorial content; Supabase for everything operational (§7a) | Lets the school publish news and photos without a developer, without putting a second copy of any tenant fact outside RLS |
| A13 | Sanity is optional at runtime — no project id means fall back to compiled content | CI and a fresh clone build with no credentials, and rollback is unsetting one env var rather than reverting code |
| A14 | Tagged reads + a publish webhook using `revalidateTag(tag, {expire: 0})`, with 5-minute time-based revalidation as a backstop | The school needs an edit to appear when they publish, not on a timer. `{expire: 0}` is the documented webhook escape hatch from stale-while-revalidate, which would otherwise show the editor their own previous content on first refresh. Tags and `revalidate` coexist, so a broken webhook degrades to 5 minutes rather than to a frozen site |
