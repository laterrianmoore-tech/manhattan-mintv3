-- Cleaner onboarding packet (2026-11-03).
-- One automated send per applicant: Stripe Connect payout link + Certn
-- background-check invite + e-signable Independent Contractor Agreement.
-- Run once in the Supabase SQL editor. Safe to re-run.

alter table cleaners add column if not exists legal_name                text;         -- name as on government ID (the contract party)
alter table cleaners add column if not exists address                   text;         -- "street, city, state zip" from /onboarding
alter table cleaners add column if not exists onboarding_packet_sent_at timestamptz;  -- last time the packet email/text went out
alter table cleaners add column if not exists certn_invited_at          timestamptz;  -- Certn invite created through the API
alter table cleaners add column if not exists ica_version               text;         -- agreement text version that was signed
alter table cleaners add column if not exists ica_signed_at             timestamptz;  -- e-signature timestamp (null = unsigned)
alter table cleaners add column if not exists ica_signed_name           text;         -- the typed signature
alter table cleaners add column if not exists ica_signed_ip             text;         -- where the signature came from
