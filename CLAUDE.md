# CLAUDE.md

Working notes for Claude when maintaining this repository.

**Read [README.md](README.md) first**, then the doc in `docs/` that covers the area you are
touching. This file deliberately does not restate what those say: the project description, stack,
repo layout, roles, conventions and current state all live in the README, and duplicating them here
would create exactly the second source of truth this codebase forbids. If something below conflicts
with the README, the README wins and this file needs fixing.

---

## Non-negotiables

The README's "Conventions that matter" section carries the four that shape the code: every record
belongs to a school, RLS is the security boundary rather than the UI, data flows one way through the
layers, and facts are derived rather than duplicated. Read them there. Breaking one of those is
where nearly all rework in this project has come from.

Two more that are worth stating because they are about judgement rather than structure:

- **Simple over clever.** No premature abstraction, no speculative generality, no quick fix that
  leaves debt. Boring and readable beats ingenious.
- **Restraint is the aesthetic.** No generic dashboards, gradient overload, oversized empty cards or
  cluttered layouts. If a screen looks like a template, it is not done.

## How to work here

- **Research before building.** For any unfamiliar Supabase or Next.js behaviour, read the official
  docs. Do not guess at RLS policies or App Router caching.
- **Plan before code.** Non-trivial work starts with a short written plan: what, where, data model
  impact, states, edge cases.
- **Ask when requirements are unclear.** Do not invent product behaviour. Surface the ambiguity,
  propose options, wait for a decision.
- **Schema changes are migrations.** Never hand-edit the database through the Supabase dashboard.
  Migrations in `supabase/migrations/` are the source of truth, and they are already applied in
  production, so treat them as append-only.
- **Keep the docs honest.** If reality diverges from `README.md` or a file in `docs/`, fix the doc in
  the same change.

## Definition of done

- [ ] Data model and RLS migration written and applied
- [ ] Zod schema authored, types generated from Supabase
- [ ] All four UI states: loading, empty, error, success
- [ ] Scoped to `school_id`, and verified a user cannot read another school's data
- [ ] Responsive down to phone widths
- [ ] No `any`, no unused code, no console noise
- [ ] Matches `docs/06-UI-UX-STANDARDS.md`
- [ ] `pnpm typecheck && pnpm lint && pnpm test:unit && pnpm test:rls && pnpm test:integration`
- [ ] **Verified in the running app, not just in tests.** Several bugs here passed every suite and
      only appeared on screen. `docs/09-DEV-RUNBOOK.md` section 8 lists them.

## What not to do

- Do not build outside the scope in `docs/01-REQUIREMENTS.md` without agreeing it first.
- Do not weaken or bypass RLS to make something work for now.
- Do not scatter business logic across components. It belongs in `lib/`.

## House style

The repository was deliberately cleaned of machine-authored tics so that a human maintainer reads
code rather than an essay. Do not reintroduce them:

- No `Co-Authored-By` trailers or tool names in commit messages.
- No invented comment conventions. Plain `TODO:` rather than bespoke markers, and no cross-references
  to numbered rules in this file.
- Comments explain why, briefly. Ordinary punctuation over em dashes, normal case over CAPITALISED
  emphasis, and a header should not be longer than the code beneath it.
- Status tables use words, not emoji.

When editing comments or docs in bulk, two invariants keep it safe and are worth re-checking: em
dashes outside comments must not change, because they appear in marketing copy, in generated PDFs and
as the `"—"` empty-cell placeholder in tables; and migration SQL must stay byte-identical once `--`
comments are stripped.
