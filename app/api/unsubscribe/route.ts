import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyUnsubscribeToken } from "@/lib/email/campaign-template";

export const dynamic = "force-dynamic";

function page(title: string, message: string): Response {
  return new Response(
    `<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} — Manhattan Mint</title></head>
<body style="margin:0;background:#f7f7f5;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:480px;margin:80px auto;padding:0 20px;">
    <div style="background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,0.06);text-align:center;">
      <h1 style="margin:0 0 8px;color:#2d6a4f;font-size:22px;">Manhattan Mint</h1>
      <h2 style="margin:0 0 12px;color:#0f0f0f;font-size:18px;">${title}</h2>
      <p style="margin:0 0 24px;color:#555;font-size:15px;">${message}</p>
      <a href="https://manhattanmintnyc.com" style="color:#2d6a4f;font-size:14px;">← Back to manhattanmintnyc.com</a>
    </div>
  </div>
</body>
</html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function unsubscribe(req: Request, source: string): Promise<Response> {
  const url = new URL(req.url);
  const email = (url.searchParams.get("e") ?? "").trim().toLowerCase();
  const token = url.searchParams.get("t") ?? "";

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return page(
      "Link not valid",
      "This unsubscribe link is invalid or incomplete. Reply to any of our emails and we'll remove you manually.",
    );
  }

  const { error } = await supabaseAdmin
    .from("email_unsubscribes")
    .upsert({ email, source }, { onConflict: "email" });

  if (error) {
    console.error("[unsubscribe] upsert failed:", error);
    return page(
      "Something went wrong",
      "We couldn't process that just now. Reply to any of our emails and we'll remove you manually.",
    );
  }

  return page(
    "You're unsubscribed",
    "You won't receive any more marketing emails from us. Booking confirmations and appointment updates still arrive as usual.",
  );
}

export async function GET(req: Request) {
  return unsubscribe(req, "link");
}

// RFC 8058 one-click unsubscribe (mail clients POST here directly)
export async function POST(req: Request) {
  return unsubscribe(req, "one-click");
}
