-- Lockout flow (2026-10-28).
-- When a cleaner arrives and can't get in, she taps "Can't get in" in her
-- portal. That stamps locked_out_at, texts the customer the 10-minute final
-- warning and texts the owner a signed link. The owner then resolves it from
-- /admin/dispatch or that link: "Customer let her in" (job continues),
-- "Release + charge $119" (the lockout fee in the site terms, captured from
-- the card hold) or "Release, waive fee" (hold released, no charge).
--
-- A charged or waived lockout gets status 'lockout'. The cleaner's pay on the
-- job is left exactly as dispatch set it, so the job still appears in
-- /admin/accounting and the payout list: she gave up the slot and is paid.
--
-- The code tolerates these columns being absent (the portal hides the button
-- and the API says to run this file), so deploy order does not matter.
--
-- Run once in the Supabase SQL editor (Dashboard -> SQL -> New query):

alter table public.bookings
  add column if not exists locked_out_at        timestamptz,  -- cleaner tapped "Can't get in"
  add column if not exists lockout_resolved_at  timestamptz,  -- owner picked an outcome
  add column if not exists lockout_resolution   text          -- let_in | charged | waived
                                                check (lockout_resolution in ('let_in', 'charged', 'waived')),
  add column if not exists lockout_fee_cents    integer;      -- 11900 when charged, 0 when waived (before sales tax)

-- 'lockout' joins the status list. The original check constraint was declared
-- inline in schema.sql, so Postgres named it bookings_status_check.
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings
  add constraint bookings_status_check
  check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'lockout'));

-- Open lockouts (timer running) are what dispatch and the owner link look up.
create index if not exists bookings_open_lockout_idx
  on public.bookings(locked_out_at)
  where locked_out_at is not null and lockout_resolved_at is null;
