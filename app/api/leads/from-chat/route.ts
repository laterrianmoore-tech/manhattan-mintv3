import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const FROM = {
  email: process.env.SENDGRID_FROM_EMAIL || 'hello@manhattanmintnyc.com',
  name: process.env.SENDGRID_FROM_NAME || 'Manhattan Mint',
};
const OWNER = process.env.OWNER_NOTIFY_EMAIL || 'hello@manhattanmintnyc.com';

type ChatLead = {
  name: string;
  email: string;
  phone: string;
  neighborhood?: string;
  size?: string;
  type_of_clean?: string;
  preferred_timing?: string;
  summary: string;
};

export async function POST(req: NextRequest) {
  let body: ChatLead;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.name || !body.email || !body.phone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const msg = {
    to: OWNER,
    from: FROM,
    subject: `New chat lead: ${body.name}`,
    html: `
      <h2>New Chat Lead</h2>
      <table style="border-collapse:collapse;">
        <tr><td style="padding:4px 12px 4px 0;"><strong>Name</strong></td><td>${body.name}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;"><strong>Email</strong></td><td>${body.email}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;"><strong>Phone</strong></td><td>${body.phone}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;"><strong>Neighborhood</strong></td><td>${body.neighborhood || '—'}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;"><strong>Apartment size</strong></td><td>${body.size || '—'}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;"><strong>Type of clean</strong></td><td>${body.type_of_clean || '—'}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;"><strong>Preferred timing</strong></td><td>${body.preferred_timing || '—'}</td></tr>
      </table>
      <h3>Summary</h3>
      <p>${body.summary}</p>
    `,
  };

  try {
    await sgMail.send(msg);
  } catch (e: any) {
    console.error('SendGrid error:', e?.response?.body || e);
    return NextResponse.json({ error: 'Email send failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
