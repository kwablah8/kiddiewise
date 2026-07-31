# 09 — Developer Runbook

Everything you need to run, seed, log into and test this project locally. Start here on a fresh
machine, and come back here for credentials, commands and known gotchas.

> **Scope of the secrets below:** every key in this document is a **local-only** Supabase demo key.
> They are identical on every `supabase start` installation worldwide and grant nothing beyond your
> own machine. **Production keys must never be written into this file or any other tracked file** —
> they belong in Vercel/Supabase environment variables only. See §9.

---

## 1. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node | **22+ recommended** | The repo currently runs on 20; see the WebSocket gotcha in §8 |
| pnpm | 10+ | `corepack enable` or `npm i -g pnpm` |
| Docker Desktop | running | Supabase local stack runs in Docker |

```bash
pnpm install
```

---

## 2. First run, from nothing

```bash
npx supabase start        # boots Postgres, Auth, Storage, Studio in Docker (~1 min first time)
pnpm db:seed              # applies all migrations, then seeds the demo school
pnpm dev                  # http://localhost:3000
```

`pnpm db:seed` is the one command you want 95% of the time — it is `db:reset` (drop, re-migrate,
run `supabase/seed.sql`) followed by `seed:demo` (the populated demo tenant).

---

## 3. Portal logins

All demo accounts share one password.

| Portal | Email | Password | Who they are |
|---|---|---|---|
| **Admin** | `admin@slis.test` | `Password123!` | Ama Mensah — School Admin |
| **Staff / Teacher** | `teacher@slis.test` | `Password123!` | Efua Owusu — class teacher of Basic 1, teaches Maths across all classes |
| **Parent** | `parent@slis.test` | `Password123!` | Yaw Mensah — guardian of exactly 2 children |

Each role lands on its own portal after login (`/dashboard`, `/teacher/dashboard`,
`/parent/dashboard`) and is bounced back if it tries to open another role's subtree.

**Other seeded accounts** (same password) if you need a second user of a role:

- Teachers: `kwabena.adjei@`, `abena.sarpong@`, `kojo.boateng@`, `akosua.danso@` `…@slis.test`
- `yaw.nkrumah@slis.test` — deliberately **inactive**, teaches nothing (tests the empty case)
- Parents: `adwoa.asante@`, `kofi.boateng@`, `esi.owusu@`, `kwesi.darko@`, `afia.frimpong@`,
  `nana.antwi@`, `akua.kusi@` `…@example.com`

The login screen shows the three main accounts as a reminder, but **only in development**
(`NODE_ENV === "development"`), so it can never ship to production.

---

## 4. Local service URLs

| Service | URL | What it's for |
|---|---|---|
| App | http://localhost:3000 | Next.js dev server |
| **Supabase Studio** | http://127.0.0.1:54323 | Table editor, SQL editor, auth user list |
| **Mailpit** | http://127.0.0.1:54324 | **Catches every outbound email.** Password-reset links land here, not in a real inbox |
| API (PostgREST) | http://127.0.0.1:54321 | The REST API the app calls |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` | Direct SQL access |

Studio has no login locally. To test the forgot-password flow, submit the form then open Mailpit
and click the link in the captured email.

---

## 5. Supabase keys (local only)

These belong in `.env.local`, which is gitignored:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

Re-print them any time with `npx supabase status`.

**What each key is allowed to do:**

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — safe in the browser. It identifies the *project*, not a user;
  RLS decides what the signed-in caller can see.
- `SUPABASE_SERVICE_ROLE_KEY` — **bypasses RLS entirely.** Server-only: the seed script, the RLS
  test harness, and account provisioning inside Server Actions (`lib/actions/_server.ts`). It must
  never be imported into a client component or prefixed with `NEXT_PUBLIC_`.

---

