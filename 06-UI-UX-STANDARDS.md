# 06 — UI / UX Standards

Version 1.0 · Status: Planning / MVP

The design system, derived from the reference build (Kiddiewise Admin + Teacher portals).
The bar is premium SaaS — Apple / Linear / Notion / Stripe / Vercel restraint. Values below
are read from the screenshots; **confirm exact hex against the brand kit before locking.**

---

## 1. Design principles

- **Restraint is the aesthetic.** No excessive gradients, no oversized empty cards, no
  clutter. White space and hierarchy do the work.
- **Every screen has four states:** loading, empty, error, success. None are afterthoughts.
- **Typography and spacing carry the polish** — consistent scale, clear hierarchy.
- **Fast and calm.** Subtle, purposeful motion; instant-feeling interactions.
- **Helpful over decorative.** Empty states explain and guide; errors tell the user what to do.

Avoid: generic dashboards, AI-generated-looking layouts, gradient overload, poor spacing,
huge unnecessary cards, cluttered interfaces.

---

## 2. Brand & color tokens

### Brand
- **Sidebar / brand surface:** deep **maroon → near-black vertical gradient**
  (approx `#5C1B22` at top → `#2A0C10` at bottom). This is the signature surface across all
  authenticated portals.
- **Primary accent (admin):** **forest green** (approx `#15803D` / `#1E7A46`) — used for the
  page title, primary links ("View All", "View Calendar"), and positive trend text.

### Semantic
| Token | Approx | Use |
|---|---|---|
| `--bg` | `#F7F8FA` | app background |
| `--surface` | `#FFFFFF` | cards, panels |
| `--border` | `#ECEEF1` | hairline card/table borders |
| `--text` | `#111827` | primary text, numerals |
| `--muted` | `#6B7280` | secondary text, subtitles |
| `--label` | `#9CA3AF` | small uppercase labels / table headers |
| `--primary` | `#15803D` | primary actions, links, positive |
| `--success-bg` / `--success-fg` | `#E7F6EC` / `#15803D` | trend pills ("+12%") |
| `--warning-bg` | `#FEF3C7` | amber icon chips / warnings |
| `--danger` | `#DC2626` | destructive actions, logout, errors |

### Stat-card icon chips
Soft, low-saturation tinted squares behind each metric icon: green, amber, and (teacher
portal) blue / indigo / purple variants. Chips are decorative accents, not full-color blocks.

---

## 3. Typography

- **Family:** clean grotesk/geometric sans (Inter or Geist). One family throughout.
- **Scale (suggested):**
  | Role | Size / weight |
  |---|---|
  | Page title | ~28–32px, semibold (green in admin, near-black in teacher) |
  | Section title | ~18–20px, semibold |
  | Card metric | ~28–32px, bold |
  | Body | 14–16px, regular |
  | Subtitle / muted | 13–14px, regular, `--muted` |
  | Label / table header | 11–12px, medium, uppercase, tracked, `--label` |
- Numbers (metrics, GHS, percentages) are **bold** and high-contrast.

---

## 4. Spacing, radius, elevation

- **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32. Cards use generous internal padding (~24px).
- **Radius:** cards `~16px` (2xl), buttons/inputs `~10px`, pills fully rounded, icon chips `~12px`.
- **Elevation:** flat with a hairline `--border` and a very soft shadow. Avoid heavy shadows.
- **Grid:** dashboard metrics in a 4-up row (wraps to 2-up / 1-up on smaller widths); content
  panels in 2-up rows.

---

## 5. Layout patterns

### App shell
- **Left sidebar** (maroon gradient), fixed, collapsible (note the collapse chevron in the
  admin build): brand block at top, section label ("MAIN MENU"), nav items with leading icons,
  optional count badges (e.g. Students `248`), a **user card** near the bottom (avatar +
  name + role), and **Logout** in danger red.
- Active nav item: subtle lighter-maroon pill + white text; inactive items muted white.
- **Main area:** light background, page header (title + one-line subtitle), optional
  top-right primary action ("Export Report"), then content.

