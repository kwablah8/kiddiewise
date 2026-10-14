-- 0048_non_teaching_role.sql
--
-- A role for non-teaching staff (bursar's clerk, security, cook, driver): people the school keeps a
-- staff record for, issues a gate fingerprint number to and lists with the other staff, but who have
-- no portal. Until now such a person could only be filed as school_admin, which is a full admin login.
--
-- Only the value is added here. Every policy and helper names the roles it admits, so a profile with
-- this role matches none of them and can read or write nothing. A new enum value cannot be used in
-- the transaction that adds it, so the one function that should count them follows in 0049.

alter type public.user_role add value 'non_teaching';
