import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

export const maxDuration = 30;

// Cleaner application from /careers. Required: name, email, phone, years of
// experience, resume (PDF/Word, ≤5 MB). Emails the owner with the resume
// attached; nothing is stored server-side beyond the email.
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const get = (k: string) => String(form.get(k) ?? "").trim();
    const name = get("name"), email = get("email"), phone = get("phone"), years = get("years"), notes = get("notes");
    const honeypot = get("company");
    const resume = form.get("resume");

    if (honeypot) return NextResponse.json({ ok: true }); // bot; pretend success
    if (!name || !email || !phone || !years) {
      return NextResponse.json({ error: "Name, email, phone and years of experience are required." }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "That email address doesn't look right." }, { status: 400 });
    }
    if (!(resume instanceof File) || resume.size === 0) {
      return NextResponse.json({ error: "Please attach your resume." }, { status: 400 });
    }
    if (resume.size > MAX_BYTES) {
      return NextResponse.json({ error: "Resume must be under 5 MB." }, { status: 400 });
    }
    const ext = resume.name.toLowerCase().split(".").pop() || "";
    if (!ALLOWED.has(resume.type) && !["pdf", "doc", "docx"].includes(ext)) {
      return NextResponse.json({ error: "Resume must be a PDF or Word document." }, { status: 400 });
    }

    const apiKey = process.env.SENDGRID_API_KEY;
    const from = process.env.SENDGRID_FROM_EMAIL;
    const to = (process.env.SENDGRID_TO_EMAIL || "hello@manhattanmintnyc.com").split(",").map((s) => s.trim()).filter(Boolean);
    if (!apiKey || !from) {
      console.error("[careers] SendGrid not configured");
      return NextResponse.json({ error: "We couldn't send your application right now. Please email it to hello@manhattanmintnyc.com." }, { status: 500 });
    }
    sgMail.setApiKey(apiKey);

    const content = Buffer.from(await resume.arrayBuffer()).toString("base64");
    const safeName = resume.name.replace(/[^\w.\- ]+/g, "_").slice(0, 80) || `resume.${ext || "pdf"}`;
    const text = [
      `New cleaner application from manhattanmintnyc.com/careers`,
      ``,
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Years of cleaning experience: ${years}`,
      `Notes: ${notes || "-"}`,
      ``,
      `Resume attached: ${safeName}`,
      ``,
      `Reply to this email to reach the applicant directly.`,
    ].join("\n");

    await sgMail.send({
      to,
      from: { email: from, name: process.env.SENDGRID_FROM_NAME || "Manhattan Mint" },
      replyTo: { email, name },
      subject: `Cleaner application — ${name} (${years})`,
      text,
      attachments: [{ content, filename: safeName, type: resume.type || "application/octet-stream", disposition: "attachment" }],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[careers] apply error", err);
    return NextResponse.json({ error: "Something went wrong sending your application. Please try again or email hello@manhattanmintnyc.com." }, { status: 500 });
  }
}
