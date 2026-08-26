# School Management Platform

Multi-school management software for the Ghanaian education market: enrolment, classes,
attendance, results, fees and parent communication. It replaces paper registers, manual result
sheets and scattered WhatsApp updates.

Running in production for SNAB Learners International School (SLIS) in Oyarifa, Accra.

Money is Ghana Cedi (GHS) everywhere it appears.

## Getting started

Setup, demo logins, every command and the gotchas that have already cost time are in
[docs/09-DEV-RUNBOOK.md](docs/09-DEV-RUNBOOK.md). Start there on a fresh machine.

The short version:

```bash
pnpm install
npx supabase start   # Postgres, Auth and Storage in Docker
pnpm db:seed         # applies migrations, then seeds a populated demo school
pnpm dev             # http://localhost:3000
```

Demo accounts are `admin@slis.test`, `teacher@slis.test` and `parent@slis.test`, all with the
password `Password123!`.

## What this is

One Next.js application serving five audiences through route groups, rather than four separate
deployments. Everything is on one domain.

| Surface | Audience | Where |
|---|---|---|
| Marketing site | Prospective parents, visitors | `/`, `/about`, `/admissions`, `/news`, `/gallery`, `/contact` |
| Admin portal | School admins, management, account officers | `/dashboard`, `/students`, `/staff`, `/fees`, `/assessments`, … |
| Staff portal | Teachers | `/teacher/*` |
| Parent portal | Parents and guardians | `/parent/*` |
| Content studio | Whoever edits the public site | `/studio` (Sanity, authenticated by Sanity) |

Roles are `super_admin`, `school_admin`, `teacher` and `parent`. Login sends each role to its own
portal, and `middleware.ts` bounces anyone who navigates into another role's subtree.

The reasoning behind the single-application choice is in
[docs/02-ARCHITECTURE.md](docs/02-ARCHITECTURE.md).

## Stack

- Next.js (App Router) and TypeScript
- Tailwind CSS with shadcn/ui
- TanStack Query for fetching and cache
- React Hook Form with Zod for validation
- Supabase for Postgres, Auth, Storage and Row Level Security
- Sanity for public-site content: news posts, gallery photos, contact details
- jsPDF for fee receipts and report cards, rendered client side
- Vercel and Supabase for hosting

Nothing privileged runs in an Edge Function. Server Actions are already server side, which is
where writes live.

The dependency list is deliberately short. Adding to it needs a reason written into the relevant
doc first.

## Layout

```
app/
  (marketing)/          public site
  (auth)/               login, password reset
  (app)/                authenticated shell
    dashboard/ students/ staff/ classes/ subjects/ enquiries/
    assessments/ fees/ grading/ terminal-reports/ promotion/
    teacher/            staff portal
    parent/             parent portal
  studio/               embedded Sanity Studio
components/
  ui/                   shadcn primitives
  <feature>/            feature-scoped components
lib/
  supabase/             clients and generated database types
  validators/           Zod schemas: view models and write inputs
  data/                 reads: PostgREST queries plus derivation
  actions/              writes: Server Actions that validate then persist
  queries/              TanStack Query hooks and centralised query keys
  auth/  permissions/   session and role helpers
  marketing/            public-site copy and media, plus Sanity reads under cms/
  <domain>.ts           pure business logic: grading, attendance, fees, reports
sanity/                 Studio schema and structure
supabase/
  migrations/           schema and RLS policies; the database source of truth
  seed.sql              a bare tenant, the school row only
scripts/seed-demo.ts    the populated demo school
tests/
  unit/                 pure logic, no database
  rls/                  tenant isolation and role scoping
  integration/          per-role reads against the seeded demo tenant
docs/                   architecture, database, permissions, UI standards, runbook
```

## Conventions that matter

These are the assumptions the codebase is built on. Most of the bugs found so far came from
breaking one of them.

**Every record belongs to a school.** Every meaningful table carries `school_id`, every query is
scoped to one school, and every table has RLS policies. There is no such thing as a global
student, class or result.

