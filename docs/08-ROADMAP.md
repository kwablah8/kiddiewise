# 08 — Roadmap

Version 1.1 · Status: MVP in build — see per-phase status below

Delivery sequence. The order follows a simple logic: **admins create the data every other
portal depends on**, so the platform foundation and Admin portal come first, then the
audiences that consume that data.

---

## Phase 1 — Documentation (this set)

Requirements, architecture, database design, user flows, permissions, standards. Establishes
the source of truth before any code. **Status: done** (kept current as the build changes it).

Deliverables: `README.md` and `docs/00`-`docs/09`.

---

## Phase 2 — Supabase foundation

Stand up the backend the whole app depends on.

- Postgres schema from `docs/03-DATABASE.md` (tables, enums, constraints, indexes).
- **RLS policies on every table** + helper functions (`current_school_id`, `current_role`).
- Auth: email/password, password reset, session handling.
- Storage buckets (`avatars`, `school-logos`, `gallery`, `reports`) + policies.
- Seed path for `super_admin`, a school, and its first `school_admin`.
- Generated TypeScript types committed.
- **RLS test suite** proving cross-school isolation and role scoping.

Exit criteria: a seeded school with an admin, all tables protected, tenancy tests green.

**Status: done.** 21 migrations, 26 tables, 2 views, 8 app-facing functions (plus 7 SECURITY DEFINER RLS helpers). `pnpm db:seed` builds a populated
demo school; 13 RLS + 16 integration tests green.

---

## Phase 3 — Admin portal

The operational core; unblocks every other portal.

- App shell (maroon sidebar, auth guard, role routing) + design tokens/components.
- School setup: profile, academic years, terms, active year/term.
- Classes, subjects, teacher assignments (`class_subjects`), class teachers.
- Students: CRUD, enrollment, admission numbers, photos.
- Parents: create + link to students (`student_guardians`).
- Grading scale + assessment types.
- Announcements + events.
- Admissions inquiry management.
- Dashboard: metric cards, enrollment/fee trends, recent activity, class performance,
  upcoming events (via views/RPC).
- Fees (lightweight): fee items, invoices, record payments, revenue + trend.
- Terminal reports: generate, comment, publish, export.
- Promotion.

Exit criteria: an admin can set up and run a school end-to-end (per `docs/05-USER-FLOWS.md §1`).

**Status: mostly done.** Promotion, announcements/events authoring and the report card PDF have all
since shipped. Outstanding: school settings, and storing the generated report PDF rather than only
downloading it. See "Remaining work" below.

---

## Phase 4 — Marketing website

Public presence + inbound funnel into the platform.

- Home, About, Admissions, News, Gallery, Contact.
- Admissions/contact forms writing to `admissions_inquiries` (anonymous INSERT, rate-limited).
- Shared brand + typography; separate from the app shell.

Exit criteria: a visitor can learn about the school and submit an inquiry that lands in Admin.

**Status: done.** Enquiries land in the admin inbox. News is a real, school-authored section
(`/news` + `/news/[slug]`), and the gallery is school-managed — both via Sanity, not Storage
(`docs/02-ARCHITECTURE.md` §7a). The Studio is embedded at `/studio`, and the school also edits its
contact email, phone numbers, office hours, admissions year, early-bird sentence and founding story
there. Everything else on the public site is still code-owned by design.

---

## Phase 5 — Staff (Teacher) portal

Consumes the academic structure admins created.

- Teacher shell + dashboard (classes, subjects, students, attendance rate, quick actions).
- Attendance: select class/date, mark present/absent/late, edit.
- Assessments/exams: create, enter scores, auto-grade, submit results.
- Performance review views.
- All scoped to the teacher's assignments (RLS-enforced).

Exit criteria: a teacher can mark attendance and submit results for their classes.

**Status: done.** Attendance and score entry both write and propagate. "Performance review views" is
the assessment detail screen; a richer analytics view is post-MVP.

---

## Phase 6 — Parent portal

Read-only monitoring for guardians; depends on submitted teacher data + published reports.

- Parent shell + dashboard (children, announcements, attendance summary, latest results).
- Child profile, attendance history + percentage, results, published terminal reports.
- Fees: balance, per-term position, extra fees, and a receipt per payment.
- Scoped to linked children (RLS-enforced).

Exit criteria: a parent sees accurate, up-to-date data for each linked child and nothing else.

**Status: done.** Dashboard, profile, attendance, results, published reports and fees all work.
The fees tab reads through the same `lib/data/fees.ts` functions the admin screens use, narrowed to
one student, so a parent's balance and the office's balance for that child are the same figure by
construction. No migration was needed — `pay_parent_read` / `inv_parent_read` / `efa_parent_read`
already permitted it, which is what 0017's comment anticipated.

---

## Remaining work

Grouped by what blocks a usable MVP. Verified against the code, not from memory.

### Blocking

Nothing. Promotion — the last item here — shipped: `app/(app)/promotion/page.tsx` writes next-year
`enrollments` from per-class decisions, and `tests/rls/promotion-rollover.test.ts` holds the rule that
every "current class" read is scoped to the ACTIVE year.

