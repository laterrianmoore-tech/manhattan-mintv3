"use client";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

        <p className="text-slate-700 mb-4">
          Your use of this website is governed by the terms and conditions set forth below.
          By using this website, you agree to comply with and be bound by these terms and conditions.
          You may not use this website and should exit it now if you do not agree with these terms and conditions.
          Manhattan Mint may make changes to this website, including these terms and conditions, at any time without notice.
          You agree to be bound by the current version of these terms.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Pricing</h2>
        <p className="text-slate-700 mb-4">
          We offer flat-rate pricing based on the size of the home, though we reserve the right to adjust the price for fairness
          if your home is larger or messier than normal. We allow you to adjust our estimate as you see fit, though it may void our guarantee (see below).
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Payments</h2>
        <ul className="list-disc pl-6 text-slate-700 space-y-2">
          <li>We require a major credit or debit card on file to schedule an appointment.</li>
          <li>We may place a hold (shows as “pending” on some statements)—not a charge—from the time of scheduling to the time of the cleaning.</li>
          <li>Your card will be charged after the cleaning is complete.</li>
          <li>We may charge a $25 late payment fee in the case of a declining card not allowing our usual charge window.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">Guarantee</h2>
        <p className="text-slate-700 mb-2">
          We offer a full service guarantee. This includes a free re-clean of the spots that were missed during your initial cleaning.
          If you are not satisfied with the re-clean you are entitled to a full refund.
        </p>
        <p className="text-slate-700">
          This guarantee does not necessarily apply if:
        </p>
        <ul className="list-disc pl-6 text-slate-700 space-y-2">
          <li>You alerted us to the issue more than 48 hours post-cleaning.</li>
          <li>You were present during the cleaning and approved the work on-site.</li>
          <li>You under-adjusted the original estimate we made through our website or over the phone.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">Safety</h2>
        <p className="text-slate-700">
          Due to safety concerns, we will not allow our cleaners to move and/or lift heavy items. If you would like us to clean behind large appliances or furniture,
          please move them prior to our arrival.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Arrival</h2>
        <p className="text-slate-700">
          We reserve the right to arrive within a 30 minute window of the scheduled cleaning time. For example, if the booking time is 12:00 PM,
          we may arrive between 11:30 AM and 12:30 PM.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Cancellations</h2>
        <ul className="list-disc pl-6 text-slate-700 space-y-2">
          <li>We request that cancellations take place at least 24 hours before the appointment.</li>
          <li>Cancellations or reschedulings made within 24 hours of the cleaning will result in a $50 fee.</li>
          <li>Cleaners being denied access at the time of cleaning (customer no-show or lock-out) will result in a $119 fee.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">Reviews</h2>
        <p className="text-slate-700">
          We request up to 7 days to resolve any issues before you post feedback to external platforms (e.g., Google, Yelp, etc.).
          We work incredibly hard to take care of our clientele and appreciate that this respect is mutual.
        </p>
      </div>
    </div>
  );
}
