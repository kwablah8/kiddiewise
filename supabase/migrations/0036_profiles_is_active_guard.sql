-- 0036_profiles_is_active_guard.sql
--
-- Stop an account from setting its own `profiles.is_active`.
--
-- `is_active` is a security state, not a display flag: an inactive staff member is banned from
-- signing in (lib/actions/academics.ts calls setSignInBlocked alongside the flag), and server
-- actions such as reissuing a temporary password refuse to act on an inactive person. But the
-- column sits in the same grant as the genuinely user-editable fields:
--
--   grant update (first_name, last_name, email, phone, avatar_url, staff_no, department, is_active)
--     on public.profiles to authenticated;                                     -- 0015
--
-- and `profiles_self_update` (0004) lets a user UPDATE their own row. So every signed-in user could
-- flip their own flag through PostgREST. The window is real rather than theoretical: banning an auth
-- user does not invalidate an access token that has already been issued, so a just-deactivated staff
-- member has until that token expires to set the flag back and read as active on every screen and in
-- every action that gates on it.
--
-- Why a trigger rather than the column-grant approach used for `role` and `school_id` in 0014/0015:
-- those two are service-role-only, so revoking the column is exactly right. `is_active` is
-- different, because a school admin must be able to change it and admins hold the same
-- `authenticated` grant as everyone else. Grants cannot tell the two apart, and RLS cannot restrict
-- a single column (the same limitation 0026 worked around by splitting a table). A row-level trigger
-- is the one place that can express the actual rule, and it does so for every caller, including a
-- hostile request straight to PostgREST.
--
-- The rule: only a school admin of the row's own school may change `is_active`, and never on their
-- own row. Self-deactivation was already refused in `updateStaff`, in application code; this puts
-- it in the database, and closes self-REactivation at the same time.
--
-- Deliberately left alone: the column grant itself (an admin still needs it), and every update that
-- does not touch `is_active`. Callers other than `authenticated` are unaffected, which keeps the
-- service role free for provisioning and keeps `supabase/seed.sql` working when it runs as postgres.

create or replace function public.profiles_guard_is_active()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Only the flag matters. An update that leaves it as it was is none of this trigger's business.
  if new.is_active is not distinct from old.is_active then
    return new;
  end if;

  -- Privileged callers pass through: `service_role` for provisioning and the test harness, and a
  -- null JWT role for migrations and seed.sql running as postgres.
  if auth.role() is distinct from 'authenticated' then
    return new;
  end if;

  if not (
    public.is_school_admin()
    and old.school_id = public.current_school_id()
    -- Never your own row, whichever direction. Reactivating yourself is the attack; deactivating
    -- yourself is the lockout `updateStaff` already refuses.
    and old.id <> auth.uid()
  ) then
    -- 42501 so PostgREST answers 403 rather than 500.
    raise exception 'is_active may only be changed by a school admin, and never on your own account'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger profiles_guard_is_active
  before update of is_active on public.profiles
  for each row
  execute function public.profiles_guard_is_active();