## 6. Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| **`pnpm db:seed`** | **Reset + migrate + seed demo tenant. Your default.** |
| `pnpm db:reset` | Reset + migrate + `seed.sql` only (a bare school, no data — good for testing empty states) |
| `pnpm seed:demo` | Re-seed the demo tenant without a reset. Idempotent |
| `pnpm db:new <name>` | Create a new timestamped migration file |
| `pnpm gen:types` | **Regenerate `lib/supabase/types.ts` from the local DB. Run after every migration.** |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm test:unit` | Pure business-logic tests. No DB needed |
| `pnpm test:rls` | Tenant isolation + role scoping. Needs Supabase running |
| `pnpm test:integration` | Per-role reads against the seeded demo tenant. **Needs `pnpm db:seed` first** |

### Before you commit

```bash
pnpm typecheck && pnpm lint && pnpm test:unit && pnpm test:rls && pnpm test:integration
```

---

## 7. What the demo tenant contains

School: **SNAB Learners International School** (slug `slis`) — matches the marketing site's
branding, so credential messages and public enquiries read correctly out of the box.

| Data | Amount | Deliberate detail |
|---|---|---|
| Staff | 7 | 1 admin, 5 active teachers, 1 inactive teacher who teaches nothing |
| Parents | 8 | `parent@` has exactly 2 children |
| Students | 26 | 24 active, 1 withdrawn, 1 transferred |
| Classes | 6 | Basic 1–3, JHS 1–3; JHS 2 has no class teacher |
| Attendance | ~720 rows | Last 30 school days (weekdays only), ~96% present-or-late |
| Assessments | 24 | Maths + English per class, results submitted |
| Invoices | 24 | Every one of paid / partial / pending occurs, plus scholarships and arrears |
| Extra fees | 5 definitions | Bus, Feeding, Uniform, Excursion, ICT Lab |
| Terminal reports | Basic 1 only | Published, so `parent@` sees a real report while other classes show "not published" |
| Inquiries | 6 | 3 still `new`, so the Admissions sidebar badge has a count |

**Dates are always relative to today.** The active term is seeded to bracket the current date, so
attendance history and the dashboard are never empty just because time has passed.

The seed is **deterministic** — a fixed PRNG seed, not `Math.random()` — so re-seeding produces the
same school and screenshots stay comparable.

---

## 8. Gotchas that have already bitten

**Node 20 has no global WebSocket.** `@supabase/supabase-js` needs it. Any Node script talking to
Supabase must run with `NODE_OPTIONS=--experimental-websocket` (already baked into the `seed:demo`,
`test:rls` and `test:integration` scripts). Upgrading to Node 22 removes the need.

**PostgREST bulk inserts do not apply column defaults.** When rows in one `.insert([...])` call have
different key sets, PostgREST unifies the columns and sends `NULL` for whatever a row omitted — it
does *not* fall back to the column's `DEFAULT`. Give every row in a bulk insert the **same keys**.

**`grant … on all tables in schema public` is not a standing rule.** It applies only to tables that
existed when it ran (migration `0015`). Every migration that creates a table or adds a
user-editable column to `profiles` must issue its own grants, or requests fail at the privilege
layer *before* RLS is ever evaluated — which looks like a confusing empty result, not a permission
error.

**Views bypass RLS unless you say otherwise.** A view runs with its owner's rights by default, which
for a migration-created view is `postgres` — handing every caller the whole platform's data. Every
view in this project is created `with (security_invoker = true)`. Do not omit it.

**Never use `supabase.auth.getSession()` for an authorization decision.** It only decodes a cookie
the client controls. Use `getUser()`, which revalidates against the auth server.

**A password-setup page must bind to the session in the LINK, not the browser's current one.** This
shipped as a real bug and was caught in testing: `/update-password` called `updateUser()` against
whatever session already existed, so an admin who invited a parent from the office computer and let
them open the link there had their OWN password set by the parent. The page now adopts the link's
tokens explicitly via `setSession` and refuses to fall back. The one exception is a holder of an
admin-issued temporary password, who is *required* to change it and proved knowledge of that
credential to get there.

**An `!inner` embed needs read access to the embedded table.** PostgREST returns **zero rows**, not an
error, when a joined table is unreadable — so the failure looks like an empty screen, not a permission
problem. This shipped once: parents could read `results` but not `assessments`, and the portal joins
them, so the results page said "No results published yet" no matter what teachers submitted. The RLS
suite asserted both tables separately and passed on both. **Test the join.**

**Upserts replace the whole row.** Anything a human typed or decided has to be read and merged back in,
or arithmetic destroys it — regenerating terminal reports would otherwise wipe the teacher's remarks and
silently retract published reports.

**`useSearchParams()` opts a page out of prerendering** unless it sits inside a Suspense boundary. The
build fails with "missing-suspense-with-csr-bailout". If the value is only needed inside an event
handler, read `window.location.search` instead.

**This project's `SelectValue` needs a render child.** Without one, base-ui renders the raw `value` —
which for an id-keyed select means a UUID in the trigger. Copy the pattern in
`components/teacher/attendance-marker.tsx`.

**A Select `value` of `undefined` makes it uncontrolled.** Base UI decides on first render and warns
loudly when it later flips. Use `null` for "nothing selected".

**The auth gateway can 502 right after a config change.** Editing `supabase/config.toml` (email
templates, redirect URLs) makes the auth container reload; requests in that window fail with an
unhelpful empty error. `npx supabase stop && npx supabase start` clears it.

**`pnpm test:integration` depends on the seed.** If sign-in fails with "Has `pnpm seed:demo` been
run?", that's why.

---

## 9. Going to production (not done yet)

When the hosted project is created, this is the checklist:

1. Create the Supabase project; copy its URL, anon key and service role key.
2. Set them in Vercel env vars — **never** in a tracked file. `SUPABASE_SERVICE_ROLE_KEY` must be a
   server-only variable (no `NEXT_PUBLIC_` prefix).
3. `npx supabase link --project-ref <ref>` then `npx supabase db push` to apply migrations.
4. **Do not run `seed:demo` against production.** It deletes the tenant it manages before
   re-seeding, and it creates accounts with a published password.
5. Create the first real `school_admin` through Supabase Studio's auth panel plus a `profiles` row,
   or by adding them through the app once a first admin exists.
6. Configure the Auth email templates and the site URL so password-reset links point at the real
   domain instead of `localhost`.
7. Re-run `pnpm test:rls` against a staging project before going live — tenant isolation is the one
   thing that must never regress.

---

## 10. How the layers fit together

```
components  →  lib/queries/*   (React Query hooks + cache keys)
                    ├── reads  →  lib/data/*     →  PostgREST  →  Postgres + RLS
                    └── writes →  lib/actions/*  →  Server Action  →  Postgres + RLS
                                        ↑
                              lib/validators/*  (Zod — the shape contract)
```

**There is no hand-written REST API.** PostgREST exposes every table and view as a typed REST
endpoint and RLS decides what each caller sees. Derived aggregates live in Postgres functions called
via `.rpc()`.

- **Reads run in the browser.** Safe because RLS is the boundary, and it buys caching and background
  refetch for free. No read passes `school_id` — `current_school_id()` derives it from `auth.uid()`.
- **Writes are Server Actions.** They need three things the browser can't be trusted with:
  `school_id` stamped from the session, `auth.uid()` recorded as author, and business rules the client
  cannot skip (the admissions state machine, the single-primary-guardian demotion).
- **Adding a person is provisioning.** `profiles.id` is a foreign key to `auth.users(id)`, so
  `createStaff` / `createParent` create an auth account first (service role, server-side only), then
  insert the profile — rolling back the account if the profile insert fails.

### How parents and staff get portal access

Two routes, both needing **no email or SMS provider**. Email/SMS delivery is deliberately optional
because Hubtel/Twilio/SMTP approval takes weeks in Ghana. Staff and parents work identically here —
same action helpers, same dialog, same status column — so what follows applies to both.

**1. Temporary password at creation (the default).** While the person is at the desk, `createParent` /
`createStaff` generate a readable temporary password — `Harmattan-46589-Heron`, shaped to survive
handwriting and a phone call — and show it **once**. The admin writes it on the admission slip or taps
**Copy WhatsApp message** for a ready-to-send message with the login URL, email and password.

On first sign-in they are held on `/update-password` by the middleware until they choose their own
password. When they do, the temporary one dies — so the admin no longer has access to that child's
records, or to that teacher's class. Both the Parents and Staff screens show `Active` once that
happens and `Awaiting first sign-in` until then; Parents additionally carries a running "*n* of *m*
parents have signed in and set their own password" count.

Unused temporary passwords **expire after 30 days** (`TEMP_PASSWORD_DAYS`). That bound is the point:
until the holder takes ownership, the admin who issued the credential can sign in as them.

**"Send credentials" reissues — it cannot re-reveal.** Passwords are stored as bcrypt hashes, so the
original is gone the moment the dialog closes. Pressing it generates a *new* temporary password and
invalidates the old one. Keeping the plaintext to allow a true re-copy would put every parent's
password in the database in readable form; that is why the button behaves this way.

**2. Send a link.** `generateLink` returns a one-time password-setup URL without sending anything —
the admin pastes it into WhatsApp. Here the admin never knows the password at all. **Email the
invitation** also exists and needs SMTP; locally those emails land in Mailpit (§4).

### Current status

| Area | Status |
|---|---|
| Schema + RLS (21 migrations · 26 tables · 2 views · 8 app-facing functions (+7 RLS helpers)) | ✅ Migrated and tested |
| Auth (login, reset, role routing, server-side guards) | ✅ Real Supabase Auth |
| Portal access — temporary passwords + invite links, forced first change | ✅ No provider needed |
| Demo seed | ✅ `pnpm db:seed` |
| `lib/data/*` reads · `lib/actions/*` writes | ✅ PostgREST + Server Actions |
| `lib/mock/` seam | ✅ Deleted |
| Teacher: attendance · score entry | ✅ Writes and propagates to the parent portal |
| Admin: terminal reports (generate → remark → publish) | ✅ |
| Test suites (93 unit · 13 RLS · 16 integration) | ✅ Green |
| Promotion (decisions → next-year enrollments → year switch re-scopes every read) | ✅ `tests/rls/promotion-rollover.test.ts` |
| Announcements/events authoring | ✅ |
| School settings, Storage | ⏳ See `docs/08-ROADMAP.md` §Remaining work |

The full breakdown of what is left, grouped
by whether it blocks a usable MVP, is in `docs/08-ROADMAP.md` §"Remaining work".
