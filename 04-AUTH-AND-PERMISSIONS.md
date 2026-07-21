# 04 — Authentication & Permissions

Version 1.0 · Status: Planning / MVP

Auth uses **Supabase Auth**. Authorization is enforced primarily by **RLS**
(`docs/03-DATABASE.md`); the UI mirrors those rules for UX but is never the security boundary.

---

## 1. Roles

| Role | Scope | Summary |
|---|---|---|
| `super_admin` | Platform | Owns the platform. Manages schools and platform settings. No `school_id`. |
| `school_admin` | One school | Runs a school: users, students, academics, fees, announcements, reports. |
| `teacher` | Own assignments | Marks attendance, enters results, runs assessments for assigned classes/subjects. |
| `parent` | Own children | Read-only view of their linked children's data. |

A user's role and `school_id` live on their `profiles` row and are resolved from `auth.uid()`.
Role is assigned at account creation and is not self-editable.

---

## 2. Authentication flows

### 2.1 Sign in (all portals)
1. User submits email + password on `/login`.
2. Supabase Auth validates → sets the session cookie.
3. Middleware confirms the session and the `(app)` layout loads the `profiles` row.
4. User is redirected to their portal home by role (see §4).

### 2.2 Password reset
1. User requests reset on `/reset-password` (enter email).
2. Supabase sends a reset email with a secure link.
3. Link opens `/update-password`; user sets a new password; session established.

### 2.3 Admin-provisioned accounts (teachers & parents)
Teachers and parents **do not self-register**. A `school_admin` creates them:
1. Admin fills a create form (name, email, role, school-specific fields).
2. A **server-side** path (Edge Function `provision-user` or trusted server action using the
   service-role key) creates the `auth.users` record + the `profiles` row with the correct
   `school_id` and `role`.
3. The new user receives an invite / set-password email and chooses their password.

The service-role key is **server-only** and never shipped to the client. The provisioning
path verifies the caller is a `school_admin` for the target `school_id` before acting.

### 2.4 School & super_admin creation
- `super_admin` accounts are created out-of-band (seeded / manual) — there is no public path
  to become one.
- A `super_admin` creates a school and its first `school_admin`; that admin then provisions
  the rest of the school's users.

### 2.5 Sessions
- Session cookies are refreshed by middleware on navigation.
- Sign-out clears the session and returns the user to `/login`.
- Future (not MVP): Google / Apple / phone auth.

---

## 3. Route protection

Two layers, always both:

1. **Middleware** — refreshes the session and blocks unauthenticated access to `(app)`
   routes, redirecting to `/login`. Public `(marketing)` and `(auth)` routes are open.
2. **`(app)` layout guard** — loads the profile, and gates subtrees by role:
   - `/dashboard` and admin modules → `school_admin`, `super_admin`
   - `/teacher/*` → `teacher`
   - `/parent/*` → `parent`
   A user hitting a subtree they don't own is redirected to their own portal home.

Route protection is convenience + correct UX. **RLS still independently protects the data**,
so even a forged request to another portal's API returns nothing.

---

## 4. Post-login routing

| Role | Lands on |
|---|---|
| `super_admin` | Platform/admin dashboard (`/dashboard`) |
| `school_admin` | `/dashboard` |
| `teacher` | `/teacher/dashboard` |
| `parent` | `/parent/dashboard` |

---

## 5. Permission matrix

`✓` = allowed, `R` = read-only, `own` = restricted to own assignments/children, `—` = none.

| Capability | super_admin | school_admin | teacher | parent |
|---|:--:|:--:|:--:|:--:|
| Manage schools / platform settings | ✓ | — | — | — |
| Manage school settings (year/term, profile) | ✓ | ✓ | — | — |
| Create/manage users (teachers, parents) | ✓ | ✓ | — | — |
| Manage students & enrollment | ✓ | ✓ | R (own classes) | — |
| Link parents ↔ students | ✓ | ✓ | — | — |
| Manage classes, subjects, assignments | ✓ | ✓ | R (own) | — |
| Manage academic years & terms | ✓ | ✓ | R | — |
| Mark / update attendance | ✓ | ✓ | ✓ own | R (own children) |
| Create assessments / exams | ✓ | ✓ | ✓ own | — |
| Enter / submit results | ✓ | ✓ | ✓ own | R (own children) |
| Configure grading scale & assessment types | ✓ | ✓ | R | — |
| Generate / publish terminal reports | ✓ | ✓ | R (own) | R (published, own children) |
| Promote students | ✓ | ✓ | — | — |
| Manage fees, invoices, record payments | ✓ | ✓ | — | R (own children, if exposed) |
| Create / publish announcements | ✓ | ✓ | R (targeted) | R (targeted) |
| Manage events / calendar | ✓ | ✓ | R | R |
| Handle admissions inquiries | ✓ | ✓ | — | — |
| View own children's data | — | — | — | ✓ |

This matrix is the specification RLS policies must implement. If the UI and this table
disagree, the table (and RLS) are correct.

---

## 6. Data-scope rules (how "own" is defined)

- **Teacher "own":** classes/subjects where the teacher appears in `class_subjects.teacher_id`
  or `classes.class_teacher_id`. All teacher writes (attendance, assessments, results) are
  gated by an `EXISTS` check against those assignments.
- **Parent "own children":** students linked to the parent via `student_guardians`. Every
  parent read policy joins through that table.
- **Admin "own school":** everything with `school_id = current_school_id()`.
- **Super admin:** cross-school, but only on platform-level tables.

---

## 7. Security invariants

1. `school_id` is never trusted from client input — it is derived from the caller's profile.
2. RLS is enabled on every table; there are no "temporarily open" tables.
3. The service-role key exists only in server/Edge contexts.
4. The only anonymous write is `admissions_inquiries` (INSERT-only, rate-limited).
5. Roles are assigned server-side; users cannot escalate their own role.
6. Sensitive files (terminal reports) are served via short-lived signed URLs scoped to
   authorized viewers.
