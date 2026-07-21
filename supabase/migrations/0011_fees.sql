-- 0011_fees.sql
create table public.fee_items (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  name text not null,
  amount numeric not null,
  class_id uuid references public.classes(id) on delete set null,   -- null = all/level
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  term_id uuid references public.terms(id) on delete set null
);
create index fee_items_school_id_idx on public.fee_items(school_id);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  term_id uuid not null references public.terms(id) on delete restrict,
  total_amount numeric not null default 0,
  amount_paid numeric not null default 0,
  status invoice_status not null default 'unpaid',
  due_date date,
  created_at timestamptz not null default now()
);
create index invoices_school_id_idx on public.invoices(school_id);
create index invoices_student_idx on public.invoices(student_id);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  fee_item_id uuid references public.fee_items(id) on delete set null,
  description text not null,
  amount numeric not null
);
create index invoice_items_school_id_idx on public.invoice_items(school_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  amount numeric not null,
  method payment_method not null,
  reference text,
  paid_at timestamptz not null default now(),
  recorded_by uuid references public.profiles(id) on delete set null
);
create index payments_school_id_idx on public.payments(school_id);
create index payments_paid_at_idx on public.payments(school_id, paid_at);

alter table public.fee_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;

create policy fi_admin on public.fee_items for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());
create policy fi_select on public.fee_items for select to authenticated
  using (school_id = public.current_school_id());

create policy inv_admin on public.invoices for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());
create policy inv_parent_read on public.invoices for select to authenticated
  using (school_id = public.current_school_id() and public.parent_of_student(student_id));

create policy ii_admin on public.invoice_items for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());
create policy ii_parent_read on public.invoice_items for select to authenticated
  using (
    school_id = public.current_school_id()
    and exists (
      select 1 from public.invoices i
      where i.id = invoice_items.invoice_id and public.parent_of_student(i.student_id)
    )
  );

create policy pay_admin on public.payments for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());
