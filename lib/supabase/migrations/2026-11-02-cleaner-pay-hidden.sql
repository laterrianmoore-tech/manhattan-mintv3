-- Pay recorded but kept off the job text (2026-11-02).
-- Owner case: the Eitel housekeeping follow-ups (74 Grand St, Nov 4-13) pay
-- Erika $85 per pair of visits, combined with her other work that day. The
-- owner wants that pay in /admin/accounting and the Thursday payroll text,
-- but not a "Pay: $43" line on the dispatch text. Edit pay on /admin/dispatch
-- gets a "Don't put the pay on the job text" box that sets this flag.
--
-- Dispatch reads it: pay is still stored and counted, the text just has no
-- Pay line. Saving pay with the box ticked fails until this has run.
--
-- Run once in the Supabase SQL editor (Dashboard -> SQL -> New query):

alter table public.bookings
  add column if not exists cleaner_pay_hidden boolean not null default false; -- primary cleaner's pay stays off the dispatch text
