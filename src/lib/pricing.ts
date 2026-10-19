// Server-side copy of the quote page's flat-rate table (app/quote/page.tsx
// keeps its own for the live calculator). Used where the server has to price
// a clean without the form: the "keep my cleaner" recurring offer.

export function basePriceForBedrooms(bedrooms: number) {
  if (bedrooms <= 1) return 175;
  if (bedrooms === 2) return 225;
  if (bedrooms === 3) return 275;
  return 325 + (bedrooms - 4) * 40;
}

export const EXTRA_BATHROOM = 25;

export function discountRateForFrequency(frequency: string) {
  const f = frequency.toLowerCase().replace(/[^a-z]/g, "");
  if (f === "weekly") return 0.2;
  if (f === "biweekly") return 0.15;
  if (f === "monthly") return 0.1;
  return 0;
}

/** Standard clean on a recurring plan: base + extra bathrooms, less the plan discount. */
export function recurringStandardPrice(bedrooms: number, bathrooms: number, frequency: string) {
  const subtotal = basePriceForBedrooms(bedrooms) + Math.max(0, bathrooms - 1) * EXTRA_BATHROOM;
  return Math.round(subtotal * (1 - discountRateForFrequency(frequency)));
}
