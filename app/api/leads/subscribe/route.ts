import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  renderCampaignEmail,
  unsubscribeUrl,
  hero,
  para,
  offerBlock,
  featureRow,
  ctaBlock,
} from "@/lib/email/campaign-template";

export async function POST(req: Request) {
  let email: string, name: string | undefined;
  try {
    ({ email, name } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const { error: dbError } = await supabaseAdmin
    .from("email_subscribers")
    .upsert(
      { email: email.toLowerCase().trim(), name: name?.trim() || null },
      { onConflict: "email" }
    );

  if (dbError) {
    console.error("Supabase error:", dbError);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  const from = {
    email: process.env.SENDGRID_FROM_EMAIL!,
    name: process.env.SENDGRID_FROM_NAME || "Manhattan Mint",
  };
  const siteUrl = process.env.SITE_URL || "https://manhattanmintnyc.com";
  const cleanEmail = email.toLowerCase().trim();

  // The popup promises the $25 code "straight to your inbox" — deliver it.
  try {
    await sgMail.send({
      to: cleanEmail,
      from,
      subject: "Your $25 off is here — Manhattan Mint",
      html: renderCampaignEmail({
        preheader: "Use code MINT25 for $25 off your first clean — studios from $150.",
        bodyHtml: `
          ${hero(
            "Welcome offer",
            `Welcome${name ? `, ${name.trim().split(" ")[0]}` : ""} — your $25 off is here`,
            "As promised, straight to your inbox. Use this on your first clean — it works on any apartment size and any service type.",
          )}
          ${offerBlock("MINT25", "Your code", "$25 off your first clean · studios & 1BRs from $150")}
          ${featureRow("Book online in about a minute.", "Flat-rate pricing shown upfront — no phone calls, no estimates. Enter MINT25 in the coupon field and the price updates instantly.")}
          ${featureRow("A professional you can trust.", "Every cleaner is background-checked, insured, and trained to our standard. We work exclusively in Manhattan.")}
          ${featureRow("Charged only after the clean.", "Your card is saved at booking and charged when the work is done — with a photo summary in your inbox and a 100% satisfaction guarantee behind it.")}
          ${para("We usually have availability within 24 hours, and same-week is almost always doable.")}
          ${ctaBlock(`${siteUrl}/quote/`, "Book with $25 off", "60-second booking · same-week availability")}`,
        unsubscribeUrl: unsubscribeUrl(cleanEmail, siteUrl),
        siteUrl,
      }),
    });
  } catch (welcomeErr) {
    console.error("SendGrid welcome email error:", welcomeErr);
  }

  try {
    await sgMail.send({
      to: "hello@manhattanmintnyc.com",
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: process.env.SENDGRID_FROM_NAME || "Manhattan Mint",
      },
      subject: `New subscriber: ${email}`,
      text: `New email subscriber joined the marketing list.\n\nEmail: ${email}\nName: ${name || "Not provided"}\n\nView full list: Supabase → email_subscribers table.`,
      html: `
        <div style="font-family:'DM Sans',sans-serif;max-width:480px;padding:2rem;background:#f8f8f6;border-radius:8px;">
          <div style="color:#1D9E75;font-size:12px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:1rem;">New Subscriber</div>
          <p style="font-size:16px;color:#0F0F0F;margin:0 0 .5rem;"><strong>${email}</strong></p>
          <p style="font-size:14px;color:#888;margin:0 0 1.5rem;">${name || "Name not provided"}</p>
          <p style="font-size:12px;color:#bbb;">View the full list in Supabase → <code>email_subscribers</code> table.</p>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error("SendGrid notification error:", emailErr);
  }

  return NextResponse.json({ success: true });
}
