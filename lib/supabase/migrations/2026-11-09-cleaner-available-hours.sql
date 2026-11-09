-- Cleaner usual hours (2026-11-09).
-- Free text shown next to the cleaner's name on the /admin/dispatch week board
-- and in the cleaner picker, e.g. '9am–1pm' or 'weekdays 4-9pm, Sat mornings'.
-- Null = no limit noted. Nothing reads it for scheduling logic; it is the
-- owner's own note so a job outside her hours is never offered by accident.
--
-- The code tolerates this column being absent (the board just omits the line),
-- so deploy order does not matter. This also adds available_days (2026-11-02)
-- in case that migration was never run — both are "if not exists".
--
-- Run once in the Supabase SQL editor (Dashboard -> SQL -> New query):

alter table public.cleaners
  add column if not exists available_days text[];   -- e.g. '{mon,wed,fri}'; null = any day

alter table public.cleaners
  add column if not exists available_hours text;    -- e.g. '9am–1pm'; null = no limit noted

comment on column public.cleaners.available_hours is
  'Hours the cleaner usually works, free text (e.g. 9am–1pm). Null = not set. Shown on /admin/dispatch.';

-- Alyssa Andino joined 2026-11-09 and works 9am–1pm.
update public.cleaners
   set available_hours = '9am–1pm'
 where stripe_account_id = 'acct_1UZutNQCxuT7LHiH'
   and available_hours is null;
