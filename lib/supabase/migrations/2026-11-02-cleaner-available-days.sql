-- Cleaner usual days (2026-11-02).
-- The week board on /admin/dispatch shows every active cleaner against the
-- next seven days: a job, "free", or "off". "Off" comes from this column —
-- the days she usually works, toggled by the owner on the board itself
-- (POST /api/cleaners/availability). Null or empty means "not set", so every
-- day without a job reads as free.
--
-- The code tolerates this column being absent (the board hides the day chips
-- and shows a note), so deploy order does not matter.
--
-- Run once in the Supabase SQL editor (Dashboard -> SQL -> New query):

alter table public.cleaners
  add column if not exists available_days text[];   -- e.g. '{mon,wed,fri}'; null = any day

comment on column public.cleaners.available_days is
  'Days the cleaner usually works (mon..sun). Null/empty = not set. Set from the /admin/dispatch week board.';
