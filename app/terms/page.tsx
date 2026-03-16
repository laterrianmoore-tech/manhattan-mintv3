"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Serif+Display:ital@1&display=swap');

      :root {
        --mint: #1D9E75;
        --dark: #0F0F0F;
        --gray: #888;
        --soft: #F8F8F6;
      }

      .terms-page {
        min-height: 100vh;
        background: var(--soft);
        color: var(--dark);
        font-family: 'DM Sans', sans-serif;
      }

      .terms-wrap {
        max-width: 720px;
        margin: 0 auto;
        padding: 4.5rem 1.5rem 6rem;
      }

      .back-link {
        color: var(--mint);
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 500;
      }

      .back-link:hover {
        text-decoration: underline;
      }

      h1 {
        margin: 1.5rem 0 2rem;
        font-family: 'DM Serif Display', serif;
        font-style: italic;
        font-weight: 400;
        font-size: clamp(2.2rem, 4.8vw, 3.1rem);
        line-height: 1.05;
        letter-spacing: -0.01em;
      }

      h2 {
        margin: 2.25rem 0 0.65rem;
        font-family: 'DM Sans', sans-serif;
        font-weight: 500;
        font-size: 1.05rem;
        letter-spacing: 0.01em;
      }

      p,
      li {
        color: var(--dark);
        font-family: 'DM Sans', sans-serif;
        font-weight: 300;
        font-size: 0.97rem;
        line-height: 1.8;
      }

      p {
        margin-bottom: 1rem;
      }

      ul {
        margin: 0.15rem 0 0;
        padding-left: 1.2rem;
      }

      li {
        margin: 0.35rem 0;
      }
      `}</style>

      <main className="terms-page">
        <div className="terms-wrap">
          <Link className="back-link" href="/">
            Back to home
          </Link>

          <h1>Terms of Service</h1>

          <p>
            Your use of this website is governed by the terms and conditions set forth below.
            By using this website, you agree to comply with and be bound by these terms and conditions.
            You may not use this website and should exit it now if you do not agree with these terms and conditions.
            Manhattan Mint may make changes to this website, including these terms and conditions, at any time without notice.
            You agree to be bound by the current version of these terms.
          </p>

          <h2>Pricing</h2>
          <p>
            We offer flat-rate pricing based on the size of the home, though we reserve the right to adjust the price for fairness
            if your home is larger or messier than normal. We allow you to adjust our estimate as you see fit, though it may void our guarantee (see below).
          </p>

          <h2>Payments</h2>
          <ul>
            <li>We require a major credit or debit card on file to schedule an appointment.</li>
            <li>We may place a hold (shows as “pending” on some statements)—not a charge—from the time of scheduling to the time of the cleaning.</li>
            <li>Your card will be charged after the cleaning is complete.</li>
            <li>We may charge a $25 late payment fee in the case of a declining card not allowing our usual charge window.</li>
          </ul>

          <h2>Guarantee</h2>
          <p>
            We offer a full service guarantee. This includes a free re-clean of the spots that were missed during your initial cleaning.
            If you are not satisfied with the re-clean you are entitled to a full refund.
          </p>
          <p>
            This guarantee does not necessarily apply if:
          </p>
          <ul>
            <li>You alerted us to the issue more than 48 hours post-cleaning.</li>
            <li>You were present during the cleaning and approved the work on-site.</li>
            <li>You under-adjusted the original estimate we made through our website or over the phone.</li>
          </ul>

          <h2>Safety</h2>
          <p>
            Due to safety concerns, we will not allow our cleaners to move and/or lift heavy items. If you would like us to clean behind large appliances or furniture,
            please move them prior to our arrival.
          </p>

          <h2>Arrival</h2>
          <p>
            We reserve the right to arrive within a 30 minute window of the scheduled cleaning time. For example, if the booking time is 12:00 PM,
            we may arrive between 11:30 AM and 12:30 PM.
          </p>

          <h2>Cancellations</h2>
          <ul>
            <li>We request that cancellations take place at least 24 hours before the appointment.</li>
            <li>Cancellations or reschedulings made within 24 hours of the cleaning will result in a $50 fee.</li>
            <li>Cleaners being denied access at the time of cleaning (customer no-show or lock-out) will result in a $119 fee.</li>
          </ul>

          <h2>Reviews</h2>
          <p>
            We request up to 7 days to resolve any issues before you post feedback to external platforms (e.g., Google, Yelp, etc.).
            We work incredibly hard to take care of our clientele and appreciate that this respect is mutual.
          </p>
        </div>
      </main>
    </>
  );
}
