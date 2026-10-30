-- Broker referral partners (2026-10-30).
-- Real estate brokers send clients through a dedicated code and link
-- (manhattanmintnyc.com/quote/?code=OSUR). The code gives the client no
-- discount; it only records who made the introduction. Both fees are once
-- per client (owner 2026-10-30): fee_per_job when a referred client's first
-- paid clean completes, fee_recurring when that client's first recurring-plan
-- visit completes. Fees are paid weekly on Friday by Zelle or Venmo; the
-- Thursday payroll text lists what is owed and /admin/partners stamps it paid.
--
-- Each broker gets a private signed page, /partners/<CODE>/?t=<hmac>,
-- showing clicks, bookings, completed cleans, recurring conversions and fees
-- (src/lib/brokers.ts). Clients are attributed two ways: bookings.broker_code
-- is the booking that literally came through the link, and
-- customers.broker_code marks a NEW client as that broker's, so their later
-- visits (auto-created recurring, keep-my-cleaner, phone bookings) count too.
--
-- The code tolerates all of this being absent (the partner list falls back to
-- the seed in src/lib/brokers.ts, attribution writes are logged and skipped),
-- so deploy order does not matter.
--
-- Run once in the Supabase SQL editor (Dashboard -> SQL -> New query):

create table if not exists public.broker_partners (
  id             uuid primary key default uuid_generate_v4(),
  code           text not null unique,                -- upper-case, letters/digits, e.g. OSUR
  name           text not null,                       -- shown to the client: "Referred by The Osur Team"
  contact_name   text,
  contact_email  text,
  payout_handle  text,                                -- Zelle / Venmo handle the fee goes to
  payout_method  text check (payout_method in ('zelle', 'venmo')),
  fee_per_job    integer not null default 40,         -- whole dollars, once per client, on their first completed paid clean
  fee_recurring  integer not null default 75,         -- once per client, on their first completed recurring-plan visit
  active         boolean not null default true,
  notes          text,
  created_at     timestamptz not null default now()
);

-- One row per visit to /quote/ with a broker code (deduped per browser session).
create table if not exists public.broker_link_clicks (
  id          uuid primary key default uuid_generate_v4(),
  code        text not null,
  referrer    text,
  user_agent  text,
  created_at  timestamptz not null default now()
);
create index if not exists broker_link_clicks_code_idx on public.broker_link_clicks(code, created_at);

alter table public.customers
  add column if not exists broker_code text;           -- set once, on the client's first booking through a broker code

alter table public.bookings
  add column if not exists broker_code         text,         -- the booking that came through the link
  add column if not exists broker_fee_paid_at  timestamptz,  -- stamped from /admin/partners after the Friday Zelle/Venmo
  add column if not exists broker_fee_ref      text;         -- "Zelle 11/6", etc.

create index if not exists bookings_broker_code_idx on public.bookings(broker_code) where broker_code is not null;
create index if not exists customers_broker_code_idx on public.customers(broker_code) where broker_code is not null;

-- The Osur Team (Living NY), Brandon Kalusa, Head of Operations. Deal agreed
-- 2026-10-30: $40 per completed paid clean, $75 if the client starts a
-- recurring plan, paid Fridays. Fill in payout_handle / payout_method once
-- Brandon says where to send it.
insert into public.broker_partners (code, name, contact_name, contact_email)
values ('OSUR', 'The Osur Team', 'Brandon Kalusa', 'brandon@livingny.com')
on conflict (code) do nothing;
