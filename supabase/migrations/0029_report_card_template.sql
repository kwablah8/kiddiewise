-- 0029_report_card_template.sql, the school's paper report card, field for field.
--
-- The supplied template ("STUDENT REPORT FOR 3RD TERM") carries six numbers the card in 0028
-- could not produce: a per-subject class average / lowest / highest, a per-subject grade, the
-- number of passes, and the child's standing across the whole level as well as the class.
--
-- All of them are FROZEN alongside the rest of the report, for the same reason 0028 froze the
-- subject rows: "Class High. Score 96.5" is a claim the school signed off on for that term. If it
-- were re-derived at read time it would drift every time a mark was corrected in a later term, and
-- a parent holding the printed card would be looking at different figures from the portal.

-- What counts as a pass on the "Number Of Passes" line. A school setting, like ca_weight, the
-- grading scale alone can't say it, because which band is the lowest PASS is the school's call.
alter table public.schools
  add column pass_mark int not null default 50 check (pass_mark between 0 and 100);

alter table public.terminal_reports
  -- "Number Of Passes: 10", subjects at or above the school's pass mark.
  add column passes int,
  -- The three class-wide figures on the summary line, so a parent can place their child's average.
  add column class_average numeric,
  add column class_lowest_average numeric,
  add column class_highest_average numeric,
  -- "Position in J.H.S. 2", the same rank taken across every class sharing this class's level.
  -- Sized as well as ranked, because the card prints it as "1/16".
  add column level_position int,
  add column level_size int;

alter table public.terminal_report_subjects
  -- The template's "Short Code" column (CAD, ENG, MAT). Snapshot from subjects.code by VALUE for
  -- the same reason subject_name is: re-coding a subject later must not rewrite an issued card.
  add column short_code text,
  -- The band letter/number ("2"), beside the band remark ("Higher") the row already stores.
  add column grade text,
  add column class_average numeric,
  add column class_lowest numeric,
  add column class_highest numeric;

-- No policy changes: these are columns on tables whose RLS (0009, 0028) is already row-shaped.
