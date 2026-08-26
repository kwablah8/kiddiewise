-- 0034_temp_password_expiry_gate.sql
--
-- Enforce temporary-password expiry in the one place a client cannot skip.
--
-- 0020 declares temp_password_expires_at "the security boundary", but nothing on the server actually
-- checked it: the expiry test lived only in the login page (client code), and complete_password_change()
-- cleared must_change_password unconditionally. So a holder of an EXPIRED temporary password (e.g. one
-- written on an admission slip and later found) could sign in straight against the public GoTrue
-- endpoint, bypassing the login page, and call this RPC to take permanent ownership of the account.
--
-- Refuse to complete the change once the credential has expired. An expired holder can no longer clear
-- the flag, so the middleware keeps them pinned on /update-password and out of the app; the admin must
-- reissue a fresh temporary password. A row that already belongs to its owner (expires_at is null) is
-- unaffected.
--
-- NOTE: this closes the ownership-takeover path. Fully revoking an expired credential's ability to
-- AUTHENTICATE at all (so it cannot even open a session) requires banning the GoTrue user when the
-- window lapses, a scheduled job (pg_cron) or an issue-time TTL, which is an operational follow-up,
-- since Postgres/RLS cannot expire a JWT that GoTrue already signed.

create or replace function public.complete_password_change()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
     set must_change_password = false,
         temp_password_expires_at = null,
         password_changed_at = now()
   where id = auth.uid()
     and (temp_password_expires_at is null or temp_password_expires_at > now());

  if not found then
    raise exception 'This temporary password has expired. Ask the school office for a new one.'
      using errcode = 'check_violation';
  end if;
end;
$$;

revoke all on function public.complete_password_change() from public, anon;
grant execute on function public.complete_password_change() to authenticated;
