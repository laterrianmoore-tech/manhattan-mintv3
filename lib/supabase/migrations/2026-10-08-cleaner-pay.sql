-- Cleaner pay + accounting (2026-10-08).
-- Dispatch now sets each job's cleaner pay from the owner-approved table
-- (src/lib/cleaner-pay.ts) and texts it with the job. /admin/accounting reads
-- these columns for the weekly ledger and the Friday payout list.
--
-- The code tolerates these columns being absent (dispatch still sends the job
-- text, just without a pay line), so deploy order does not matter. Nothing is
-- recorded until this has run.
--
-- Run once in the Supabase SQL editor (Dashboard -> SQL -> New query):

alter table public.bookings
  add column if not exists cleaner_pay               integer,      -- whole dollars, primary cleaner
  add column if not exists second_cleaner_pay        integer,      -- whole dollars, 2-person jobs
  add column if not exists cleaner_pay_source        text          -- auto | manual | estimate
                                                    check (cleaner_pay_source in ('auto', 'manual', 'estimate')),
  add column if not exists cleaner_pay_note          text,         -- table row used, bumps, owner notes
  add column if not exists cleaner_paid_at           timestamptz,  -- stamped from the payout list
  add column if not exists cleaner_payout_ref        text,         -- Stripe transfer id, "Zelle 10/10", etc.
  add column if not exists second_cleaner_paid_at    timestamptz,
  add column if not exists second_cleaner_payout_ref text,
  add column if not exists collected_cents           integer,      -- what the customer actually paid (card capture or invoice)
  add column if not exists stripe_fee_cents          integer,      -- Stripe processing fee on that payment
  add column if not exists collected_at              timestamptz,
  add column if not exists collected_ref             text;         -- PaymentIntent / invoice id behind collected_cents

-- Payout list: completed jobs with pay owed.
create index if not exists bookings_cleaner_unpaid_idx
  on public.bookings(assigned_cleaner_id)
  where cleaner_pay is not null and cleaner_paid_at is null;
