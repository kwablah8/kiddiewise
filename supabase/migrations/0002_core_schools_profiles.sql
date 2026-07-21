-- 0002_core_schools_profiles.sql
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  address text,
  phone text,
  email text,
  active_academic_year_id uuid,     -- FK added in 0006 (circular dep with academic_years)
  active_term_id uuid,              -- FK added in 0006
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid references public.schools(id) on delete restrict,  -- null only for super_admin
  role user_role not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  staff_no text,                    -- teacher only, unique per school (index below)
  department text,                  -- teacher only ("No Department" allowed)
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index profiles_school_id_idx on public.profiles(school_id);
create unique index profiles_staff_no_per_school
  on public.profiles(school_id, staff_no) where staff_no is not null;

-- super_admin has no school; everyone else must
alter table public.profiles add constraint profiles_school_required
  check (role = 'super_admin' or school_id is not null);
