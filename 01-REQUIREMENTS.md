# 01 — MVP Requirements & Scope

Version 1.0 · Status: Planning / MVP

This document defines exactly what the MVP includes, per portal, and reconciles the written
specification with the supplied reference screenshots.

---

## Scope reconciliation (read first)

The original spec listed a lean MVP and parked Fees, SMS notifications, and richer academic
tooling as "future." The reference screenshots (Kiddiewise Admin + Teacher portals) show a
broader surface, and the instruction is that the screenshots represent *what the MVP should
include*. Where the two disagree, the screenshots win for scope.

| Module | Written spec | Screenshots | MVP decision |
|---|---|---|---|
| Auth, Students, Teachers/Staff, Parents | MVP | shown | **In** |
| Classes, Subjects | MVP | shown | **In** |
| Academic years & terms | MVP | (implied) | **In** |
| Attendance | MVP | shown | **In** |
| Results | MVP | shown | **In** |
| Announcements | MVP | (implied) | **In** |
| Admissions (inquiries) | Marketing MVP | admin nav item | **In** (see below) |
| **Assessments** | future-ish | admin + teacher nav | **In** |
| **Grading** | MVP results | dedicated nav | **In** |
| **Terminal reports** | not listed | admin nav | **In** |
| **Promotion** | not listed | admin nav | **In** |
| **Fees & payments** | future | full dashboard cards + trend | **In (lightweight)** |
| Dashboards with trend charts | not detailed | shown | **In** |
| SMS / push notifications | future | not shown | **Out** |
| Homework, timetable, payroll, library, transport, hostel | future | not shown | **Out** |
| Native mobile apps | future | n/a | **Out** (responsive web only) |

**"Fees (lightweight)"** means: define fee items, generate/record invoices and payments per
student, and surface revenue totals + a fee-collection trend on the admin dashboard. It does
**not** mean integrating a payment gateway (e.g. mobile money) — that is a later track. See
`docs/03-DATABASE.md`.

---

## Cross-cutting requirements

- **Multi-tenant:** every record scoped to a school; no cross-school visibility.
- **Roles:** super_admin, school_admin, teacher, parent (`docs/04-AUTH-AND-PERMISSIONS.md`).
- **Every screen** implements loading, empty, error, and success states.
- **Responsive** down to mobile widths.
- **GHS** for all currency.

---

## Authentication (all portals)

**In scope**
- Email / password sign-in
- Password reset (email link)
- Session management
- Role-based access and post-login routing to the correct portal

**Out of scope (future):** Google login, Apple login, phone authentication.

---

## Admin portal

Navigation (from the reference build): Dashboard · Students · Staff · Subjects · Classes ·
Admissions · Assessments · Fees · Grading · Terminal Reports · Promotion. Plus a user card
(name, role) and logout.

### Dashboard
Summary cards with month-over-month trend badges: **Total Students**, **Total Staff**,
**Total Revenue (GHS)**, **Attendance Rate**. Charts: **Fee Collection Trend** (monthly
revenue) and **Enrollment Trend** (students enrolled per month). Panels: **Recent
Activities**, **Upcoming Events**, and a **Class Performance Overview** table (Class Name,
Level, Students, Average Score, Performance). An **Export Report** action.
Sidebar shows live counts (e.g. Students 248, Staff 32).

### Student management
Create / edit / view students; assign parents; assign classes; manage enrollment status.
Student fields: full name, date of birth, gender, admission number, profile photo, class,
parent information, enrollment status.

### Parent management
Create parents; link parents to one or more students; view parent information.

### Teacher / staff management
Create teachers; assign them to classes and subjects.
Teacher fields: name, email, phone, subjects, classes, department (may be "No Department"),
staff ID (e.g. `TCH-1`).

### Academic management
Manage academic years, terms (First / Second / Third), classes, and subjects. Exactly one
active academic year and one active term per school at a time.

### Admissions
Receive and manage admissions inquiries submitted from the marketing site; move an inquiry
toward enrolment (review → accept → convert to a student record). MVP is inquiry management,
not a full application workflow.

### Assessments & grading
Configure assessment types and the grading scale (score → grade → remark). View and manage
results submitted by teachers. Grading defines how scores map to letter grades and comments.

### Terminal reports
Generate a per-student, per-term report (results across subjects, grades, teacher comments,
attendance summary) that parents can view and admins can export.

### Promotion
At end of year, promote students from one class/level to the next (or repeat), producing new
enrollments for the next academic year.

### Fees (lightweight)
Define fee items/structures per class or level; record invoices and payments per student;
feed the dashboard's revenue total and fee-collection trend. No online payment gateway in MVP.

### Announcements
Create and publish announcements; target audiences (Parents only / Teachers only / Everyone).

### Settings
Basic school profile and configuration (name, logo, active year/term).

---

## Staff (Teacher) portal

Navigation (from the reference build): Dashboard · Grade · Assessment · Attendance. Header
greeting ("Welcome back, {first name}"), profile chip, department, staff ID.

### Teacher dashboard
Summary cards: **Total Classes**, **Total Subjects**, **Total Students**, **Attendance
Rate**. **Quick actions:** Attendance (mark student attendance), Grade (manage grades), Exam
(create and grade exams), Assessment (student performance review). Panels: **My Classes**,
**My Subjects**, **Academic Year** (active term), **Recent Activities**. Empty states where a
teacher has nothing assigned yet ("No classes assigned yet").

### Attendance
Select class → select date → mark attendance per student; update existing attendance.
Statuses: **Present**, **Absent**, **Late**.

### Results / grade
Select class → select subject → enter scores → submit results. Grades derive from the school's
grading scale.

### Exams & assessments
Create exams, record assessment scores, and review student performance for assigned classes.

Teachers only ever see and act on **their assigned** classes and subjects.

---

## Parent portal

### Parent dashboard
Children list, recent announcements, attendance summary, and latest results.

### Child profile
Per child: student information, class, and teachers.

### Attendance
Per child: attendance history and attendance percentage.

### Results
Per child: examination results, grades, and teacher comments. Access to terminal reports for
the term.

Parents have **read-only** access, scoped to their own linked children.

---

## Marketing website

Public pages: **Home** (hero, intro, features, CTA) · **About** (history, mission, vision) ·
**Admissions** (process, requirements, contact — submits an inquiry into the Admin portal) ·
**News** (updates, events) · **Gallery** (images, activities) · **Contact** (address, phone,
email, contact form).

The admissions and contact forms write into the platform (inquiries / messages) so admins can
act on them.

---

## Explicitly out of scope for MVP

SMS and push notifications; homework and assignments; timetable management; payroll;
inventory; library; transport; hostel management; native mobile apps; online payment
gateways; AI-powered analytics. These are tracked in `docs/08-ROADMAP.md` as future work.
