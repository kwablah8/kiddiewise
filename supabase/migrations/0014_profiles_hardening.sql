-- 0014_profiles_hardening.sql
-- RLS cannot restrict columns, so the security-defining columns of profiles (role, school_id)
-- must be locked at the privilege layer. Only the service role (provisioning / controlled
-- server actions) may change them; the authenticated/anon API never can.
revoke update (role, school_id) on public.profiles from authenticated, anon;

-- Defense in depth: a school_admin may manage users in their school but must never mint a
-- super_admin (INSERT or UPDATE). Re-create the admin write policy with that guard.
drop policy profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (
    public.is_school_admin() and school_id = public.current_school_id()
    and role <> 'super_admin'
  );
