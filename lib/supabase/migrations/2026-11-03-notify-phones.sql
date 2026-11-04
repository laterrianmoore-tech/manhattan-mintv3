-- Extra "on the way" recipients (2026-11-03).
-- bookings.notify_phones lists phone numbers besides the customer's that get
-- the "your cleaner is on the way" text: a sister meeting the cleaner at the
-- door, a roommate, a building contact. The customer's own number stays on
-- customers.phone and still gets every text. Run once in the Supabase SQL
-- editor. Safe to re-run.

alter table bookings add column if not exists notify_phones text[] not null default '{}';
comment on column bookings.notify_phones is 'Extra numbers texted when the cleaner taps On the way (10-digit US, no +1)';
