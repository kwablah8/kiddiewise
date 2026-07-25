-- 0020_temp_password_activation.sql
-- Admin-issued temporary credentials.
--
-- Email and SMS both need a provider (SMTP / Hubtel / Twilio) that takes weeks to get approved in
-- Ghana, so the primary way a parent gets portal access is the one that needs no provider at all:
-- during admission, while the parent is standing at the desk, the admin issues a generated temporary
-- password and writes it on the admission slip. The parent must replace it on first sign-in.
--
-- Three columns track that handover, and none of them are grantable to `authenticated`. That matters:
-- `profiles_self_update` (0004) lets a user update their own row, so if `must_change_password` were
-- writable the parent could simply clear the flag and skip the change entirely. 0015 revoked
-- table-level UPDATE on profiles and grants it column by column, so omitting these from any grant
-- leaves them read-only via the API — writable only by the service role (admin actions) and by the
-- narrow function below.

alter table public.profiles
  -- True while an admin-issued temporary password is still in force.
  add column must_change_password boolean not null default false,
  -- When that temporary password stops working. An unused credential must not stay valid forever:
  -- until the parent takes ownership, the admin who issued it can read that child's attendance,
  -- results and fees. Expiry bounds that window; the admin reissues on demand.
  add column temp_password_expires_at timestamptz,
  -- Set when the holder replaces the temporary password — i.e. when the account becomes truly theirs.
  -- Drives the "activated / awaiting first sign-in" status on the admin's parents screen.
  add column password_changed_at timestamptz;

-- Existing accounts were not issued a temporary password, so they are already the holder's own.
update public.profiles set password_changed_at = created_at;

comment on column public.profiles.must_change_password is
  'True while an admin-issued temporary password is in force. Not writable via the API — see 0020.';

-- ---------------------------------------------------------------------------
-- The one narrow path that clears the flag.
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER because `authenticated` deliberately has no UPDATE grant on these columns. It is
-- hard-scoped to auth.uid(), so it cannot be pointed at another account no matter what it is passed
-- (it takes no arguments at all).
--
-- Note this is a UX gate, not a security boundary: someone could call it without actually changing
-- their password, and would simply be left holding a credential their admin also knows. The security
-- boundary is `temp_password_expires_at`, which the holder cannot move.
create or replace function public.complete_password_change()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles
     set must_change_password = false,
         temp_password_expires_at = null,
         password_changed_at = now()
   where id = auth.uid()
$$;

revoke all on function public.complete_password_change() from public, anon;
grant execute on function public.complete_password_change() to authenticated;
