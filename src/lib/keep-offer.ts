import { supabaseAdmin } from "@/lib/supabase";
import { recurringStandardPrice } from "@/lib/pricing";

// "Keep my cleaner" (owner decision 2026-10-18): the one-tap path from a first
// clean to a recurring plan. The offer is computed from the customer's last
// completed clean; accepting it creates the next booking two weeks out at the
// bi-weekly rate, unassigned, with the cleaner's name in the notes so dispatch
// sends the same person. The owner gets the normal new-booking style alert.

export const KEEP_FREQUENCY = "Bi-Weekly";
export const KEEP_INTERVAL_DAYS = 14;

export type KeepOffer = {
  customerId: string;
  firstName: string;
  phone: string | null;
  lastBookingId: string;
  lastDate: string;
  cleanerId: string | null;
  cleanerName: string | null;
  bedrooms: number;
  bathrooms: number;
  summary: string | null;
  window: string[];
  price: number;
  nextDate: string;
  frequency: string;
};

const iso = (d: Date) => d.toISOString().slice(0, 10);
function nyToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}
function addDays(d: string, n: number) {
  return iso(new Date(new Date(`${d}T12:00:00Z`).getTime() + n * 86400000));
}

/** Next visit date: last clean + 14 days, pushed forward a week at a time until it's at least tomorrow. */
export function nextKeepDate(lastDate: string, today: string = nyToday()): string {
  let d = addDays(lastDate, KEEP_INTERVAL_DAYS);
  const tomorrow = addDays(today, 1);
  while (d < tomorrow) d = addDays(d, 7);
  return d;
}

/**
 * The offer for a customer, or null when it doesn't apply: no completed
 * clean yet, already on a plan, or already has a future visit booked.
 */
export async function keepOfferFor(customerId: string): Promise<KeepOffer | null> {
  const { data: customer } = await supabaseAdmin
    .from("customers")
    .select("id, first_name, phone")
    .eq("id", customerId)
    .maybeSingle();
  if (!customer) return null;

  const { data: rows } = await supabaseAdmin
    .from("bookings")
    .select("id, service_date, status, frequency, bedrooms, bathrooms, service_summary, preferred_time_ranges, assigned_cleaner_id, cleaners!bookings_assigned_cleaner_id_fkey(first_name)")
    .eq("customer_id", customerId)
    .neq("status", "cancelled")
    .order("service_date", { ascending: true });
  const bookings = (rows ?? []) as any[];
  const today = nyToday();
  if (bookings.some((b) => b.service_date >= today && b.status !== "completed")) return null;
  const completed = bookings.filter((b) => b.status === "completed");
  if (!completed.length) return null;
  const last = completed[completed.length - 1];
  const freq = String(last.frequency ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (freq && freq !== "onetime") return null;

  const bedrooms = Number(last.bedrooms ?? 1) || 1;
  const bathrooms = Number(last.bathrooms ?? 1) || 1;
  return {
    customerId,
    firstName: customer.first_name || "there",
    phone: customer.phone ?? null,
    lastBookingId: last.id,
    lastDate: last.service_date,
    cleanerId: last.assigned_cleaner_id ?? null,
    cleanerName: last.cleaners?.first_name ?? null,
    bedrooms,
    bathrooms,
    summary: last.service_summary ?? `${bedrooms} BR / ${bathrooms} BA`,
    window: Array.isArray(last.preferred_time_ranges) ? last.preferred_time_ranges : [],
    price: recurringStandardPrice(bedrooms, bathrooms, KEEP_FREQUENCY),
    nextDate: nextKeepDate(last.service_date, today),
    frequency: KEEP_FREQUENCY,
  };
}

/** Creates the next booking from an offer. Returns the new booking id. */
export async function acceptKeepOffer(offer: KeepOffer, source: string): Promise<{ bookingId: string }> {
  const { data: last } = await supabaseAdmin
    .from("bookings")
    .select("stripe_customer_id, stripe_payment_method_id, cleaning_notes")
    .eq("id", offer.lastBookingId)
    .maybeSingle();
  const priorNotes = String((last as any)?.cleaning_notes ?? "").replace(/^\[Arrival window:[^\]]*\]\s*/, "").trim();
  const keepLine = `[Keep my cleaner] Customer asked to keep ${offer.cleanerName ?? "the same cleaner"} every other week (${source}).`;
  const { data: created, error } = await supabaseAdmin
    .from("bookings")
    .insert({
      customer_id: offer.customerId,
      status: "pending",
      frequency: offer.frequency,
      bedrooms: offer.bedrooms,
      bathrooms: offer.bathrooms,
      service_summary: offer.summary,
      service_date: offer.nextDate,
      preferred_time_ranges: offer.window,
      selected_extras: [],
      cleaning_notes: [keepLine, priorNotes].filter(Boolean).join(" "),
      pricing_total: offer.price,
      pricing_subtotal: offer.price,
      pricing_next_clean_total: offer.price,
      stripe_customer_id: (last as any)?.stripe_customer_id ?? null,
      stripe_payment_method_id: (last as any)?.stripe_payment_method_id ?? null,
    })
    .select("id")
    .single();
  if (error || !created) throw new Error(`keep offer: could not create booking: ${error?.message ?? "unknown"}`);
  return { bookingId: created.id as string };
}
