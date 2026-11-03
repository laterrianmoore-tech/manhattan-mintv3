// app/api/onboarding/submit/route.ts
// Receives /onboarding form submissions: saves the applicant to `cleaners`
// (status pending_onboarding) and sends the onboarding packet — Stripe
// Connect link, Certn invite, e-sign contractor agreement — in one email and
// one text (src/lib/onboarding-packet.ts). The owner gets the application
// details plus what the packet did. Since 2026-11-03 nothing here waits on the
// owner; before that the candidate got a "we'll be in touch" email and the
// owner did the three steps by hand.

import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sendOnboardingPacket, type PacketResult } from '@/lib/onboarding-packet';

export const maxDuration = 30;

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const FROM = {
  email: process.env.SENDGRID_FROM_EMAIL || 'hello@manhattanmintnyc.com',
  name: process.env.SENDGRID_FROM_NAME || 'Manhattan Mint',
};
const OWNER = (process.env.OWNER_NOTIFY_EMAIL || process.env.SENDGRID_TO_EMAIL || 'hello@manhattanmintnyc.com')
  .split(',').map((e) => e.trim()).filter(Boolean);

type Application = {
  legalName: string;
  preferredName?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  yearsExperience: string;
  pastEmployers?: string;
  hasOwnTransport: boolean;
  hasOwnInsurance: boolean;
  serviceAreas: string[];
  availability: string[];
  consentBackgroundCheck: boolean;
  consentContractorAgreement: boolean;
  consentInsuranceRequirements: boolean;
  heardAboutUs?: string;
};

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch] as string));

