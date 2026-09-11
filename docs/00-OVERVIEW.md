# 00 — Product Overview

Version 1.1 · Status: reflects the wired backend

---

## Vision

A modern, scalable school management platform that helps schools run their daily operations
digitally and improves communication between administrators, teachers, and parents. It
replaces fragmented, manual processes — paper attendance registers, hand-prepared result
sheets, disconnected parent communication, and slow admin workflows — with one coherent
system.

The product should feel like a premium SaaS tool: simple, fast, reliable, intuitive. The
goal is not to build "another dashboard." The goal is software that schools genuinely enjoy
using and trust with their operations.

---

## Market context

- **Primary market:** Ghana. Currency is displayed and stored in **Ghana Cedi (GHS)**.
- **Reference deployment:** *Kiddiewise School Complex* (`kiddiewise-zeta.vercel.app`). Its Admin
  and Teacher portals are the working baseline for scope and visual direction.
- **Buyer / operator:** private and semi-private schools ("complexes" / K–12) with an
  administrator who owns setup and day-to-day operations.
- **Multi-school by design:** the platform hosts many independent schools. One school's data
  is invisible to another. This is a foundational constraint, not a later feature.

---

## The five product surfaces

The platform is one system exposed through five connected surfaces.

### 1. Marketing website (public)
A public-facing site for a school. Presents the school, showcases programs, handles admissions
inquiries, displays news and events, and builds trust with prospective parents.
Users: prospective parents, students, visitors.

### 2. Admin portal
The operational control centre. Admins manage students, teachers, parents, classes, subjects,
the academic structure (years/terms), announcements, fees, assessments and grading, terminal
reports, promotion, and school settings; and they view reports.
Users: school administrators, management staff, account officers.

### 3. Staff portal
A focused workspace for teachers. View assigned classes and subjects, mark attendance, enter
and manage results/grades, create and grade exams and assessments, and read announcements.
Users: teachers and academic staff.

### 4. Parent portal
A monitoring and communication surface for guardians. View their children's information, track
attendance and attendance percentage, view results/grades and teacher comments, read
announcements, and see the school calendar.
Users: parents / guardians.

### 5. Backend platform
The central system powering all of the above: authentication, authorization, database, file
storage, notifications, business logic, and data security. Built on Supabase.

---

## Goals

- Let a school go from zero to operational: register students and teachers, organise classes
  and subjects, set up the academic year, take attendance, record results, publish reports,
  and keep parents informed.
- Deliver a genuinely polished experience — excellent typography, consistent spacing, clear
  hierarchy, fast interactions, and thoughtful loading / empty / error / success states on
  every screen.
- Build on a production-quality relational foundation (PostgreSQL + RLS) that scales to many
  schools without a rewrite.

## Non-goals (for now)

- Not building every conceivable school feature. Depth on the core workflows beats breadth.
- No native mobile apps in the MVP; the MVP is a responsive web experience. A React
  Native / Expo parent app is a future track.
- No custom backend service layer where Supabase primitives suffice — avoid unnecessary
  backend complexity during MVP.

Deferred modules (candidates for later, not MVP): SMS/push notifications, homework &
assignments, timetable management, payroll, inventory, library, transport, hostel
management, and AI-powered analytics.

> **Scope note:** the reference screenshots show several modules the original written spec
> parked as "future" — **Fees**, **Assessments/Grading**, **Terminal Reports**, and
> **Promotion**. Because the screenshots represent "what the MVP should include," these are
> treated as **in scope** for the MVP. The reconciliation is documented in
> `docs/01-REQUIREMENTS.md`.

---

## What "premium" means here

Design inspiration: Apple, Linear, Notion, Stripe, Vercel. In practice that means:

- Restraint over decoration — no excessive gradients, no oversized empty cards, no clutter.
- Every feature considers loading, empty, error, and success states.
- Smooth, purposeful animation; fast perceived performance.
- Helpful error messages and thoughtful empty states, not dead ends.

Full design system in `docs/06-UI-UX-STANDARDS.md`.

---

## Success criteria for the MVP

1. A new school can be set up end-to-end by an admin without engineering help.
2. A teacher can mark attendance and enter results for their assigned classes in minutes.
3. A parent can log in and see, for each child, up-to-date attendance and results.
4. No user can ever see another school's data.
5. The product looks and feels like something a school would happily pay for.
