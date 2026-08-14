-- 0032_extra_fee_positions_year_scope.sql
--
-- Stop extra-fee figures from doubling after the first promotion rollover.
--
-- extra_fee_positions (0018) joins a student's enrollment purely on status = 'active':
--
--   left join public.enrollments e on e.student_id = a.student_id and e.status = 'active'
--
-- Promotion (lib/actions/promotion.ts) APPENDS a new 'active' enrollment for the next year and leaves
-- the previous one 'active' too ("a student's class is an enrollment, not a column"). So from the
-- first rollover, a continuing student has two active enrollments, and this join emits TWO rows per
-- extra-fee assignment — the Fees overview's extra_total / extra_paid double, and each assignment
-- shows twice in the list. student_fee_positions already avoids this by joining on the invoice's own
-- academic_year_id; extra fees carry no year, so scope the join to the school's ACTIVE year instead —
-- the enrollment whose class the row should display anyway.
--
-- Columns, order and security_invoker are unchanged, so create-or-replace is safe.

create or replace view public.extra_fee_positions with (security_invoker = true) as
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
-- The student's enrollment for the school's ACTIVE year only, so a promoted student contributes one
-- row (their current class), not one per year they have ever been enrolled.
left join public.academic_years ay on ay.school_id = a.school_id and ay.is_active
left join public.enrollments e
  on e.student_id = a.student_id and e.academic_year_id = ay.id and e.status = 'active'
left join public.classes c on c.id = e.class_id
left join (
  select extra_fee_assignment_id, sum(amount) as paid
  from public.payments
  where extra_fee_assignment_id is not null group by extra_fee_assignment_id
) p on p.extra_fee_assignment_id = a.id;
