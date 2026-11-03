# Manhattan Mint NYC LLC — Codebase Vision

## What this is

Manhattan Mint is a New York City residential cleaning service. This Next.js codebase is the company's entire operating system — not just a website. The long-term goal is full automation: customers book, cleaners get dispatched, jobs get done, cards get charged, and payouts go out without Laterrian (the owner) touching any of it manually.

**Read `credentials/README.md` (gitignored) for all API keys, service accounts, and current system state before making changes.**

## Directory layout — IMPORTANT

The repo has both `app/` and `src/app/`. **Next.js serves the root `app/` directory** — that is where pages live. Exceptions that still live in `src/`: `src/app/layout.tsx` (re-exported by `app/layout.tsx`), `src/app/globals.css`, `src/app/seo-jsonld.tsx`, `src/components/`, `src/lib/`. Everything else under `src/app/` is dead code — never add new pages or API routes there.

---

## Vision

Maximum automation. The owner should NEVER:
- Manually charge a card
- Manually notify a cleaner of a new booking
- Manually send a customer reminder
- Manually follow up for a review
- Manually run payroll for cleaners

Every step in the customer and cleaner journey that can be automated should be. When suggesting features, always ask: does this reduce manual work, or does it create more of it?

---

## Tech Stack (locked in)

Do not suggest replacing these. Only raise a concern if a chosen tool has a hard blocker.

| Layer | Tool |
|---|---|
| Frontend + API | Next.js App Router, deployed on Netlify |
| Payments | Stripe (cards, future: Subscriptions, Connect) |
| Scheduling | Google Calendar (service account auth, domain-wide delegation) |
| Email | SendGrid (all transactional email) |
| SMS | OpenPhone API (cleaner dispatch + customer status updates) |
| Database + Auth | Supabase — Postgres + Auth (Phase 2) |
| Background checks | Certn (cleaner onboarding) |

---

## Build Phases

### Phase 1 — DONE
Customer-facing booking flow, fully wired.

- Home page → Quote page → Thank You page
- Stripe SetupIntent saves card on file (not charged at booking)
- Google Calendar event created per booking (timed block if time preference selected)
- SendGrid confirmation email to customer + internal alert to owner
- `/api/bookings/charge` endpoint built for post-appointment charging (manual for now)
- Preferred time window selection (multi-select, shows in email + calendar)

**Update 2026-07-19:** Payment collection is now AUTOMATIC — when the cleaner taps "Job Complete", `/api/job-event` charges the saved card off-session (`src/lib/stripe-charge.ts`) and auto-creates the next booking for recurring frequencies. `/api/bookings/charge` remains for edge cases (failed auto-charge, custom amounts).

---

### Phase 2 — NEXT
Add Supabase, cleaner accounts, and full automation of the post-booking workflow.

- **Supabase**: Store every booking as a record (customer, cleaner, status, pricing, Stripe IDs). Source of truth for all downstream automations.
- **Cleaner accounts**: Supabase Auth. Each cleaner has a login and a simple mobile-friendly dashboard.
- **Cleaner dashboard**: Three taps — "On the way" / "Arrived" / "Job Complete". No other UI needed.
- **OpenPhone SMS to cleaner**: When a booking is confirmed, the assigned cleaner gets an SMS with the job details (address, time, access notes, extras).
- **OpenPhone SMS to customer**: When cleaner taps "On the way" → customer gets "Your cleaner is on the way." When cleaner taps "Arrived" → customer gets "Your cleaner has arrived."
- **Auto-charge on "Complete"**: When cleaner taps "Job Complete," the system automatically charges the saved Stripe card. No manual step.
- **Post-clean review email**: 2 hours after "Complete" tap, SendGrid sends a review request email to the customer.

---

### Phase 3 — Customer Accounts + Recurring
- Customer accounts via Supabase Auth
- Booking history and upcoming appointments
- Reschedule UI (customer-initiated)
- Recurring bookings via Stripe Subscriptions (replace the current manual recurring logic)
- Referral codes with coupon generation

---

### Phase 4 — Admin Dashboard
- Owner dashboard: today's jobs, uncollected payments, open issues
- Daily briefing email to Laterrian each morning (jobs scheduled, revenue collected yesterday)
- Cleaner payout management (track what each cleaner is owed)
- Weekly performance report email (bookings, revenue, new vs. returning customers)

---

### Phase 5 — Intelligence Layer
- Auto-assign cleaners to bookings based on zone, availability, and rating
- Route optimization for cleaners with multiple jobs in a day
- AI inbox triage (OpenPhone / email) — flag messages that need owner attention vs. handle automatically

