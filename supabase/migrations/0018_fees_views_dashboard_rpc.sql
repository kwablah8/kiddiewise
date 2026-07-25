-- 0018_fees_views_dashboard_rpc.sql
-- Derived reads for the surfaces 0017 restructured, plus the dashboard delta RPC the stat-card
-- trend pills have been waiting on (flagged as a SEAM in lib/data/dashboard.ts).
--
-- `security_invoker = true` is load-bearing on both views. Without it a view runs with its
-- OWNER's rights (postgres), which bypasses RLS on every underlying table and would hand any
-- authenticated caller the whole platform's fee ledger. With it, the view is just a saved query
-- and each caller's own policies still apply.

-- ---------------------------------------------------------------------------
-- One row per student fee position, with paid/balance/status derived from
-- `payments` rather than stored (golden rule 9 — see 0017's dropped columns).
-- ---------------------------------------------------------------------------
create view public.student_fee_positions with (security_invoker = true) as
select
  i.id,
  i.school_id,
  i.student_id,
  s.first_name || ' ' || s.last_name as student_name,
  i.academic_year_id,
  i.fee_term,
  e.class_id,
  c.name as class_name,
  i.total_amount as expected,
  i.discount,
  i.arrears,
  i.scholarship_type,
  coalesce(p.paid, 0) as paid,
  greatest(0, i.total_amount + i.arrears - coalesce(p.paid, 0)) as balance,
  case
    when coalesce(p.paid, 0) >= i.total_amount + i.arrears then 'paid'
    when coalesce(p.paid, 0) <= 0 then 'pending'
    else 'partial'
  end as status
from public.invoices i
join public.students s on s.id = i.student_id
-- The enrollment for the invoice's own year, so a promoted student's historical invoices keep
-- showing the class they were actually in when the fee was raised.
left join public.enrollments e
  on e.student_id = i.student_id and e.academic_year_id = i.academic_year_id
left join public.classes c on c.id = e.class_id
left join (
  select invoice_id, sum(amount) as paid
  from public.payments where invoice_id is not null group by invoice_id
) p on p.invoice_id = i.id;

-- ---------------------------------------------------------------------------
-- Assigned extra fees, same derivation.
-- ---------------------------------------------------------------------------
create view public.extra_fee_positions with (security_invoker = true) as
select
  a.id,
  a.school_id,
  a.student_id,
  s.first_name || ' ' || s.last_name as student_name,
  e.class_id,
  c.name as class_name,
  fi.name as fee_name,
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
left join public.enrollments e
  on e.student_id = a.student_id and e.status = 'active'
left join public.classes c on c.id = e.class_id
left join (
  select extra_fee_assignment_id, sum(amount) as paid
  from public.payments
  where extra_fee_assignment_id is not null group by extra_fee_assignment_id
) p on p.extra_fee_assignment_id = a.id;

-- ---------------------------------------------------------------------------
-- Month-over-month deltas behind the dashboard stat-card trend pills.
--
-- students/staff/revenue are RELATIVE percent changes (this month vs last).
-- attendance is a PERCENTAGE-POINT difference, because it is already a rate — reporting
-- "attendance up 4%" when it moved 92% → 96% would be wrong twice over.
-- Every branch guards division by zero and returns 0 rather than null, so the UI never has to
-- special-case a school's first month of operation.
-- ---------------------------------------------------------------------------
create or replace function public.dashboard_trends()
returns table(students numeric, staff numeric, revenue numeric, attendance numeric)
language sql stable security invoker set search_path = public as $$
  with bounds as (
    select date_trunc('month', now()) as this_start,
           date_trunc('month', now()) - interval '1 month' as last_start
  ),
  student_counts as (
    select
      count(*) filter (where s.created_at < b.this_start) as before_this,
      count(*) filter (where s.created_at < b.last_start) as before_last
    from public.students s cross join bounds b
    where s.school_id = current_school_id()
  ),
  staff_counts as (
    select
      count(*) filter (where p.created_at < b.this_start) as before_this,
      count(*) filter (where p.created_at < b.last_start) as before_last
    from public.profiles p cross join bounds b
    where p.school_id = current_school_id() and p.role = 'teacher'
  ),
  revenue_sums as (
    select
      coalesce(sum(pm.amount) filter (where pm.paid_at >= b.this_start), 0) as this_month,
      coalesce(sum(pm.amount) filter
        (where pm.paid_at >= b.last_start and pm.paid_at < b.this_start), 0) as last_month
    from public.payments pm cross join bounds b
    where pm.school_id = current_school_id()
  ),
  attendance_rates as (
    select
      case when count(*) filter (where a.date >= b.this_start::date) = 0 then null
        else 100.0 * count(*) filter
               (where a.date >= b.this_start::date and a.status in ('present','late'))
             / count(*) filter (where a.date >= b.this_start::date)
      end as this_rate,
      case when count(*) filter
             (where a.date >= b.last_start::date and a.date < b.this_start::date) = 0 then null
        else 100.0 * count(*) filter
               (where a.date >= b.last_start::date and a.date < b.this_start::date
                  and a.status in ('present','late'))
             / count(*) filter
               (where a.date >= b.last_start::date and a.date < b.this_start::date)
      end as last_rate
    from public.attendance a cross join bounds b
    where a.school_id = current_school_id()
  )
  select
    case when sc.before_last = 0 then 0
      else round(100.0 * (sc.before_this - sc.before_last) / sc.before_last, 1) end,
    case when st.before_last = 0 then 0
      else round(100.0 * (st.before_this - st.before_last) / st.before_last, 1) end,
    case when rs.last_month = 0 then 0
      else round(100.0 * (rs.this_month - rs.last_month) / rs.last_month, 1) end,
    case when ar.this_rate is null or ar.last_rate is null then 0
      else round(ar.this_rate - ar.last_rate, 1) end
  from student_counts sc, staff_counts st, revenue_sums rs, attendance_rates ar
$$;

-- ---------------------------------------------------------------------------
-- Sidebar badge counts — one round trip instead of three.
-- ---------------------------------------------------------------------------
create or replace function public.sidebar_counts()
returns table(students bigint, staff bigint, new_inquiries bigint)
language sql stable security invoker set search_path = public as $$
  select
    (select count(*) from students s
       where s.school_id = current_school_id() and s.enrollment_status = 'active'),
    (select count(*) from profiles p
       where p.school_id = current_school_id() and p.is_active
         and p.role in ('teacher','school_admin')),
    (select count(*) from admissions_inquiries q
       where q.school_id = current_school_id() and q.status = 'new')
$$;

-- Views need their own privileges; see the note in 0017 about 0015's grants not being a
-- standing rule. RLS on the underlying tables (reached via security_invoker) is the row gate.
grant select on public.student_fee_positions, public.extra_fee_positions
  to authenticated, service_role;