### Dashboard composition (reference)
1. Row of **metric cards** with trend pills.
2. Row of **chart cards** (e.g. Fee Collection Trend, Enrollment Trend).
3. Row of **list panels** (Recent Activities, Upcoming Events) with a green "View all" link.
4. **Data table** section (Class Performance Overview).

### Quick actions (teacher portal)
A labelled row of action cards (icon + title + one-line description + trailing arrow) for
common tasks: Attendance, Grade, Exam, Assessment.

---

## 6. Components

- **Metric card:** tinted icon chip · muted label · bold number · trend pill
  ("↗ +12% from last month"). Currency as `GHS 0`.
- **Chart card:** bold title · muted subtitle (units) · chart · designed empty state.
- **List panel:** header + right-aligned link · rows · empty state.
- **Data table:** uppercase muted column headers, comfortable row height, right-aligned
  numerics, status shown as a pill, row hover. Paginate long lists.
- **Buttons:** primary (green, solid), secondary (outline, e.g. Export Report), destructive
  (red). Clear focus rings.
- **Forms:** RHF + Zod; labels above inputs; inline validation messages; disabled+spinner on
  submit; never lose entered data on error.
- **Badges/pills:** counts (neutral), status (semantic), trends (success/danger tint).
- **Profile chip:** avatar (initials fallback, e.g. `KM`) + name + status/role.

---

## 7. The four states (mandatory per feature)

| State | Standard |
|---|---|
| **Loading** | Skeletons that match final layout (not spinners-on-blank). Cards/tables show shaped placeholders. |
| **Empty** | Calm, centered, muted message that explains what's missing and (where useful) a CTA. Reference tone: *"No fee data available"*, *"No classes assigned yet"*, *"No active term"*. |
| **Error** | Human message + a retry action. Never a raw stack trace or silent failure. |
| **Success** | Immediate feedback (toast / inline), optimistic where safe, and the UI reflects the new state. |

---

## 8. Per-portal theming

- **Shared:** maroon sidebar, neutral content canvas, same components and tokens.
- **Admin:** green primary accent; green page titles; dense operational surfaces.
- **Teacher:** friendlier tone (greeting with a small emoji, e.g. "Welcome back, Koo! 👋"),
  multi-color metric chips (blue/green/amber/indigo), prominent Quick Actions.
- **Parent:** calm, read-focused, child-centric cards; minimal actions.
- **Marketing:** separate public visual system (hero, sections) sharing brand color and
  typography but not the app shell.

---

## 9. Formatting conventions

- **Currency:** `GHS` prefix, thousands separators, 2 decimals where needed (`GHS 12,500.00`).
- **Percentages:** integer where sensible (`0%`, `94%`).
- **Dates:** locale-appropriate, unambiguous (e.g. `21 Jul 2026`).
- **Names/initials:** avatar falls back to initials (`AA`, `KM`).
- **Trends:** arrow + signed percent + period ("+12% from last month").

---

## 10. Iconography & motion

- **Icons:** one consistent line-icon set (e.g. Lucide), moderate stroke weight.
- **Motion:** short (~150–250ms), ease-out; used for entrance, hover, and state changes.
  Respect `prefers-reduced-motion`.

---

## 11. Accessibility

- Meet WCAG AA contrast — verify text on the maroon sidebar and green accents.
- Full keyboard navigation; visible focus states.
- Real labels on all inputs; ARIA where components are custom.
- Color is never the only signal (pair status color with text/icon).
- Works down to mobile widths (parent-facing screens especially).

---

## 12. Do / Don't

**Do:** whitespace, clear hierarchy, skeleton loaders, designed empty states, consistent
tokens, restrained accents, fast feedback.

**Don't:** gradient overload, huge empty cards, cramped tables, spinner-on-blank loading,
raw error dumps, mixing icon sets, inventing one-off colors outside the tokens.