---

## Architectural Rules

1. **Every feature should reduce manual work, not add to it.** If a proposed feature requires the owner to do something new by hand, question whether it's the right approach.

2. **No SaaS replacements.** Don't suggest Calendly, Jobber, HouseCall Pro, or any other off-the-shelf platform. This is a custom system being built intentionally.

3. **Build for extensibility.** Don't take shortcuts that block future phases. For example: store Stripe Customer IDs from day one even before the charge endpoint is used, because Phase 2 needs them.

4. **Default to test mode.** Always verify in Stripe test mode, SendGrid sandbox, etc. before switching to live credentials. Clearly communicate which mode is active.

5. **Credentials stay in `credentials/README.md`.** That file is gitignored. Never commit secrets or API keys to the repo. When deploying, credentials go into Netlify environment variables.

6. **Supabase is the Phase 2 database.** Before Supabase is added, booking data lives only in Google Calendar event descriptions + Stripe metadata. After Supabase is added, it becomes the single source of truth and Calendar/Stripe become downstream outputs.

---

## Current API Routes

| Route | What it does |
|---|---|
| `POST /api/bookings/create-setup-intent` | Creates a Stripe SetupIntent so the quote form can save a card without charging it |
| `POST /api/bookings/submit` | Validates the booking, creates a Stripe Customer, creates a Google Calendar event, sends confirmation emails |
| `POST /api/bookings/charge` | Charges a saved card by Stripe Customer ID — call this after each appointment until Phase 2 auto-charges |
| `POST /api/job-event/` | Cleaner portal / admin taps: on_the_way, arrived, completed, locked_out. Complete auto-charges, books the next recurring visit, and texts the customer. First-time one-off customers get the review ask (feedback page → tracked Google link) and `review_link_sent_at` is stamped; repeat/recurring customers get one plain completion text. `locked_out` ("Can't get in", after Arrived) stamps `locked_out_at`, texts the customer the 10-minute final warning and texts the owner a signed `/lockout/` link. `?dryRun=1` previews completed and locked_out |
| `GET/POST /api/lockout/` | Owner resolves a lockout (admin cookie, or the signed `b`+`t` link from the owner text): `let_in` clears it, `charge` sets status `lockout`, captures exactly $119 (+ NY tax on taxable bookings) from the hold and releases the rest, texts + emails the customer, texts the cleaner to head home; `waive` releases the hold and texts the no-fee version. Cleaner pay is untouched so the job stays in accounting/payouts. `?dryRun=1` previews; `node scripts/lockout-dry-run.mjs <name>` prints everything. Needs `lib/supabase/migrations/2026-10-28-lockout.sql` |
| `GET /api/reports/payroll/` | Thursday payroll text to the owner (Netlify `thursday-payroll.mjs`, 13:00 UTC Thu, `x-cron-secret`). Totals completed jobs with pay set and no paid-at stamp per cleaner (after reconciling Stripe transfers) and texts OWNER_NOTIFY_PHONE who to pay. `?dryRun=1` previews |
| `GET /card/?c=cus_…&t=…` | Short, durable "save your card" link (2026-10-21). Mints a fresh setup-mode Checkout session per tap and, on `&saved=1`, makes the newest card the customer default and stamps it on open bookings. Mint with `cardUrl()` in `src/lib/manage-token.ts` or `node scripts/card-on-file.mjs link <cus_…>` |
| `GET /api/r/[token]/` | Tracked Google review link. Stamps `bookings.review_link_clicked_at` on first tap, always 302s to the Google review URL (`src/lib/google-reviews.ts`) |
| `GET /api/reminders/` | Daily cron (Netlify `job-reminders.mjs`, 21:00 UTC, `x-cron-secret`). Cleaner texts for tomorrow, recurring-customer reminder emails, card holds for tomorrow. The day-3 review nudge is NOT part of the nightly run any more (owner 2026-10-20: review asks are manual); `?reviewNudge=1&dryRun=1` still previews it for a one-off. `?remindBooking=<id>` sends one customer reminder |
| `POST /api/bookings/review-received/` | Admin (cookie): `{ bookingId, received? }` sets/clears `review_received_at`. Used by the Reviews to-do list on `/admin/dispatch` |
| `POST /api/bookings/review-ask/` | Admin (cookie): `{ bookingId }` texts the customer the owner's personal Google-review ask (wording approved 2026-10-20) from the 914 line and stamps `review_nudge_sent_at`, which now means "owner asked by hand". Tapped per customer from the Reviews to-do list; never automatic |

---

