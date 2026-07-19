-- Manhattan Mint Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Safe to run multiple times — all statements use IF NOT EXISTS

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- CUSTOMERS
-- One row per customer. Upserted on each booking by email.
-- ============================================================
create table if not exists customers (
  id                  uuid primary key default uuid_generate_v4(),
  stripe_customer_id  text unique,
  first_name          text not null,
  last_name           text not null,
  email               text not null unique,
  phone               text not null,
  address             text not null,
  apt_no              text,
  key_access          boolean not null default false,
  access_notes        text,
  sms_reminder        boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- CLEANERS
-- One row per subcontractor. Populated manually or via /onboarding.
-- ============================================================
create table if not exists cleaners (
  id                  uuid primary key default uuid_generate_v4(),
  first_name          text not null,
  last_name           text not null,
  email               text not null unique,
  phone               text not null,
  status              text not null default 'pending_onboarding'
                        check (status in ('active', 'inactive', 'pending_onboarding')),
  zones               text[] not null default '{}',
  rating              numeric(3,2),
  pay_rate_pct        numeric(5,2) not null default 57,
  stripe_account_id   text unique,
  certn_report_id     text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- BOOKINGS
-- One row per booked job. Links to customer; optionally links to cleaner.
-- ============================================================
create table if not exists bookings (
  id                          uuid primary key default uuid_generate_v4(),
  customer_id                 uuid not null references customers(id) on delete restrict,
  assigned_cleaner_id         uuid references cleaners(id) on delete set null,
  status                      text not null default 'pending'
                                check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  frequency                   text not null,
  bedrooms                    integer,
  bathrooms                   integer,
  service_summary             text,
  service_date                date not null,
  preferred_time_ranges       text[] not null default '{}',
  selected_extras             jsonb not null default '[]',
  cleaning_notes              text,
  coupon_code                 text,
  pricing_total               integer not null,
  pricing_subtotal            integer not null,
  pricing_next_clean_total    integer,
  stripe_payment_method_id    text,
  stripe_customer_id          text,
  stripe_charge_id            text,
  calendar_event_id           text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists bookings_customer_id_idx on bookings(customer_id);
create index if not exists bookings_service_date_idx on bookings(service_date);
create index if not exists bookings_status_idx on bookings(status);
create index if not exists bookings_assigned_cleaner_idx on bookings(assigned_cleaner_id);

-- ============================================================
-- EMAIL SUBSCRIBERS
-- Marketing list — collected from popup + inline capture forms.
-- ============================================================
create table if not exists email_subscribers (
  id          uuid primary key default uuid_generate_v4(),
  email       text not null unique,
  name        text,
  source      text not null default 'website',
  created_at  timestamptz not null default now()
);

create index if not exists email_subscribers_email_idx on email_subscribers(email);
create index if not exists email_subscribers_created_at_idx on email_subscribers(created_at);

-- ============================================================
-- EMAIL UNSUBSCRIBES
-- Marketing suppression list. Anyone here never gets campaign
-- email, whether they're a subscriber, customer, or both.
-- ============================================================
create table if not exists email_unsubscribes (
  id          uuid primary key default uuid_generate_v4(),
  email       text not null unique,
  source      text not null default 'link',
  created_at  timestamptz not null default now()
);

create index if not exists email_unsubscribes_email_idx on email_unsubscribes(email);

-- ============================================================
-- CAMPAIGN SENDS
-- One row per marketing email delivered. Drives rotation (each
-- recipient gets the next unseen email in their track) and gives
-- a full audit log of what went out.
-- ============================================================
create table if not exists campaign_sends (
  id            uuid primary key default uuid_generate_v4(),
  email         text not null,
  campaign_key  text not null,
  segment       text not null check (segment in ('prospect', 'customer')),
  sent_at       timestamptz not null default now(),
  unique (email, campaign_key)
);

create index if not exists campaign_sends_email_idx on campaign_sends(email);
create index if not exists campaign_sends_campaign_key_idx on campaign_sends(campaign_key);
create index if not exists campaign_sends_sent_at_idx on campaign_sends(sent_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- Locked down by default. Server-side admin client bypasses RLS.
-- ============================================================
alter table customers enable row level security;
alter table bookings enable row level security;
alter table cleaners enable row level security;
alter table email_subscribers enable row level security;
alter table email_unsubscribes enable row level security;
alter table campaign_sends enable row level security;
