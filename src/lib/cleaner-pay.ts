// Cleaner pay, set automatically from the owner-approved table (2026-10-01).
//
// Why: until October every job's pay was texted by hand, and when the text
// was forgotten the number had to be reconstructed at payout time. Dispatch
// now computes the pay, stores it on the booking, and puts it in the job text
// so the cleaner knows the rate before they go. The owner can override any
// job from /admin/dispatch (PayEditor), which marks the pay "manual" so later
// re-dispatches leave it alone.
//
// Table (cleaner pay / list price):
//   Studio-1BR standard $100 / $175   1BR recurring, regular cleaner $85 / $149
//   1BR deep $125 / $250              2BR standard $115 / $225   2BR deep $150 / $300
//   3BR standard $145 / $275          3BR deep $185 / $325
//   Tidy up (2-2.5h) $75 / $125       Same-day or under 24h notice +$15
//   Neglected apartment +$50 (owner's call on site: manual override only)
//   Re-clean (guarantee) $85 each with two cleaners, $130 solo
//   Move-in/out: deep row +$20
//
// Not in the table, filled in here and flagged in `assumptions`:
//   4BR+: 3BR rate +$30 per extra bedroom (+$35 deep).
//   2BR/3BR recurring with the regular cleaner: 15% off the standard row,
//     rounded to $5 (same cut the 1BR row takes: $100 to $85).
//   Add-ons the table doesn't price (fridge, cabinets, windows, organization,
//     laundry): half the add-on's list price, rounded to $5.

export type PayInput = {
  bedrooms: number | null | undefined;
  service_summary: string | null | undefined;
  selected_extras: Array<{ label?: string; price?: number }> | null | undefined;
  frequency: string | null | undefined;
  pricing_total: number | null | undefined;
  coupon_code?: string | null;
  service_date: string; // YYYY-MM-DD
  /** When the job was dispatched (defaults to now). Drives the under-24h bump. */
  dispatchedAt?: Date;
  /** The assigned cleaner has completed a job for this customer before. */
  isRegularCleaner?: boolean;
  /** Two cleaners on the job (re-clean split). */
  twoCleaners?: boolean;
};

export type PayResult = {
  amount: number;
  /** e.g. "1BR deep": the table row used. */
  basis: string;
  /** Bumps applied on top of the row, e.g. "+$15 under 24h notice". */
  adjustments: string[];
  /** Rows the table doesn't define; the number is an extrapolation. */
  assumptions: string[];
  /** Things the owner should look at before the pay goes out. */
  warnings: string[];
  /** Pay as a share of the ticket, or null for a $0 job. */
  shareOfTicket: number | null;
};

export type JobKind = "reclean" | "tidy" | "move" | "deep" | "standard";

const round5 = (n: number) => Math.round(n / 5) * 5;

function extraLabels(extras: PayInput["selected_extras"]): string[] {
  return (Array.isArray(extras) ? extras : []).map((x) => String(x?.label ?? "")).filter(Boolean);
}

export function classifyJob(
  input: Pick<PayInput, "service_summary" | "selected_extras" | "pricing_total" | "coupon_code">,
): JobKind {
  const summary = String(input.service_summary ?? "").toLowerCase();
  const extras = extraLabels(input.selected_extras).map((l) => l.toLowerCase());
  const coupon = String(input.coupon_code ?? "").toUpperCase();
  if (summary.includes("re-clean") || summary.includes("reclean") || coupon === "RECLEAN") return "reclean";
  if (summary.includes("tidy")) return "tidy";
  if (summary.includes("move") || extras.some((l) => l.includes("move"))) return "move";
  if (summary.includes("deep") || extras.some((l) => l.includes("deep"))) return "deep";
  return "standard";
}

export function isRecurringFrequency(frequency: string | null | undefined): boolean {
  const norm = String(frequency ?? "").toLowerCase().replace(/[^a-z]/g, "");
  return norm.length > 0 && norm !== "onetime";
}

/** True when the job is less than 24 hours out at dispatch time (New York clock). */
export function isUnder24h(serviceDate: string, dispatchedAt: Date = new Date()): boolean {
  // Compare the dispatch moment with 8am NY on the service date, the earliest
  // a morning job starts. Anything dispatched after 8am the day before is short notice.
  const startNy = new Date(`${serviceDate}T08:00:00-04:00`);
  return startNy.getTime() - dispatchedAt.getTime() < 24 * 60 * 60 * 1000;
}

