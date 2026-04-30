# Manhattan Mint NYC LLC — Codebase Vision

## What this is

Manhattan Mint is a New York City residential cleaning service. This Next.js codebase is the company's entire operating system — not just a website. The long-term goal is full automation: customers book, cleaners get dispatched, jobs get done, cards get charged, and payouts go out without Laterrian (the owner) touching any of it manually.

**Read `credentials/README.md` (gitignored) for all API keys, service accounts, and current system state before making changes.**

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

**What's still manual in Phase 1:** Owner must call `/api/bookings/charge` after each appointment to collect payment.

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

---

## Environment Variables (all required)

Set these in Netlify → Site settings → Environment variables for production. Locally they live in `.env.local` (gitignored).

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
SENDGRID_API_KEY
SENDGRID_FROM_EMAIL
SENDGRID_FROM_NAME
SENDGRID_TO_EMAIL
GOOGLE_CALENDAR_ID
GOOGLE_CALENDAR_OWNER_EMAIL
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
NEXT_PUBLIC_SITE_URL
SITE_URL
```
