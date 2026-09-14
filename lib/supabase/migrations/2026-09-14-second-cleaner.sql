-- Two-cleaner jobs (2026-09-14).
-- A booking keeps its primary cleaner in assigned_cleaner_id. A second cleaner
-- on the same job goes in second_cleaner_id. Both see the job in their portal,
-- both get the dispatch / reminder / cancel / reschedule texts, and either can
-- tap On the way / Arrived / Complete.
--
-- Run once in the Supabase SQL editor (Dashboard → SQL → New query):

alter table public.bookings
  add column if not exists second_cleaner_id uuid references public.cleaners(id) on delete set null;

create index if not exists bookings_second_cleaner_idx on public.bookings(second_cleaner_id);

-- A cleaner can't be both slots on the same job.
alter table public.bookings
  drop constraint if exists bookings_distinct_cleaners;
alter table public.bookings
  add constraint bookings_distinct_cleaners
  check (second_cleaner_id is null or second_cleaner_id <> assigned_cleaner_id);
