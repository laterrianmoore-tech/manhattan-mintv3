import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifySignToken } from "@/lib/manage-token";
import { sendSms } from "@/lib/openphone";
import { AGREEMENT_VERSION, renderSignedAgreementPdf } from "@/lib/contractor-agreement";
import { cleanerDisplayName } from "@/lib/onboarding-packet";

// E-signature of the Independent Contractor Agreement (2026-11-03). The /sign
// page posts { c, t, name, address, agree } from the signed link in the
// onboarding packet. One signature per cleaner: the stamp lives on
// cleaners.ica_signed_at and a second attempt is refused. The signed PDF goes
// to the contractor with the owner's inbox on bcc — that email is the file of
// record (save it under 02_Hiring/cleaners/<name>/ like HollyAnn's).
export const maxDuration = 30;

function clientIp(req: Request): string {
  return (
    req.headers.get("x-nf-client-connection-ip") ||
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    ""
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const cleanerId = String(body.c || "").trim();
  const token = String(body.t || "").trim();
  const name = String(body.name || "").trim().replace(/\s+/g, " ");
  const address = String(body.address || "").trim();
  if (!cleanerId || !verifySignToken(cleanerId, token)) {
    return NextResponse.json({ ok: false, error: "This link isn't valid." }, { status: 403 });
  }
  if (body.agree !== true) {
    return NextResponse.json({ ok: false, error: "Please confirm you have read and agree to the agreement." }, { status: 400 });
  }
  if (name.length < 3 || !/\s/.test(name)) {
    return NextResponse.json({ ok: false, error: "Type your full legal name (first and last) as your signature." }, { status: 400 });
  }

  const { data: c, error } = await supabaseAdmin.from("cleaners").select("*").eq("id", cleanerId).single();
  if (error || !c) return NextResponse.json({ ok: false, error: "This link isn't valid." }, { status: 404 });
  if (c.ica_signed_at) {
    return NextResponse.json({ ok: false, alreadySignedAt: c.ica_signed_at, error: "This agreement was already signed." }, { status: 409 });
  }

  const signedAtIso = new Date().toISOString();
  const ip = clientIp(req);
  // Claim first: a conditional update so two taps can't both "sign".
  const { data: claimed, error: claimErr } = await supabaseAdmin
    .from("cleaners")
    .update({
      ica_signed_at: signedAtIso,
      ica_signed_name: name,
      ica_signed_ip: ip,
      ica_version: AGREEMENT_VERSION,
      legal_name: name,
      ...(address ? { address } : {}),
    })
    .eq("id", cleanerId)
    .is("ica_signed_at", null)
    .select("id");
  if (claimErr) {
    console.error("[sign] stamp failed:", claimErr.message);
    const msg = /ica_signed_at|legal_name|address/i.test(claimErr.message)
      ? "Signing isn't set up in the database yet — run lib/supabase/migrations/2026-11-03-onboarding-packet.sql."
      : "Couldn't record the signature. Please try again or text (914) 863-7902.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
  if (!claimed || claimed.length === 0) {
    return NextResponse.json({ ok: false, error: "This agreement was already signed." }, { status: 409 });
  }

  // Signed copy to both sides. A failure here never un-signs; the owner can
  // regenerate from the stamped fields.
  let emailed = false;
  let emailError: string | null = null;
  try {
    const pdf = await renderSignedAgreementPdf({
      contractorName: name,
      address: address || c.address || "",
      email: c.email,
      phone: c.phone,
      signedAtIso,
      signedIp: ip,
      cleanerId,
    });
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) throw new Error("SENDGRID_API_KEY not set");
    sgMail.setApiKey(apiKey);
    const owners = (process.env.OWNER_NOTIFY_EMAIL || process.env.SENDGRID_TO_EMAIL || "hello@manhattanmintnyc.com")
      .split(",").map((e) => e.trim()).filter((e) => e && e.toLowerCase() !== c.email.toLowerCase());
    const dateSlug = signedAtIso.slice(0, 10);
    const nameSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await sgMail.send({
      to: { email: c.email, name },
      bcc: owners,
      from: { email: process.env.SENDGRID_FROM_EMAIL || "hello@manhattanmintnyc.com", name: process.env.SENDGRID_FROM_NAME || "Manhattan Mint" },
      subject: `Signed: Independent Contractor Agreement — ${name}`,
      text: [
        `Hi ${c.first_name},`,
        ``,
        `Thanks — your Independent Contractor Agreement with Manhattan Mint NYC LLC is signed. The signed copy is attached for your records.`,
        ``,
        `Next: finish your Stripe payout setup and the Certn background check from your onboarding email, and send us your Certificate of Insurance before your first job.`,
        ``,
        `Questions? Reply to this email or text (914) 863-7902.`,
        ``,
        `Manhattan Mint Luxury Cleaning`,
      ].join("\n"),
      attachments: [
        {
          content: Buffer.from(pdf).toString("base64"),
          filename: `Manhattan-Mint-ICA-${nameSlug}-${dateSlug}.pdf`,
          type: "application/pdf",
          disposition: "attachment",
        },
      ],
    });
    emailed = true;
  } catch (e) {
    emailError = e instanceof Error ? e.message : String(e);
    console.error("[sign] signed-copy email failed:", emailError);
  }

  const ownerPhones = (process.env.OWNER_NOTIFY_PHONE || "").split(",").map((p) => p.trim()).filter(Boolean);
  for (const phone of ownerPhones) {
    await sendSms({
      to: phone,
      body: `✍️ ${cleanerDisplayName({ ...c, legal_name: name })} signed the contractor agreement.${emailed ? " Signed PDF is in hello@." : ` ⚠️ PDF email failed: ${emailError}`}`,
      cleanerId,
      recipientType: "cleaner",
      eventType: "other",
    }).catch(() => undefined);
  }

  return NextResponse.json({ ok: true, signedAt: signedAtIso, emailed });
}
