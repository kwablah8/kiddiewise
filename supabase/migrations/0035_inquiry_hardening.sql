-- 0035_inquiry_hardening.sql
--
-- Harden the ONE write an anonymous visitor can make, at the database layer.
--
-- The admissions inquiry is submitted through a Server Action that validates and length-caps input,
-- but anon also holds a raw `insert` grant on this table and the policy is `inq_anon_insert ... with
-- check (true)` — so a script can POST straight to PostgREST, bypassing the action entirely, with
-- multi-megabyte fields (storage abuse / a flooded admissions inbox) and a forged status. The Server
-- Action's caps are not a security boundary; these constraints are.
--
--   1. char_length CHECKs bound every text column no matter which path writes it.
--   2. A tightened anon policy forces status = 'new' (a visitor cannot mark their own inquiry
--      'accepted'/'converted') and requires the contact fields the school needs to act on it.
--
-- Rate-limiting the endpoint (per-IP throttle / captcha) is the remaining defense and is
-- infrastructure, not schema — noted for ops.

alter table public.admissions_inquiries
  add constraint admissions_inquiries_applicant_name_len check (char_length(applicant_name) between 1 and 120),
  add constraint admissions_inquiries_parent_name_len   check (char_length(parent_name) between 1 and 120),
  add constraint admissions_inquiries_parent_email_len  check (char_length(parent_email) between 3 and 200),
  add constraint admissions_inquiries_parent_phone_len  check (parent_phone is null or char_length(parent_phone) <= 40),
  add constraint admissions_inquiries_desired_class_len check (desired_class is null or char_length(desired_class) <= 80),
  add constraint admissions_inquiries_message_len       check (message is null or char_length(message) <= 2000);

-- Replace the blanket anon insert check with one that pins status and demands the essentials.
drop policy if exists inq_anon_insert on public.admissions_inquiries;
create policy inq_anon_insert on public.admissions_inquiries for insert to anon
  with check (
    status = 'new'
    and char_length(applicant_name) between 1 and 120
    and char_length(parent_name) between 1 and 120
    and char_length(parent_email) between 3 and 200
  );
