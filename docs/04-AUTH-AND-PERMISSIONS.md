# 04 — Authentication & Permissions

Version 1.1 · Status: reflects the wired backend

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

### 2.2 Password reset / first-time setup
1. User requests a link on `/reset-password` (enter email).
2. Supabase emails a one-time link (branded template, `supabase/templates/recovery.html`). The same
   template covers *setting* a first password and *resetting* a forgotten one, so its wording avoids
   the word "reset" — an invitee never had one.
3. The link opens `/update-password`, which **adopts the session the link carries** via `setSession`,
   strips the tokens from the address bar, and lets them choose a password.

> **`/update-password` must never fall back to the session already in the browser.** It shipped that
> way once and was a real hijack: an admin who invited a parent from the office computer, then let that
> parent open the link there, had their **own** password set by the parent (confirmed in the auth audit
> log). The page now refuses any session that did not come from the link — with exactly one exception,
> §2.3.1 — and otherwise shows "this link has expired".

### 2.3 Admin-provisioned accounts (teachers & parents)
Teachers and parents **do not self-register**. Nobody can exist here without an auth record either,
because `profiles.id` is a foreign key to `auth.users(id)`.

A `school_admin` creates them, and the same shape applies to both:

1. Admin fills a create form (name, email, role, school-specific fields).
2. A **Server Action** (`lib/actions/_server.ts#provisionUser`, service-role) creates the
   `auth.users` record, then the `profiles` row with the correct `school_id` and `role`. If the profile
   insert fails, the auth account is deleted — otherwise a half-created person holds the email address
   hostage and the admin can never retry.
3. Creating the account **issues a temporary password** (§2.3.1), shown to the admin once. Nothing is
   emailed: the admin hands it over. An admin who would rather never learn the password can instead
   send a one-time link (§2.3.2) — that route is available for both staff and parents, at any time.

There is **no `provision-user` Edge Function**, despite older notes referring to one. The Server
Actions already run server-side, so the service key never reaches the browser either way; a second
deployable would add no security.

#### 2.3.1 Temporary password at admission (the default route)
Email and SMS both need a provider that takes weeks to approve in Ghana, and the parent is standing at
the desk anyway. So the primary route needs no provider at all:

1. `createParent` / `createStaff` generate a readable temporary password — `Harmattan-46589-Heron`,
   shaped to survive handwriting and a phone call: words not character soup, and no `0`/`O`/`1`/`l`.
   ~74 million combinations (`lib/temp-password.ts`).
2. It is shown **once**. Passwords are bcrypt hashes, so it cannot be shown again; "Send credentials"
   **reissues** a new one rather than revealing the old. Keeping plaintext to allow a true re-copy
   would expose every parent's password to any admin and to any breach.
3. `must_change_password` is set. **Middleware** holds the holder on `/update-password` until they
   replace it — enforced there, not in the app shell, so it survives JavaScript being disabled and
   cannot be skipped with a deep link. This is the one case where `/update-password` may use the
   existing session: they proved knowledge of that credential to get there.
4. On success, `complete_password_change()` clears the flag and stamps `password_changed_at`. The
   temporary password dies with it, so the admin loses access.
5. **Unused temporary passwords expire after 30 days**, rejected at login. This is the real security
   boundary: until the holder takes ownership, the admin who issued the credential can read that
   child's records, and an unbounded window would leave that open forever.

The Parents and Staff screens both show this state per row (`Active` / `Awaiting first sign-in` /
`Password expired`), so the office can see whose password they still know. Parents additionally carry
a running count across the list.

#### 2.3.2 Invite link (the route where the admin never learns the password)
`invitePortalUser` either hands the admin a copyable one-time link (`generateLink` — sends nothing, so
no provider needed; the school pastes it into WhatsApp) or emails it. A **recovery** link is used
rather than an invite one because the account already exists and `inviteUserByEmail` rejects a
registered address. The target's email is looked up through the **caller's** client, so RLS stops an
admin inviting into another school.

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
6. `profiles.is_active` can only be changed by a school admin, and never on their own row.
   Enforced by a trigger (migration `0036`) rather than by a grant, because an admin holds the same
   `authenticated` privileges as everyone else and RLS cannot restrict a single column. It matters
   because deactivation is a security state: an inactive staff member is banned from signing in, and
   banning an auth user does not invalidate a token already issued to them.
6. Sensitive files (terminal reports) are served via short-lived signed URLs scoped to
   authorized viewers.