### Read-only screens missing their write side

| Item | Reads work | Missing |
|---|---|---|
| School settings | `getSchool()` + `schools_admin_update` policy exist | No page to edit name, logo, address, contact |

Announcements and events have since gained their write side (`components/communication/*`,
`lib/actions/communication.ts`), so they are no longer listed. The parent fee balance has shipped
too (`app/(app)/parent/children/[id]/fees`), receipt download included — a parent no longer has to
ask the office to reissue one.

### Storage — three buckets to wire (the fourth is superseded)

`avatars` (student/staff photos — the form makes a local preview only), `school-logos`, `reports`
(`terminal_reports.pdf_url` written nowhere — the card renders and downloads from the browser, but no
copy is kept). Best done as one batch: it is one upload helper reused three times.

`gallery` is **no longer work.** Gallery photos are Sanity assets; the bucket stays in migration 0012
as immutable history and should not be wired (`docs/02-ARCHITECTURE.md` §7).

### Nice-to-have

Students PDF/CSV export (buttons toast "coming soon") · contact map embed · **social handles — needs
BOTH a footer social row and the matching Sanity field, in one change**; the dead empty `SOCIAL_LINKS`
export was removed rather than replaced by a Studio field that would produce nothing visible · Sanity
draft/preview mode (Presentation tool).

The publish webhook is **built** (`app/api/revalidate-sanity/route.ts`) — a published edit is live on
the next request. It needs the one-time dashboard setup in `docs/09-DEV-RUNBOOK.md` §6a and only works
against a deployed URL, since Sanity cannot reach localhost.

### Not code

Email/SMS delivery is **built and working** — "Email the invitation" and the branded recovery template
both function. It needs an SMTP/Hubtel/Twilio account, not development. Until then the temporary-password
and copy-link routes cover portal access with no provider at all (`docs/04-AUTH-AND-PERMISSIONS.md` §2.3).

---

## Hardening backlog

Findings from the security review done while the database layer was being built. None is a
cross-tenant or privilege-escalation hole, which is why they were deferred rather than fixed at
the time. They have not all been re-checked since, so treat the list as leads rather than as a
current audit. The first item was confirmed still open when this list was written.

- **`is_active` is self-editable.** `0015_grants.sql` grants `UPDATE (... is_active)` on
  `profiles` to `authenticated`, and no later migration narrows it. Staff deactivation has since
  shipped as a feature, so a deactivated user holding a live session could set the flag back
  through PostgREST. Either drop `is_active` from that grant list and move the change into a
  Server Action, or enforce deactivation in auth and middleware so the flag stops being the
  thing that matters.
- **Test that a school admin cannot mint a super admin.** `0014` has a
  `role <> 'super_admin'` check. The column lock is covered by tests; the INSERT path is not.
- **`res_teacher_rw` is wider than the permission matrix.** Migration `0008` grants teachers
  `FOR ALL` on `results`, which includes DELETE. The matrix in
  `04-AUTH-AND-PERMISSIONS.md` says insert and update only. Split the policy.
- **Same-school constraint** on `class_subjects.teacher_id` and `classes.class_teacher_id`.
  Currently mitigated by the school predicate in the teacher policies; a constraint would make
  it structural.
- **`cs_select` and `fi_select` are school-readable.** Narrow them to the permission matrix if
  the assignment map and fee catalogue should be role-gated rather than readable by anyone in
  the school.
- **No Storage isolation test** for the `<school_id>/...` prefix policies in `0012`. Worth adding
  with the first real file upload.
- **No negative test for unsubmitted results.** Seed an unsubmitted result and assert the linked
  parent cannot read it, covering the `is_submitted` half of `res_parent_read`.
- **Positive tests could assert more.** Several check only that no error came back. Round-trip
  the persisted values instead.
- **`current_role()` shadows a reserved word.** Safe today because every call site
  schema-qualifies it. Rename to `current_user_role()` if a migration touches it anyway.

---

## MVP definition of done

- All four portals live; auth + RLS enforced across every table.
- A school can be operated end-to-end: setup → attendance → results → reports → parent view,
  with lightweight fees tracked.
- Every screen ships the four states; UI matches `docs/06-UI-UX-STANDARDS.md`.
- No cross-school data leakage (verified by tests).

---

## Post-MVP / future tracks

Sequenced later, not in MVP (from the spec's future list + deferred items):

- **Payments:** mobile money / online gateway on top of the fees module.
- **Notifications:** SMS and push (parent alerts for results, attendance, announcements).
- **Academics+:** homework/assignments, timetable management.
- **Operations:** payroll, inventory, library, transport, hostel management.
- **Native app:** React Native / Expo parent app on the same Supabase project.
- **Analytics:** AI-powered school analytics.

---

## Sequencing notes

- Phases 3–6 are ordered by data dependency, but Phase 4 (Marketing) can run in parallel
  with Phase 3 since it shares little beyond branding.
- Do not start a downstream portal before its upstream data model + RLS are solid — most
  rework risk lives in the tenancy boundary, so it must be right before UI is built on top.
