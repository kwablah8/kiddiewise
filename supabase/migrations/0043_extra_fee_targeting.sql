-- 0043_extra_fee_targeting.sql
--
-- Extra fees become something an admin can actually bill with, rather than a catalogue only the seed
-- script could charge against.
--
-- 1. An extra fee can be offered to several classes, not just one or all. The single nullable
--    `extra_fee_items.class_id` becomes a link table; no rows still means every class.
-- 2. A charge belongs to a billing period. `extra_fee_assignments` gains the academic year and term
--    (and, for monthly fees, the month) it bills for, so a termly bus fee can be charged again next
--    term instead of being blocked by a once-ever unique key. The class shown on a charge now comes
--    from the enrollment in the charge's own year, the same way student_fee_positions joins on the
--    invoice's year, which replaces 0032's active-year join.
-- 3. Money is never deleted as a side effect. Deleting a fee used to cascade to its charges, and a
--    charge to its payments. Both FKs become NO ACTION, so the database refuses to drop a charged
--    fee or a paid charge. NO ACTION rather than RESTRICT because it is checked at the end of the
--    statement: deleting a student still cascades their charges and payments together.

-- ---------------------------------------------------------------------------
-- Which classes a fee is offered to. No rows = all classes.
-- ---------------------------------------------------------------------------
create table public.extra_fee_item_classes (
  extra_fee_item_id uuid not null references public.extra_fee_items(id) on delete cascade,
  -- Restrict: dropping a class must not silently widen its fees to every class.
  class_id uuid not null references public.classes(id) on delete restrict,
  school_id uuid not null references public.schools(id) on delete restrict,
  primary key (extra_fee_item_id, class_id)
);
create index extra_fee_item_classes_school_id_idx on public.extra_fee_item_classes(school_id);
create index extra_fee_item_classes_class_idx on public.extra_fee_item_classes(class_id);

insert into public.extra_fee_item_classes (extra_fee_item_id, class_id, school_id)
select id, class_id, school_id from public.extra_fee_items where class_id is not null;

alter table public.extra_fee_items drop column class_id;

-- Same shape as extra_fee_items in 0017: admins manage, anyone in the school reads the catalogue.
alter table public.extra_fee_item_classes enable row level security;
create policy efic_select on public.extra_fee_item_classes for select to authenticated
  using (school_id = public.current_school_id());
create policy efic_admin on public.extra_fee_item_classes for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());
grant select, insert, update, delete on public.extra_fee_item_classes to authenticated;
grant all on public.extra_fee_item_classes to service_role;

-- Replace a fee's class list in one transaction. Doing it as two PostgREST calls would leave the fee
-- with no rows, which means "all classes", if the second call failed. Security invoker, so the
-- policies above still decide who may write. Every id must resolve to a class the caller can see,
-- otherwise an unknown id would quietly shrink the list and could empty it into "all classes".
create function public.set_extra_fee_item_classes(p_item_id uuid, p_class_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_school_id uuid;
  v_found int;
begin
  select school_id into v_school_id from extra_fee_items where id = p_item_id;
  if v_school_id is null then
    raise exception 'extra fee % not found', p_item_id using errcode = '23503';
  end if;

  select count(*) into v_found from classes
  where id = any(p_class_ids) and school_id = v_school_id;
  if v_found <> cardinality(array(select distinct unnest(p_class_ids))) then
    raise exception 'unknown class for extra fee %', p_item_id using errcode = '23503';
  end if;

  delete from extra_fee_item_classes where extra_fee_item_id = p_item_id;
  insert into extra_fee_item_classes (extra_fee_item_id, class_id, school_id)
  select p_item_id, c.id, v_school_id from classes c where c.id = any(p_class_ids);
end;
$$;

revoke all on function public.set_extra_fee_item_classes(uuid, uuid[]) from public, anon;
grant execute on function public.set_extra_fee_item_classes(uuid, uuid[]) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- The billing period of a charge.
-- ---------------------------------------------------------------------------
alter table public.extra_fee_assignments
  add column academic_year_id uuid references public.academic_years(id) on delete restrict,
  add column fee_term fee_term not null default 'full_year',
  -- First day of the month a monthly fee bills for; null for every other frequency.
  add column billing_month date;

-- Existing charges predate periods. File them under the school's active year (or its latest, if
-- none is active) as full-year charges, which is what they effectively were.
update public.extra_fee_assignments a
set academic_year_id = coalesce(
  (select ay.id from public.academic_years ay where ay.school_id = a.school_id and ay.is_active),
  (select ay.id from public.academic_years ay where ay.school_id = a.school_id
   order by ay.start_date desc limit 1)
);

