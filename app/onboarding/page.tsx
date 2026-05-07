// app/onboarding/page.tsx
// Public cleaner onboarding intake form for Manhattan Mint NYC.
// v1 — captures candidate profile + consent. Banking via Stripe Connect (sent after approval).

'use client';

import { useState } from 'react';

const NYC_AREAS = [
  'Manhattan - Below 14th',
  'Manhattan - 14th to 96th',
  'Manhattan - Above 96th',
  'Brooklyn - Brooklyn Heights / DUMBO / Williamsburg',
  'Brooklyn - Park Slope / Prospect Heights',
  'Brooklyn - Bushwick / Bed-Stuy / Crown Heights',
  'Brooklyn - Other',
  'Queens - Long Island City / Astoria',
  'Queens - Other',
  'Bronx',
  'Staten Island',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function OnboardingPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const fd = new FormData(form);

    const payload = {
      legalName: fd.get('legalName'),
      preferredName: fd.get('preferredName'),
      email: fd.get('email'),
      phone: fd.get('phone'),
      address: fd.get('address'),
      city: fd.get('city'),
      state: fd.get('state'),
      zip: fd.get('zip'),
      yearsExperience: fd.get('yearsExperience'),
      pastEmployers: fd.get('pastEmployers'),
      hasOwnTransport: fd.get('hasOwnTransport') === 'yes',
      hasOwnInsurance: fd.get('hasOwnInsurance') === 'yes',
      serviceAreas: fd.getAll('serviceAreas'),
      availability: fd.getAll('availability'),
      consentBackgroundCheck: fd.get('consentBackgroundCheck') === 'on',
      consentContractorAgreement: fd.get('consentContractorAgreement') === 'on',
      consentInsuranceRequirements: fd.get('consentInsuranceRequirements') === 'on',
      heardAboutUs: fd.get('heardAboutUs'),
    };

    if (!payload.consentBackgroundCheck || !payload.consentContractorAgreement || !payload.consentInsuranceRequirements) {
      setError('All consents are required to proceed.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/onboarding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Submission failed');
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again or email us directly.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-semibold mb-4">Application received</h1>
        <p className="text-lg leading-relaxed">
          Thanks for applying to Manhattan Mint. We&rsquo;ve sent a confirmation to your email
          with the next steps, including the contractor agreement and a link to begin your
          background check. You&rsquo;ll hear from us within 2 business days.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-semibold mb-2">Cleaner Application</h1>
      <p className="text-base text-gray-600 mb-8">
        Manhattan Mint hires experienced cleaners as independent contractors. Complete this
        form and we&rsquo;ll be in touch with the contractor agreement, background check
        consent, and insurance requirements.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="space-y-4">
          <legend className="text-xl font-semibold">Contact</legend>
          <Field name="legalName" label="Legal name (as on government ID)" required />
          <Field name="preferredName" label="Preferred name" />
          <Field name="email" label="Email" type="email" required />
          <Field name="phone" label="Phone" type="tel" required />
          <Field name="address" label="Street address" required />
          <div className="grid grid-cols-3 gap-4">
            <Field name="city" label="City" required />
            <Field name="state" label="State" required defaultValue="NY" />
            <Field name="zip" label="ZIP" required />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-xl font-semibold">Experience</legend>
          <Field name="yearsExperience" label="Years of professional cleaning experience" type="number" required />
          <Field name="pastEmployers" label="Recent employers / clients (most recent first)" textarea />

          <RadioYesNo name="hasOwnTransport" label="Do you have reliable transportation in NYC?" />
          <RadioYesNo name="hasOwnInsurance" label="Do you currently carry your own general liability insurance?" />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-xl font-semibold">Service areas (select all that apply)</legend>
          {NYC_AREAS.map((area) => (
            <label key={area} className="flex items-center gap-3">
              <input type="checkbox" name="serviceAreas" value={area} />
              <span>{area}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-xl font-semibold">Availability</legend>
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((d) => (
              <label key={d} className="flex flex-col items-center gap-1">
                <input type="checkbox" name="availability" value={d} />
                <span className="text-sm">{d}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-xl font-semibold">Consents</legend>

          <Checkbox
            name="consentBackgroundCheck"
            label="I consent to a background check via Certn as a condition of being considered."
          />
          <Checkbox
            name="consentContractorAgreement"
            label="I understand Manhattan Mint engages cleaners as independent contractors (1099) and I agree to review and sign the standard contractor agreement."
          />
          <Checkbox
            name="consentInsuranceRequirements"
            label="I understand I must provide a Certificate of Insurance (GL with limits matching Manhattan Mint&rsquo;s policy, waiver of subrogation, and Manhattan Mint NYC LLC named as additional insured) before working any job."
          />
        </fieldset>

        <Field name="heardAboutUs" label="How did you hear about us?" />

        {error && <p className="text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-black text-white py-3 rounded-md disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>
      </form>
    </main>
  );
}

function Field({
  name,
  label,
  type = 'text',
  required = false,
  textarea = false,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium block mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {textarea ? (
        <textarea
          name={name}
          required={required}
          defaultValue={defaultValue}
          className="w-full border rounded px-3 py-2 min-h-[80px]"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue}
          className="w-full border rounded px-3 py-2"
        />
      )}
    </label>
  );
}

function Checkbox({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex items-start gap-3">
      <input type="checkbox" name={name} className="mt-1" />
      <span className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: label }} />
    </label>
  );
}

function RadioYesNo({ name, label }: { name: string; label: string }) {
  return (
    <div>
      <p className="text-sm font-medium mb-2">{label}</p>
      <div className="flex gap-6">
        <label className="flex items-center gap-2">
          <input type="radio" name={name} value="yes" required /> Yes
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name={name} value="no" required /> No
        </label>
      </div>
    </div>
  );
}
