// app/api/onboarding/submit/route.ts
// Receives /onboarding form submissions. Sends two emails (candidate + owner) and saves to Supabase.

import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { supabaseAdmin } from '@/lib/supabase/server';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const FROM = {
  email: process.env.SENDGRID_FROM_EMAIL || 'hello@manhattanmintnyc.com',
  name: process.env.SENDGRID_FROM_NAME || 'Manhattan Mint',
};
const OWNER = process.env.OWNER_NOTIFY_EMAIL || 'lmoore@apcap.com';

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
  if (!body.consentBackgroundCheck || !body.consentContractorAgreement || !body.consentInsuranceRequirements) {
    return NextResponse.json({ error: 'All consents are required' }, { status: 400 });
  }

  // 1) Email to the candidate — confirmation + next steps
  const candidateMsg = {
    to: body.email,
    from: FROM,
    subject: 'Manhattan Mint — Application Received',
    html: `
      <p>Hi ${body.preferredName || body.legalName.split(' ')[0]},</p>
      <p>Thanks for applying to clean with Manhattan Mint. Your application is in our queue and we&rsquo;ll review within 2 business days.</p>
      <p><strong>Next steps:</strong></p>
      <ol>
        <li>You&rsquo;ll receive a separate email from <strong>Certn</strong> to begin your background check. It takes about 5 minutes.</li>
        <li>We&rsquo;ll send the Manhattan Mint Independent Contractor Agreement for your review and e-signature.</li>
        <li>Once those are complete, we&rsquo;ll send you a Stripe Connect link so you can be paid for jobs.</li>
        <li>Before your first job, you&rsquo;ll need to provide a Certificate of Insurance with the requirements you consented to.</li>
      </ol>
      <p>Questions? Reply to this email or text us.</p>
      <p>— The Manhattan Mint Team</p>
    `,
  };

  // 2) Email to the owner — review + take action
  const ownerMsg = {
    to: OWNER,
    from: FROM,
    subject: `New cleaner application: ${body.legalName}`,
    html: `
      <h2>New Application</h2>
      <table style="border-collapse: collapse;">
        <tr><td><strong>Name:</strong></td><td>${body.legalName} (${body.preferredName || '—'})</td></tr>
        <tr><td><strong>Email:</strong></td><td>${body.email}</td></tr>
        <tr><td><strong>Phone:</strong></td><td>${body.phone}</td></tr>
        <tr><td><strong>Address:</strong></td><td>${body.address}, ${body.city}, ${body.state} ${body.zip}</td></tr>
        <tr><td><strong>Experience:</strong></td><td>${body.yearsExperience} years</td></tr>
        <tr><td><strong>Past employers:</strong></td><td>${body.pastEmployers || '—'}</td></tr>
        <tr><td><strong>Transport:</strong></td><td>${body.hasOwnTransport ? 'Yes' : 'No'}</td></tr>
        <tr><td><strong>Has GL insurance:</strong></td><td>${body.hasOwnInsurance ? 'Yes' : 'No'}</td></tr>
        <tr><td><strong>Service areas:</strong></td><td>${body.serviceAreas.join('; ')}</td></tr>
        <tr><td><strong>Availability:</strong></td><td>${body.availability.join(', ')}</td></tr>
        <tr><td><strong>Heard about us:</strong></td><td>${body.heardAboutUs || '—'}</td></tr>
      </table>
      <h3>Action items</h3>
      <ol>
        <li>Trigger Certn background check for ${body.email}</li>
        <li>Send contractor agreement (DocuSeal / HelloSign)</li>
        <li>Once cleared, send Stripe Connect onboarding link</li>
        <li>Verify COI meets requirements before first job</li>
      </ol>
    `,
  };

  try {
    await Promise.all([sgMail.send(candidateMsg), sgMail.send(ownerMsg)]);
  } catch (e: any) {
    console.error('SendGrid error:', e?.response?.body || e);
    return NextResponse.json({ error: 'Email send failed' }, { status: 500 });
  }

  // Save cleaner applicant to Supabase
  try {
    const nameParts = body.legalName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    const { error } = await supabaseAdmin
      .from('cleaners')
      .upsert(
        {
          first_name: firstName,
          last_name: lastName,
          email: body.email,
          phone: body.phone,
          status: 'pending_onboarding',
          zones: body.serviceAreas || [],
        },
        { onConflict: 'email', ignoreDuplicates: false }
      );

    if (error) {
      console.error('Supabase cleaner insert failed:', error);
    } else {
      console.log('Cleaner saved to Supabase:', body.email);
    }
  } catch (e) {
    console.error('Supabase error (emails still sent):', e);
  }

  return NextResponse.json({ ok: true });
}
