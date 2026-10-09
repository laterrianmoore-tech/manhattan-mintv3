import Stripe from "stripe";
import { supabaseAdmin } from "./supabase";

// NY sales tax on top of the price, through Stripe Tax (2026-10-10).
//
// Owner decision: add tax on top for NEW customers only; nobody who booked
// before TAX_START_AT pays it until the owner says otherwise (they get a
// heads-up first). The quote page keeps showing the pre-tax price with a
// footnote; the tax appears on the hold, the charge, the receipt and the
// confirmation email.
//
// Stripe Tax is already active on the account with a New York registration
// and the "Residential Cleaning Services" tax code (txcd_20010006), set to
// exclusive for USD. Nothing here changes dashboard settings; it only asks
// Stripe to calculate for each payment and to record the transaction after
// the money moves, so the tax report in the dashboard is complete.
//
// No new database columns: whether a booking is taxable is derived from
// dates, and the tax amount lives on the PaymentIntent's metadata, where the
// accounting helper reads it back to keep "collected" net of tax.
//
// Every function fails soft (tax 0, logged): a Stripe Tax outage must never
// stop a booking or a charge.

const API_VERSION = "2026-02-25.clover" as const;
export const TAX_CODE = "txcd_20010006"; // Residential Cleaning Services
export const TAX_START_AT = "2026-10-10T04:00:00Z"; // midnight ET, Oct 10 2026

export type TaxQuote = {
  taxCents: number;
  totalCents: number;
  ratePct: number | null; // e.g. 8.875
  calculationId: string | null;
  jurisdiction: string | null;
  error?: string;
};

function client(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key, { apiVersion: API_VERSION }) : null;
}

/**
 * Stripe needs a postal code for US addresses and the booking form collects a
 * free-text street line. NYC's rate is the same in all five boroughs, so any
 * Manhattan zip stands in when none was typed; a New Jersey address (the one
 * place outside NYC we clean) is sent as NJ, where the account doesn't collect.
 */
export function taxAddressFor(address: string | null | undefined, aptNo?: string | null) {
  const raw = String(address ?? "").trim();
  const zip = raw.match(/\b(\d{5})(?:-\d{4})?\b/)?.[1] ?? null;
  const nj = /\bNJ\b|New Jersey|Jersey City|Hoboken|Weehawken|Union City/i.test(raw);
  const state = nj ? "NJ" : "NY";
  const city = nj ? "Jersey City" : "New York";
  const postal_code = zip ?? (nj ? "07302" : "10001");
  const line1 = raw.replace(/,?\s*(New York|NY|NJ|Jersey City|Brooklyn|Queens|Bronx|Manhattan)\b.*$/i, "").replace(/\b\d{5}(-\d{4})?\b/, "").replace(/[,\s]+$/, "").trim() || raw;
  return { line1, line2: aptNo ? `Apt ${aptNo}` : undefined, city, state, postal_code, country: "US" as const, assumedZip: !zip };
}

/**
 * Taxable = created on/after TAX_START_AT by a customer with no earlier
 * booking. `createdAt` is the booking's own created_at (or now, for one
 * being created this moment).
 */
export async function isTaxableBooking(opts: { customerId: string | null | undefined; createdAt?: string | null }): Promise<boolean> {
  const created = opts.createdAt ?? new Date().toISOString();
  if (created < TAX_START_AT) return false;
  if (!opts.customerId) return true; // brand-new customer being created right now
  try {
    const { count } = await supabaseAdmin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", opts.customerId)
      .lt("created_at", TAX_START_AT);
    return (count ?? 0) === 0;
  } catch (e) {
    console.error("[stripe-tax] taxable check failed, treating as exempt:", (e as Error)?.message);
    return false;
  }
}

/** Ask Stripe what tax applies to `amountDollars` at this address. Tax 0 on any failure. */
export async function quoteTax(opts: { amountDollars: number; address: string | null | undefined; aptNo?: string | null; reference?: string }): Promise<TaxQuote> {
  const amountCents = Math.round(opts.amountDollars * 100);
  const none: TaxQuote = { taxCents: 0, totalCents: amountCents, ratePct: null, calculationId: null, jurisdiction: null };
  const stripe = client();
  if (!stripe || amountCents <= 0) return none;
  try {
    const addr = taxAddressFor(opts.address, opts.aptNo);
    const calc = await stripe.tax.calculations.create({
      currency: "usd",
      line_items: [{ amount: amountCents, reference: opts.reference ?? "clean", tax_code: TAX_CODE, tax_behavior: "exclusive" }],
      customer_details: {
        address: { line1: addr.line1, line2: addr.line2, city: addr.city, state: addr.state, postal_code: addr.postal_code, country: addr.country },
        address_source: "shipping",
      },
      expand: ["line_items"],
    });
    const li = calc.line_items?.data?.[0] as any;
    const breakdown: any = (calc as any).tax_breakdown?.[0] ?? li?.tax_breakdown?.[0] ?? null;
    const pct = breakdown?.tax_rate_details?.percentage_decimal;
    const rate = pct != null && pct !== "" ? Number(pct) : null;
    const juris = breakdown?.jurisdiction;
    return {
      taxCents: calc.tax_amount_exclusive,
      totalCents: calc.amount_total,
      ratePct: Number.isFinite(rate as number) ? rate : null,
      calculationId: calc.id,
      jurisdiction: juris?.display_name ?? juris?.state ?? (breakdown?.tax_rate_details?.state as string | undefined) ?? null,
    };
  } catch (e) {
    console.error("[stripe-tax] calculation failed, charging without tax:", (e as Error)?.message);
    return { ...none, error: (e as Error)?.message };
  }
}

/** After the money has moved: record it so the Stripe Tax report includes it. Never throws. */
export async function recordTaxTransaction(calculationId: string | null | undefined, reference: string): Promise<string | null> {
  const stripe = client();
  if (!stripe || !calculationId) return null;
  try {
    const t = await stripe.tax.transactions.createFromCalculation({ calculation: calculationId, reference }, { idempotencyKey: `taxtx-${reference}` });
    return t.id;
  } catch (e) {
    console.error("[stripe-tax] transaction not recorded:", reference, (e as Error)?.message);
    return null;
  }
}

/** Metadata to stamp on a PaymentIntent so accounting can net the tax out later. */
export function taxMetadata(q: TaxQuote): Record<string, string> {
  return q.taxCents > 0
    ? { tax_cents: String(q.taxCents), tax_calculation_id: q.calculationId ?? "", tax_rate_pct: q.ratePct != null ? String(q.ratePct) : "" }
    : {};
}

export function taxCentsFromMetadata(md: Stripe.Metadata | null | undefined): number {
  const n = Number(md?.tax_cents ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

export function fmtTax(q: TaxQuote): string {
  return q.taxCents > 0 ? `$${(q.taxCents / 100).toFixed(2)}${q.ratePct != null ? ` (${q.jurisdiction ?? "NY"} sales tax ${q.ratePct}%)` : " sales tax"}` : "";
}
