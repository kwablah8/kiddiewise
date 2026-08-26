-- 0023_term_reopening_date.sql
-- When school reopens after this term.
--
-- It is the single most-read line on a Ghanaian terminal report after the grades, parents plan
-- childcare, travel and fees around it, and until now the app had nowhere to put it, so it was
-- being written on report cards by hand.
--
-- On the TERM rather than on `terminal_reports`, for two reasons. A school reopens on one date, so
-- storing it per report row would be the same fact copied once per pupil, free to drift between two
-- children in the same class. And the admin sets it before generating a batch, the
-- reopening-date control on /terminal-reports has to show a value when no report rows exist yet,
-- which a column on `terminal_reports` cannot do.
--
-- Set from the terminal reports screen, which is where the person writing reports is standing;
-- nothing forces them into Academic → Terms to find it.
--
-- Nullable: a term genuinely may not have a confirmed reopening date yet, and a placeholder date
-- printed on a report card is worse than a blank one.
alter table public.terms
  add column reopening_date date;

comment on column public.terms.reopening_date is
  'When school reopens after this term. Printed on the term''s reports; set from /terminal-reports. Null until the school confirms it — see 0023.';