export function computeCleanerPay(input: PayInput): PayResult {
  const kind = classifyJob(input);
  const bedrooms = Math.max(0, Number(input.bedrooms ?? 1) || 0);
  const br = bedrooms <= 1 ? 1 : bedrooms; // studio and 1BR share a row
  const ticket = Number(input.pricing_total ?? 0) || 0;
  const adjustments: string[] = [];
  const assumptions: string[] = [];
  const warnings: string[] = [];
  let basis = "";
  let amount = 0;

  if (kind === "reclean") {
    amount = input.twoCleaners ? 85 : 130;
    basis = input.twoCleaners ? "Re-clean, two cleaners ($85 each)" : "Re-clean, solo";
    warnings.push("Guarantee re-clean: pay goes out against $0 revenue.");
  } else if (kind === "tidy") {
    amount = 75;
    basis = "Tidy up (2 to 2.5 hours)";
    if (ticket > 125) {
      warnings.push(`Tidy up priced $${ticket}; the table assumes $125 list.`);
    }
  } else {
    const standardRow: Record<number, number> = { 1: 100, 2: 115, 3: 145 };
    const deepRow: Record<number, number> = { 1: 125, 2: 150, 3: 185 };
    const isDeep = kind === "deep" || kind === "move";
    const row = isDeep ? deepRow : standardRow;
    if (br <= 3) {
      amount = row[br];
      basis = `${br}BR ${isDeep ? "deep" : "standard"}`;
    } else {
      const extraBr = br - 3;
      amount = row[3] + extraBr * (isDeep ? 35 : 30);
      basis = `${br}BR ${isDeep ? "deep" : "standard"} (3BR row + $${isDeep ? 35 : 30} per extra bedroom)`;
      assumptions.push(`${br}BR is not in the pay table; extrapolated from the 3BR row.`);
    }
    if (kind === "move") {
      amount += 20;
      adjustments.push("+$20 move-in/out");
      basis = `${br}BR move-in/out (deep row + $20)`;
    }
    // Recurring plan with the cleaner who already knows the apartment.
    if (!isDeep && isRecurringFrequency(input.frequency) && input.isRegularCleaner) {
      if (br === 1) {
        amount = 85;
        basis = "1BR recurring, regular cleaner";
      } else {
        const cut = round5(amount * 0.85);
        assumptions.push(`${br}BR recurring rate is not in the table; used 15% off the standard row ($${amount} to $${cut}).`);
        amount = cut;
        basis = `${br}BR recurring, regular cleaner (15% off standard)`;
      }
    }
    // Add-ons outside the table.
    for (const x of Array.isArray(input.selected_extras) ? input.selected_extras : []) {
      const label = String(x?.label ?? "");
      const l = label.toLowerCase();
      if (!label || l.includes("deep") || l.includes("move")) continue;
      const price = Number(x?.price ?? 0) || 0;
      if (price <= 0) continue;
      const bump = Math.max(5, round5(price / 2));
      amount += bump;
      adjustments.push(`+$${bump} ${label}`);
      assumptions.push(`${label} is not in the pay table; paid half its $${price} list price.`);
    }
  }

  if (kind !== "reclean" && isUnder24h(input.service_date, input.dispatchedAt)) {
    amount += 15;
    adjustments.push("+$15 under 24h notice");
  }

  const shareOfTicket = ticket > 0 ? amount / ticket : null;
  if (ticket > 0 && amount >= ticket) {
    warnings.push(`Pay $${amount} is at or above the $${ticket} ticket: no margin. Set a lower number before dispatch.`);
  } else if (shareOfTicket !== null && shareOfTicket > 0.65) {
    warnings.push(`Pay is ${Math.round(shareOfTicket * 100)}% of the ticket (target 46-65%).`);
  }

  return { amount, basis, adjustments, assumptions, warnings, shareOfTicket };
}

/** Short note stored on the booking: the row plus any bumps. */
export function payNote(result: PayResult): string {
  return [result.basis, ...result.adjustments].join(", ");
}