**RLS is the security boundary, not the UI.** Hiding a button proves nothing. The REST API is
public and the client is assumed hostile. This is also why reads run in the browser against
PostgREST carrying the user's session: it is exactly as safe as a server-side read, because
policies decide which rows exist, and it gets caching and background refetch for free.

**Data flows one way through the layers.** Validators define the shapes, `lib/data` reads and
derives, `lib/actions` validates and writes, `lib/queries` handles cache and invalidation, and
components render and dispatch. Business logic belongs in `lib/`, not in a component. A write
reaches another portal by invalidating a shared query key, never by wiring two components
together.

**Derive, don't duplicate.** Each fact lives in exactly one table. Cross-cutting numbers such as
fee balances, attendance rates and class averages are computed in a database view, an RPC or a
pure helper in `lib/`, never stored twice and never added up inside a component. The
`student_fee_positions` and `extra_fee_positions` views are the pattern: `paid`, `balance` and
`status` are derived from `payments` rather than being columns, so there is one answer to how
much a student has paid. Both portals read fees through the same functions in `lib/data/fees.ts`
for the same reason.

**No `any`.** Types flow outward from the generated Supabase types and the Zod schemas.

**Every screen ships four states:** loading, empty, error and success. A screen with only the
happy path is unfinished.

## Testing

```bash
pnpm typecheck
pnpm lint
pnpm test:unit          # pure logic, no database
pnpm test:rls           # tenant isolation and role scoping, in throwaway schools
pnpm test:integration   # per-role reads against the seeded demo tenant
```

`test:rls` and `test:integration` both need a live database and read `.env.local`. Check which
project that file points at before running them: the integration suite asserts exact seeded
counts, so it fails against any database whose demo tenant has drifted.

Passing tests are not the same as working software. Several bugs here passed every suite and only
appeared on screen, so check the change in the running app too. Section 8 of the runbook lists
the ones that caught us.

## Documentation

| File | Contents |
|---|---|
| [docs/00-OVERVIEW.md](docs/00-OVERVIEW.md) | Vision, product surfaces, goals and non-goals |
| [docs/01-REQUIREMENTS.md](docs/01-REQUIREMENTS.md) | Scope per portal |
| [docs/02-ARCHITECTURE.md](docs/02-ARCHITECTURE.md) | System architecture, rendering, data flow, multi-tenancy |
| [docs/03-DATABASE.md](docs/03-DATABASE.md) | Schema, relationships, enums, RLS strategy |
| [docs/04-AUTH-AND-PERMISSIONS.md](docs/04-AUTH-AND-PERMISSIONS.md) | Auth flows, roles, permission matrix, route protection |
| [docs/05-USER-FLOWS.md](docs/05-USER-FLOWS.md) | Key flows per role |
| [docs/06-UI-UX-STANDARDS.md](docs/06-UI-UX-STANDARDS.md) | Design system |
| [docs/07-ENGINEERING-STANDARDS.md](docs/07-ENGINEERING-STANDARDS.md) | Conventions, data layer, validation, testing, git |
| [docs/08-ROADMAP.md](docs/08-ROADMAP.md) | Delivery phases, remaining work, hardening backlog |
| [docs/09-DEV-RUNBOOK.md](docs/09-DEV-RUNBOOK.md) | Setup, demo logins, commands, gotchas |

## Current state

The backend is wired: every read in `lib/data` is a real PostgREST query and every write in
`lib/actions` is a real Server Action, both scoped by RLS. Auth is Supabase Auth with a
server-side role guard in `middleware.ts`.

Built and verified end to end: admin dashboard, students, staff and parents including portal
access, classes, subjects, academic years and terms, the admissions inbox, grading scale,
assessments, fees for both class and extra fees, attendance, score entry, terminal reports,
parent fees with receipts, promotion into the next year, announcements and events, the child
daily report, the marketing site with its public enquiry form, and the Sanity-backed public
content.

Not built yet: school-settings editing, student photos and school logo in Storage, and the
students PDF or CSV export. Online fee payment is out of scope: the parent fees screen reports
what the office recorded and never collects money. Email and SMS delivery works but needs an
SMTP or Hubtel account. [docs/08-ROADMAP.md](docs/08-ROADMAP.md) has the full breakdown.

If this file drifts from reality, fix the file.
