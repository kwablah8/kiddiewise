# 08 — Roadmap

Version 1.0 · Status: Planning / MVP

Delivery sequence. The order follows a simple logic: **admins create the data every other
portal depends on**, so the platform foundation and Admin portal come first, then the
audiences that consume that data.

---

## Phase 1 — Documentation (this set)

Requirements, architecture, database design, user flows, permissions, standards. Establishes
the source of truth before any code. **Status: in progress (this folder).**

Deliverables: `CLAUDE.md` + `docs/00`–`docs/08`.

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

---

## Phase 4 — Marketing website

Public presence + inbound funnel into the platform.

- Home, About, Admissions, News, Gallery, Contact.
- Admissions/contact forms writing to `admissions_inquiries` (anonymous INSERT, rate-limited).
- Shared brand + typography; separate from the app shell.

Exit criteria: a visitor can learn about the school and submit an inquiry that lands in Admin.

---

## Phase 5 — Staff (Teacher) portal

Consumes the academic structure admins created.

- Teacher shell + dashboard (classes, subjects, students, attendance rate, quick actions).
- Attendance: select class/date, mark present/absent/late, edit.
- Assessments/exams: create, enter scores, auto-grade, submit results.
- Performance review views.
- All scoped to the teacher's assignments (RLS-enforced).

Exit criteria: a teacher can mark attendance and submit results for their classes.

---

## Phase 6 — Parent portal

Read-only monitoring for guardians; depends on submitted teacher data + published reports.

- Parent shell + dashboard (children, announcements, attendance summary, latest results).
- Child profile, attendance history + percentage, results, published terminal reports.
- Scoped to linked children (RLS-enforced).

Exit criteria: a parent sees accurate, up-to-date data for each linked child and nothing else.

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
