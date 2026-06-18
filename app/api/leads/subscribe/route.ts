import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import { supabaseAdmin } from "@/lib/supabase/server";

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
