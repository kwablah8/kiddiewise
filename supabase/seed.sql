-- supabase/seed.sql, minimal operational tenant for local dev.
-- NOTE: we deliberately do not seed auth.users / profiles here. Directly inserting into
-- auth.users is fragile (many required columns) and would break `supabase db reset` on
-- schema drift. Login users are created through provisioning (M3) or, for tests, via the
-- admin API in tests/rls/helpers.ts. This seed only lays down non-auth tenant data so the
-- app has a school + active year/term to develop against.
insert into public.schools (id, name, slug, email)
values ('00000000-0000-0000-0000-00000000501a', 'Kiddiewise School Complex', 'kiddiewise',
        'kiddiewise2012@gmail.com')
on conflict (id) do nothing;

insert into public.academic_years (id, school_id, name, start_date, end_date, is_active)
values ('00000000-0000-0000-0000-00000000601a', '00000000-0000-0000-0000-00000000501a',
        '2026/2027', '2026-09-01', '2027-07-31', true)
on conflict (id) do nothing;

insert into public.terms (id, school_id, academic_year_id, name, ordinal, start_date, end_date, is_active)
values ('00000000-0000-0000-0000-00000000701a', '00000000-0000-0000-0000-00000000501a',
        '00000000-0000-0000-0000-00000000601a', 'First Term', 1, '2026-09-01', '2026-12-20', true)
on conflict (id) do nothing;

update public.schools
  set active_academic_year_id = '00000000-0000-0000-0000-00000000601a',
      active_term_id = '00000000-0000-0000-0000-00000000701a'
  where id = '00000000-0000-0000-0000-00000000501a';
