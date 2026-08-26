-- 0017_fees_catchup.sql
-- The Fees module shipped three concepts the schema never modelled: fee scope as a term enum
-- (Full Year / First / Second / Third rather than a single term FK), per-student scholarships and
-- arrears, and a whole Extra Fees surface (bus, feeding, uniform...) with its own definitions and
-- per-student assignments. This migration makes the schema match what lib/validators/fees.ts
-- already contracts.
--
-- It also removes two stored duplicates. `invoices.amount_paid` and `invoices.status` restated
-- facts that `payments` already owns, and the UI already derives both. They are dropped here and
-- derived in 0018 instead.

create type fee_term as enum ('full_year','first','second','third');
create type scholarship_type as enum ('none','partial','full','bursary');
create type extra_fee_frequency as enum ('one_time','termly','monthly','annual');

-- ---------------------------------------------------------------------------
-- fee_items, a reusable fee definition for a class + year (+ term scope)
-- ---------------------------------------------------------------------------
alter table public.fee_items
  add column fee_term     fee_term not null default 'full_year',
  add column due_date     date,
  add column late_fee     numeric,
  add column description  text,
  add column is_mandatory boolean not null default true,
  -- Replaced by fee_term: a full-year fee spans every term, so a single term FK could not
  -- express it. School-wide (class-less) charges are now modelled as extra_fee_items below,
  -- which is where the UI actually exposes an "All classes" scope, so class_id is required here.
  drop column term_id,
  alter column class_id set not null;

alter table public.fee_items
  add constraint fee_items_amount_positive check (amount > 0),
  add constraint fee_items_late_fee_nonneg check (late_fee is null or late_fee >= 0);

-- ---------------------------------------------------------------------------
-- invoices, one student's fee position for a (year, fee_term) scope
-- ---------------------------------------------------------------------------
alter table public.invoices
  add column fee_term         fee_term not null default 'full_year',
  -- Cedi amount taken off the gross fee, not a percentage. The assign dialog collects a percent
  -- (bulkAssignFeesSchema.discount, 0–100); the action resolves it to an amount so the stored
  -- figure stays correct even if the gross fee is later edited.
  add column discount         numeric not null default 0,
  -- Balance carried forward from a previous term/year. Added to total_amount when computing what
  -- is due, but tracked separately so the UI can show it as its own column.
  add column arrears          numeric not null default 0,
  add column scholarship_type scholarship_type not null default 'none',
  -- Null for a full-year invoice, which belongs to no single term.
  alter column term_id drop not null,
  -- Derived from `payments` in 0018, never stored.
  drop column amount_paid,
  drop column status;

drop type invoice_status;

alter table public.invoices
  add constraint invoices_discount_nonneg check (discount >= 0),
  add constraint invoices_arrears_nonneg check (arrears >= 0),
  -- A student has at most one invoice per (year, scope), so bulk assign can upsert idempotently.
  add constraint invoices_student_year_term_key unique (student_id, academic_year_id, fee_term);

-- ---------------------------------------------------------------------------
-- Extra fees, optional charges outside the core class fee
-- ---------------------------------------------------------------------------
create table public.extra_fee_items (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  name text not null,
  description text,
  amount numeric not null check (amount > 0),
  frequency extra_fee_frequency not null default 'one_time',
  -- null = applies to all classes (the UI's "All classes" scope).
  class_id uuid references public.classes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (school_id, name)
);
create index extra_fee_items_school_id_idx on public.extra_fee_items(school_id);

create table public.extra_fee_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  extra_fee_item_id uuid not null references public.extra_fee_items(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  -- Copied off the item at assign time, then editable per student: a sibling discount or a
  -- part-term joiner pays a different amount than the item's list price.
  amount numeric not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (extra_fee_item_id, student_id)
);
create index extra_fee_assignments_school_id_idx on public.extra_fee_assignments(school_id);
create index extra_fee_assignments_student_idx on public.extra_fee_assignments(student_id);

-- ---------------------------------------------------------------------------
-- payments, now the single source of truth for money received against EITHER
-- a class-fee invoice or an extra-fee assignment
-- ---------------------------------------------------------------------------
alter table public.payments
  alter column invoice_id drop not null,
  add column extra_fee_assignment_id uuid
    references public.extra_fee_assignments(id) on delete cascade,
  add constraint payments_amount_positive check (amount > 0),
  -- Exactly one target: a payment settles an invoice or an extra fee, never both, never neither.
  add constraint payments_one_target
    check ((invoice_id is not null) <> (extra_fee_assignment_id is not null));

create index payments_invoice_idx on public.payments(invoice_id);
create index payments_extra_assignment_idx on public.payments(extra_fee_assignment_id);

-- ---------------------------------------------------------------------------
-- RLS, same shape as 0011: admins manage, parents read their own child's rows
-- ---------------------------------------------------------------------------
alter table public.extra_fee_items enable row level security;
alter table public.extra_fee_assignments enable row level security;

create policy efi_admin on public.extra_fee_items for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());
create policy efi_select on public.extra_fee_items for select to authenticated
  using (school_id = public.current_school_id());

create policy efa_admin on public.extra_fee_assignments for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());
create policy efa_parent_read on public.extra_fee_assignments for select to authenticated
  using (school_id = public.current_school_id() and public.parent_of_student(student_id));

-- Parents could not previously read payments at all, so a fee balance could not be shown in the
-- parent portal without leaking the rest of the school's ledger. Scope it to their own children.
create policy pay_parent_read on public.payments for select to authenticated
  using (school_id = public.current_school_id() and public.parent_of_student(student_id));

-- 0015's `grant ... on all tables in schema public` applied only to the tables that existed when
-- it ran; it is not a standing rule. Tables added later need their own grants or every request
-- is denied at the privilege layer before RLS is even consulted.
grant all on public.extra_fee_items, public.extra_fee_assignments to service_role;
grant select, insert, update, delete
  on public.extra_fee_items, public.extra_fee_assignments to authenticated;