## Environment Variables (all required)
| `POST /api/cleaners/availability/` | Admin (cookie): `{ cleanerId, days }` saves the days a cleaner usually works (`mon`..`sun`) to `cleaners.available_days`; empty = any day. Toggled from the week board on `/admin/dispatch` (2026-11-02): cleaners x next 7 days, each cell a job / free / off, open jobs on top, cleaner pickers say "free Wed" / "booked: Rebecca AM" / "off Wednesdays". Nothing texted. Needs `lib/supabase/migrations/2026-11-02-cleaner-available-days.sql` |
| `POST /api/onboarding/submit/` | The `/onboarding` applicant form (2026-11-03). Saves the applicant to `cleaners` (`pending_onboarding`, `legal_name`, `address`) and sends the **onboarding packet** (`src/lib/onboarding-packet.ts`) by itself: creates her Stripe Connect Express account + the durable `/api/connect/onboard/` link, creates the Certn invite through the Certn API when `CERTN_API_KEY` is set (otherwise tells the owner to invite by hand), and sends the e-sign agreement link — one email + one text, `onboarding_packet_sent_at` stamped. Owner email lists what went out and what is still manual (COI, Certn without a key, flipping status to active) |
| `POST /api/cleaners/onboarding-packet/` | Admin (cookie) or `x-cron-secret`: `{ cleanerId, dryRun? }` sends / resends the packet for a cleaner added by hand. Button on `/admin/onboarding`, which shows every non-inactive cleaner's four gates (packet, agreement, Stripe payouts enabled, Certn). CLI: `npx tsx scripts/send-onboarding-packet.mts <email> [--apply]` |
| `GET /sign/?c=…&t=…` + `POST /api/sign/` | Independent Contractor Agreement e-sign (2026-11-03). The text of `02_Hiring/…_vF.docx` lives in `src/lib/contractor-agreement.ts` (`AGREEMENT_VERSION`; change both together). Typed-name signature stamps `ica_signed_at/_name/_ip/_version` once (conditional update), renders the signed PDF with `pdf-lib` and emails it to the contractor with the owner inbox on bcc — that email is the file of record. Link minted by `signUrl()` in `src/lib/manage-token.ts`. Needs `lib/supabase/migrations/2026-11-03-onboarding-packet.sql` |
| `POST /api/cleaners/availability/` | Admin (cookie): `{ cleanerId, days }` saves the days a cleaner usually works (`mon`..`sun`) to `cleaners.available_days`; empty = any day. Toggled from the week board on `/admin/dispatch` (2026-11-02): cleaners x next 7 days, each cell a job / free / off, open jobs on top, cleaner pickers say "free Wed" / "booked: Rebecca AM" / "off Wednesdays". Nothing texted. Needs `lib/supabase/migrations/2026-11-02-cleaner-available-days.sql` |

Set these in Netlify → Site settings → Environment variables for production. Locally they live in `.env.local` (gitignored).

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
SENDGRID_API_KEY
SENDGRID_FROM_EMAIL
SENDGRID_FROM_NAME
SENDGRID_TO_EMAIL          # owner alert inbox — supports comma-separated list
OWNER_NOTIFY_PHONE         # new-booking SMS alerts — comma-separated E.164 list (personal cell + company line)
GOOGLE_CALENDAR_ID
GOOGLE_CALENDAR_OWNER_EMAIL
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
NEXT_PUBLIC_SITE_URL
SITE_URL
CRON_SECRET                # auth for scheduled jobs (daily cleaner reminders) — must match in Netlify
GOOGLE_PLACES_API_KEY      # optional — live Google rating on the homepage (Places API enabled on the key)
GOOGLE_PLACE_ID            # optional — the Manhattan Mint listing's place id; missing/failed fetch hides the number, never fakes it
REVIEW_NUDGE_ENABLED       # optional — day-3 Google review nudge in /api/reminders; OFF unless exactly "true"
```

Review tracking (2026-09-18) needs five columns on `bookings` — run `lib/supabase/migrations/2026-09-18-review-tracking.sql` once in the Supabase SQL editor. The code tolerates their absence (logs, falls back to the plain Google link) so deploy order doesn't matter.
CERTN_API_KEY              # optional — onboarding packet creates the Certn background-check invite when set; without it the owner invites by hand
CERTN_API_BASE             # optional — default https://api.certn.co (use https://demo-api.certn.co to test)
CERTN_AUTH_SCHEME          # optional — "Bearer" (default) or "Api-Key", whichever the Certn account uses
CERTN_REQUEST_FLAGS        # optional — comma-separated Certn request flags; default request_criminal_record_check