export async function POST(req: NextRequest) {
  let body: Application;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.legalName || !body.email || !body.phone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) {
    return NextResponse.json({ error: "That email address doesn't look right" }, { status: 400 });
  }
  if (!body.consentBackgroundCheck || !body.consentContractorAgreement || !body.consentInsuranceRequirements) {
    return NextResponse.json({ error: 'All consents are required' }, { status: 400 });
  }

  const legalName = body.legalName.trim().replace(/\s+/g, ' ');
  const nameParts = legalName.split(' ');
  // The cleaner's row shows her preferred name on the portal and in texts;
  // the legal name is what the agreement is made out to.
  const firstName = (body.preferredName || nameParts[0]).trim();
  const lastName = nameParts.slice(1).join(' ') || '';
  const email = body.email.trim().toLowerCase();
  const address = [body.address, [body.city, body.state].filter(Boolean).join(', '), body.zip]
    .map((s) => String(s ?? '').trim()).filter(Boolean).join(', ');

  // 1) Save the applicant. New columns (legal_name, address) exist once
  //    migrations/2026-11-03-onboarding-packet.sql has run; before that, save
  //    without them rather than lose the application.
  let cleanerId: string | null = null;
  let saveError: string | null = null;
  const base = { first_name: firstName, last_name: lastName, email, phone: body.phone.trim(), status: 'pending_onboarding' as const, zones: body.serviceAreas || [] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabaseAdmin as any;
  let res = await db.from('cleaners').upsert({ ...base, legal_name: legalName, address }, { onConflict: 'email', ignoreDuplicates: false }).select('id').single();
  if (res.error && /legal_name|address/i.test(res.error.message)) {
    res = await db.from('cleaners').upsert(base, { onConflict: 'email', ignoreDuplicates: false }).select('id').single();
  }
  if (res.error) {
    saveError = res.error.message;
    console.error('Supabase cleaner upsert failed:', res.error);
  } else {
    cleanerId = res.data?.id ?? null;
  }

  // 2) The packet. Any failure here is reported to the owner, never to the
  //    applicant — she still sees "application received".
  let packet: PacketResult | null = null;
  let packetError: string | null = null;
  if (cleanerId) {
    try {
      packet = await sendOnboardingPacket({ cleanerId, notifyOwner: false });
    } catch (e) {
      packetError = e instanceof Error ? e.message : String(e);
      console.error('[onboarding/submit] packet failed:', packetError);
    }
  } else {
    packetError = `applicant was not saved (${saveError}) so no packet went out`;
  }

  // 3) Fallback confirmation to the candidate only if the packet didn't go.
  const candidateFallback = packet?.emailSent ? null : {
    to: email,
    from: FROM,
    subject: 'Manhattan Mint — Application Received',
    html: `
      <p>Hi ${esc(firstName)},</p>
      <p>Thanks for applying to clean with Manhattan Mint. Your application is in our queue and we&rsquo;ll follow up within 2 business days with your contractor agreement, Stripe payout setup and background-check link.</p>
      <p>Questions? Reply to this email or text (914) 863-7902.</p>
      <p>Manhattan Mint Luxury Cleaning</p>
    `,
  };

  // 4) Owner: the application + what the packet did.
  const packetStatus = packet
    ? [
        `<li>Packet email: ${packet.emailSent ? 'sent' : 'NOT sent'}; text: ${packet.smsSent ? 'sent' : `NOT sent${packet.smsError ? ` (${esc(packet.smsError)})` : ''}`}</li>`,
        `<li>Stripe Connect: ${esc(packet.connectAccountId ?? '-')}${packet.connectCreated ? ' (new account)' : ''}</li>`,
        `<li>Certn: ${esc(certnText(packet))}</li>`,
        `<li>Agreement: e-sign link sent (<a href="${esc(packet.signUrl)}">open</a>) — you'll get the signed PDF by email.</li>`,
      ].join('')
    : `<li><strong>Packet did not go out:</strong> ${esc(packetError)}. Send it from <a href="https://manhattanmintnyc.com/admin/onboarding/">/admin/onboarding</a> once fixed.</li>`;

  const ownerMsg = {
    to: OWNER,
    from: FROM,
    replyTo: { email, name: legalName },
    subject: `New cleaner application: ${legalName}${packet?.emailSent ? ' — packet sent' : ' — PACKET NOT SENT'}`,
    html: `
      <h2>New Application</h2>
      <table style="border-collapse: collapse;">
        <tr><td><strong>Name:</strong></td><td>${esc(legalName)} (${esc(body.preferredName || '—')})</td></tr>
        <tr><td><strong>Email:</strong></td><td>${esc(email)}</td></tr>
        <tr><td><strong>Phone:</strong></td><td>${esc(body.phone)}</td></tr>
        <tr><td><strong>Address:</strong></td><td>${esc(address)}</td></tr>
        <tr><td><strong>Experience:</strong></td><td>${esc(body.yearsExperience)} years</td></tr>
        <tr><td><strong>Past employers:</strong></td><td>${esc(body.pastEmployers || '—')}</td></tr>
        <tr><td><strong>Transport:</strong></td><td>${body.hasOwnTransport ? 'Yes' : 'No'}</td></tr>
        <tr><td><strong>Has GL insurance:</strong></td><td>${body.hasOwnInsurance ? 'Yes' : 'No'}</td></tr>
        <tr><td><strong>Service areas:</strong></td><td>${esc((body.serviceAreas || []).join('; '))}</td></tr>
        <tr><td><strong>Availability:</strong></td><td>${esc((body.availability || []).join(', '))}</td></tr>
        <tr><td><strong>Heard about us:</strong></td><td>${esc(body.heardAboutUs || '—')}</td></tr>
      </table>
      <h3>Onboarding packet</h3>
      <ul>${packetStatus}</ul>
      <h3>Still on you</h3>
      <ol>
        ${packet && packet.certn.status !== 'invited' && packet.certn.status !== 'already_invited' ? `<li>Send the Certn invite to ${esc(email)} from the Certn dashboard.</li>` : ''}
        <li>Verify the COI (and CE-200) before her first job.</li>
        <li>Set her to active in Supabase once the agreement is signed, Stripe is finished and Certn clears — <a href="https://manhattanmintnyc.com/admin/onboarding/">/admin/onboarding</a> shows all four gates.</li>
      </ol>
    `,
  };

  try {
    await Promise.allSettled([candidateFallback ? sgMail.send(candidateFallback) : Promise.resolve(), sgMail.send(ownerMsg)]);
  } catch (e: any) {
    console.error('SendGrid error:', e?.response?.body || e);
  }

  return NextResponse.json({ ok: true, packetSent: !!packet?.emailSent });
}

function certnText(p: PacketResult): string {
  switch (p.certn.status) {
    case 'invited': return `invite sent (application ${p.certn.applicationId ?? '?'})`;
    case 'already_invited': return `already invited (${p.certn.applicationId ?? '?'})`;
    case 'not_configured': return 'NOT sent — no CERTN_API_KEY in Netlify. Invite her from the Certn dashboard.';
    case 'failed': return `FAILED — ${p.certn.error}. Invite her from the Certn dashboard.`;
    default: return p.certn.status;
  }
}
