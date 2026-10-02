// One-off (2026-10-02): Juan Andrade's auto-charge failed (Mastercard ••8406, insufficient_funds) after his
// Oct 2 1BR/1BA clean by Veronica. Creates a $125 Stripe invoice (send_invoice, 7 days, emailed by Stripe) and
// a setup-mode Checkout link so he can put a fresh card on file. Idempotent via metadata.supabase_booking_id.
//   node scripts/juan-invoice-and-card-1002.mjs --apply
import { readFileSync } from "node:fs";
const APPLY = process.argv.includes("--apply");
const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/^"|"$/g, ""); }
const CUST = "cus_VMWnagRi5sm4XL";
const SB_BOOKING = "5a38a360-2b5a-4342-a803-dc7e097dde9e";
const AMOUNT_CENTS = 12500;
const SITE = "https://manhattanmintnyc.com";
const stripe = async (path, body) => {
  const r = await fetch(`https://api.stripe.com/v1/${path}`, { method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body: body ? new URLSearchParams(body) : undefined });
  const j = await r.json(); if (j.error) throw new Error(`${path}: ${j.error.message}`); return j;
};
const all = (await stripe(`invoices?customer=${CUST}&limit=10`)).data;
let inv = all.find((i) => i.metadata?.supabase_booking_id === SB_BOOKING && !["void", "deleted"].includes(i.status));
if (!inv && !APPLY) { console.log("Dry run: would create $125 invoice + card link. Re-run with --apply."); process.exit(0); }
if (!inv) {
  inv = await stripe("invoices", {
    customer: CUST, collection_method: "send_invoice", days_until_due: "7", auto_advance: "true",
    description: "Standard Clean — Thursday, October 2, 2026. 1 BR / 1 BA, 101 68th St, Apt 4C. Thank you for choosing Manhattan Mint.",
    "metadata[supabase_booking_id]": SB_BOOKING, "metadata[reason]": "auto-charge declined insufficient_funds",
  });
  await stripe("invoiceitems", { customer: CUST, invoice: inv.id, amount: String(AMOUNT_CENTS), currency: "usd",
    description: "Standard Clean - 1 Bedroom / 1 Bathroom (Thu Oct 2, 2026) - FALL50 applied ($175 - $50)" });
  console.log("Invoice draft created", inv.id);
} else console.log("Invoice exists", inv.id, inv.status);
if (inv.status === "draft") inv = await stripe(`invoices/${inv.id}/finalize`, {});
console.log("Invoice", inv.number, inv.status, "$" + inv.amount_due / 100, "due", new Date(inv.due_date * 1000).toISOString().slice(0, 10));
console.log("Hosted URL", inv.hosted_invoice_url);
const fresh = await stripe(`invoices/${inv.id}`);
if (APPLY && fresh.status === "open" && !fresh.metadata?.emailed_at) {
  await stripe(`invoices/${inv.id}/send`, {});
  await stripe(`invoices/${inv.id}`, { "metadata[emailed_at]": new Date().toISOString() });
  console.log("SENT via Stripe email to", fresh.customer_email?.replace(/^(.).*(@.*)$/, "$1***$2"));
} else console.log("Send skipped:", fresh.status, fresh.metadata?.emailed_at);
// Card-on-file link (setup mode, no charge). After he saves it: node scripts/card-on-file.mjs attach cus_VMWnagRi5sm4XL --write
const s = await stripe("checkout/sessions", { mode: "setup", customer: CUST, "payment_method_types[]": "card",
  success_url: `${SITE}/thank-you?card=saved`, cancel_url: `${SITE}/thank-you` });
console.log("Card setup link:", s.url);