alter table public.extra_fee_assignments
  alter column academic_year_id set not null,
  drop constraint extra_fee_assignments_extra_fee_item_id_student_id_key,
  -- A monthly charge is a year-level charge for one month, never a term charge.
  add constraint extra_fee_assignments_month_shape check (
    billing_month is null
    or (fee_term = 'full_year' and billing_month = date_trunc('month', billing_month)::date)
  ),
  -- One charge per student, fee and period. NULLS NOT DISTINCT so the many non-monthly charges,
  -- whose month is null, still collide with each other.
  add constraint extra_fee_assignments_period_key unique nulls not distinct
    (extra_fee_item_id, student_id, academic_year_id, fee_term, billing_month);

create index extra_fee_assignments_year_idx on public.extra_fee_assignments(academic_year_id);

-- ---------------------------------------------------------------------------
-- Stop deletes from taking money with them.
-- ---------------------------------------------------------------------------
alter table public.extra_fee_assignments
  drop constraint extra_fee_assignments_extra_fee_item_id_fkey,
  add constraint extra_fee_assignments_extra_fee_item_id_fkey
    foreign key (extra_fee_item_id) references public.extra_fee_items(id);

alter table public.payments
  drop constraint payments_extra_fee_assignment_id_fkey,
  add constraint payments_extra_fee_assignment_id_fkey
    foreign key (extra_fee_assignment_id) references public.extra_fee_assignments(id);

-- ---------------------------------------------------------------------------
-- extra_fee_positions, now period-aware.
--
-- Dropped and recreated rather than replaced: the class join changes and the new period columns
-- sit beside the identifiers they belong with. Grants are restated because a dropped view loses
-- them.
-- ---------------------------------------------------------------------------
drop view public.extra_fee_positions;

create view public.extra_fee_positions with (security_invoker = true) as
select
  a.id,
  a.school_id,
  a.student_id,
  s.first_name || ' ' || s.last_name as student_name,
  e.class_id,
  c.name as class_name,
  a.extra_fee_item_id,
  fi.name as fee_name,
  fi.frequency,
  a.academic_year_id,
  a.fee_term,
  a.billing_month,
  a.amount,
  coalesce(p.paid, 0) as paid,
  greatest(0, a.amount - coalesce(p.paid, 0)) as balance,
  case
    when coalesce(p.paid, 0) >= a.amount then 'paid'
    when coalesce(p.paid, 0) <= 0 then 'pending'
    else 'partial'
  end as status
from public.extra_fee_assignments a
join public.extra_fee_items fi on fi.id = a.extra_fee_item_id
join public.students s on s.id = a.student_id
-- The class the student was in for the year being billed. Enrollments are unique per (student,
-- year), so this is one row per charge however many years the student has been enrolled.
left join public.enrollments e
  on e.student_id = a.student_id and e.academic_year_id = a.academic_year_id
left join public.classes c on c.id = e.class_id
left join (
  select extra_fee_assignment_id, sum(amount) as paid
  from public.payments
  where extra_fee_assignment_id is not null group by extra_fee_assignment_id
) p on p.extra_fee_assignment_id = a.id;

grant select on public.extra_fee_positions to authenticated, service_role;
