-- Review-link tracking (2026-09-18).
-- First-time customers are sent a per-booking tracked review link
-- (https://manhattanmintnyc.com/api/r/<token>/) that 302s to Google. These
-- columns let the owner see who was sent the link, who tapped it, who got the
-- day-3 nudge, and who actually left a review (marked by hand in /admin/dispatch).
--
-- The code tolerates these columns being absent (it logs and falls back to the
-- plain Google link), so deploy order does not matter — but nothing is tracked
-- until this has run.
--
-- Run once in the Supabase SQL editor (Dashboard → SQL → New query):

alter table public.bookings
  add column if not exists review_token           text,
  add column if not exists review_link_sent_at    timestamptz,
  add column if not exists review_link_clicked_at timestamptz,
  add column if not exists review_nudge_sent_at   timestamptz,
  add column if not exists review_received_at     timestamptz;

-- One token per booking; the tracked link is looked up by it.
create unique index if not exists bookings_review_token_key
  on public.bookings(review_token)
  where review_token is not null;

-- The day-3 nudge scans by send time.
create index if not exists bookings_review_link_sent_idx
  on public.bookings(review_link_sent_at)
  where review_link_sent_at is not null;
