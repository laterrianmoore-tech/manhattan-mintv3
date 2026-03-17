"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, Truck, Boxes, PanelsTopLeft, Refrigerator, FolderKanban, Shirt, ShieldCheck } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const frequencies = ["One-Time", "Weekly", "Every Other Week", "Every 4 Weeks"] as const;

const extrasCatalog = [
  { key: "deepCleaning", label: "Deep Cleaning", price: 75, Icon: Sparkles },
  { key: "moveInOut", label: "Move In/Out", price: 100, Icon: Truck },
  { key: "insideCabinets", label: "Inside Cabinets", price: 55, Icon: Boxes },
  { key: "interiorWindows", label: "Interior Windows", price: 85, Icon: PanelsTopLeft },
  { key: "insideFridge", label: "Inside Fridge", price: 45, Icon: Refrigerator },
  { key: "organization", label: "Organization", price: 70, Icon: FolderKanban },
  { key: "laundry", label: "Laundry", price: 40, Icon: Shirt },
] as const;

type Frequency = typeof frequencies[number];
type ExtraKey = (typeof extrasCatalog)[number]["key"];

type BookingFormState = {
  frequency: Frequency;
  bedrooms: number;
  bathrooms: number;
  extras: Record<ExtraKey, boolean>;
  serviceDate: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  smsReminder: boolean;
  address: string;
  aptNo: string;
  keyAccess: boolean;
  accessNotes: string;
  cleaningNotes: string;
  couponCode: string;
  termsAccepted: boolean;
};

const defaultExtras = extrasCatalog.reduce((acc, item) => {
  acc[item.key] = false;
  return acc;
}, {} as Record<ExtraKey, boolean>);

function basePriceForBedrooms(bedrooms: number) {
  if (bedrooms <= 1) return 175;
  if (bedrooms === 2) return 225;
  if (bedrooms === 3) return 275;
  return 325 + (bedrooms - 4) * 40;
}

function discountRateForFrequency(frequency: Frequency) {
  if (frequency === "Weekly") return 0.15;
  if (frequency === "Every Other Week") return 0.1;
  if (frequency === "Every 4 Weeks") return 0.05;
  return 0;
}

function couponDiscount(couponCode: string, subtotalAfterFrequency: number) {
  const normalized = couponCode.trim().toUpperCase();
  if (normalized === "MINT20") return Math.round(subtotalAfterFrequency * 0.2);
  if (normalized === "WELCOME15") return 15;
  return 0;
}

function parseBedroomsFromStoredSize(storedSize: string) {
  const normalized = storedSize.toLowerCase();
  if (!normalized) return null;
  if (normalized.includes("studio") || normalized.includes("1br") || normalized.includes("1 bedroom")) return 1;
  if (normalized.includes("2 bedroom") || normalized.includes("2br")) return 2;
  if (normalized.includes("3 bedroom") || normalized.includes("3br")) return 3;
  if (normalized.includes("4+")) return 4;
  return null;
}

function parseHourlySelection(storedService: string) {
  const match = storedService.match(/Hourly clean \((\d+)h, (\d+) cleaner/);
  if (!match) return null;
  return {
    hours: Number(match[1]),
    cleaners: Number(match[2]),
  };
}

function getMinServiceDate() {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  return date.toISOString().slice(0, 10);
}

function isDateAtLeastMin(serviceDate: string, minDate: string) {
  return Boolean(serviceDate) && serviceDate >= minDate;
}

function PaymentCardField() {
  return (
    <div style={{ border: "1px solid rgba(15,15,15,0.15)", borderRadius: 8, padding: "0.9rem", background: "#fff" }}>
      <CardElement
        options={{
          style: {
            base: {
              fontSize: "16px",
              color: "#0F0F0F",
              fontFamily: "DM Sans, sans-serif",
              "::placeholder": { color: "#888" },
            },
          },
        }}
      />
    </div>
  );
}

type QuoteFormProps = {
  stripeReady: boolean;
  stripe: ReturnType<typeof useStripe>;
  elements: ReturnType<typeof useElements>;
};

function QuoteForm({ stripeReady, stripe, elements }: QuoteFormProps) {

  const [form, setForm] = useState<BookingFormState>({
    frequency: "One-Time",
    bedrooms: 1,
    bathrooms: 1,
    extras: defaultExtras,
    serviceDate: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    smsReminder: true,
    address: "",
    aptNo: "",
    keyAccess: false,
    accessNotes: "",
    cleaningNotes: "",
    couponCode: "",
    termsAccepted: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sourceSelection, setSourceSelection] = useState("");
  const [hourlySelection, setHourlySelection] = useState<{ hours: number; cleaners: number } | null>(null);
  const minServiceDate = useMemo(() => getMinServiceDate(), []);

  useEffect(() => {
    const fullName = localStorage.getItem("mm_name") || "";
    const [firstName, ...rest] = fullName.trim().split(" ");
    const lastName = rest.join(" ");
    const email = localStorage.getItem("mm_email") || "";
    const phone = localStorage.getItem("mm_phone") || "";
    const address = localStorage.getItem("mm_address") || "";
    const storedSize = localStorage.getItem("mm_size") || "";
    const storedService = localStorage.getItem("mm_service") || "";
    const parsedBedrooms = parseBedroomsFromStoredSize(storedSize);
    const parsedHourly = parseHourlySelection(storedService);

    setSourceSelection(parsedHourly ? storedService : storedSize);
    setHourlySelection(parsedHourly);

    setForm((prev) => ({
      ...prev,
      firstName: prev.firstName || firstName || "",
      lastName: prev.lastName || lastName || "",
      email: prev.email || email,
      phone: prev.phone || phone,
      address: prev.address || address,
      bedrooms: parsedBedrooms ?? prev.bedrooms,
      extras: {
        ...prev.extras,
        deepCleaning: storedService.includes("Deep clean"),
        moveInOut: storedService.includes("Move-in") || storedService.includes("Move In/Out"),
      },
      cleaningNotes: prev.cleaningNotes || (storedService || storedSize ? `Home page selection: ${storedService || storedSize}` : ""),
    }));
  }, []);

  const pricing = useMemo(() => {
    const base = hourlySelection
      ? hourlySelection.hours * hourlySelection.cleaners * 65
      : basePriceForBedrooms(form.bedrooms);
    const bathsAdd = hourlySelection ? 0 : Math.max(0, form.bathrooms - 1) * 25;
    const extrasTotal = extrasCatalog.reduce((sum, item) => sum + (form.extras[item.key] ? item.price : 0), 0);
    const subtotal = Math.max(0, base + bathsAdd + extrasTotal);
    const frequencyDiscount = Math.round(subtotal * discountRateForFrequency(form.frequency));
    const coupon = couponDiscount(form.couponCode, subtotal);
    const total = Math.max(0, subtotal - coupon);
    const nextCleanTotal = Math.max(0, subtotal - frequencyDiscount);

    return {
      base,
      bathsAdd,
      extrasTotal,
      subtotal,
      frequencyDiscount,
      coupon,
      total,
      nextCleanTotal,
    };
  }, [form, hourlySelection]);

  const selectedExtras = extrasCatalog.filter((item) => form.extras[item.key]);

  const setField = <K extends keyof BookingFormState>(key: K, value: BookingFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.termsAccepted) {
      setError("Please accept the terms before saving your booking.");
      return;
    }

    if (!form.serviceDate || !form.firstName || !form.lastName || !form.email || !form.phone || !form.address) {
      setError("Please complete all required fields in Section 2.");
      return;
    }

    if (!isDateAtLeastMin(form.serviceDate, minServiceDate)) {
      setError("Please choose a booking date at least 2 days from today.");
      return;
    }

    setSubmitting(true);
    try {
      let stripePaymentMethodId: string | undefined;

      if (stripeReady) {
        if (!stripe || !elements) {
          throw new Error("Stripe is not ready. Verify NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.");
        }

        const intentRes = await fetch("/api/bookings/create-setup-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, fullName: `${form.firstName} ${form.lastName}` }),
        });

        if (!intentRes.ok) {
          throw new Error("Unable to initialize card setup.");
        }

        const intentData = await intentRes.json();
        const card = elements.getElement(CardElement);
        if (!card) throw new Error("Card input is missing.");

        const result = await stripe.confirmCardSetup(intentData.clientSecret, {
          payment_method: {
            card,
            billing_details: {
              name: `${form.firstName} ${form.lastName}`,
              email: form.email,
              phone: form.phone,
              address: {
                line1: form.address,
                line2: form.aptNo || undefined,
              },
            },
          },
        });

        if (result.error) {
          throw new Error(result.error.message || "Card setup failed.");
        }

        stripePaymentMethodId = result.setupIntent?.payment_method as string | undefined;
      } else {
        stripePaymentMethodId = "pending-stripe-setup";
      }

      const submitRes = await fetch("/api/bookings/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          selectedExtras: selectedExtras.map((x) => ({ label: x.label, price: x.price })),
          pricing,
          serviceSummary: hourlySelection
            ? `Hourly clean (${hourlySelection.hours}h, ${hourlySelection.cleaners} cleaner${hourlySelection.cleaners === 1 ? "" : "s"})`
            : `${form.bedrooms} BR / ${form.bathrooms} BA`,
          stripePaymentMethodId,
          cardChargeTiming: "AFTER appointment",
        }),
      });

      const submitData = await submitRes.json();
      if (!submitRes.ok) {
        throw new Error(submitData.error || "Booking submission failed.");
      }

      localStorage.setItem("mm_name", `${form.firstName} ${form.lastName}`.trim());
      localStorage.setItem("mm_email", form.email);
      localStorage.setItem("mm_phone", form.phone);
      localStorage.setItem("mm_address", `${form.address}${form.aptNo ? `, Apt ${form.aptNo}` : ""}`);
      localStorage.setItem("mm_size", hourlySelection ? "Hourly booking" : `${form.bedrooms} BR / ${form.bathrooms} BA`);
      localStorage.setItem("mm_service", hourlySelection ? `Hourly clean (${hourlySelection.hours}h, ${hourlySelection.cleaners} cleaner${hourlySelection.cleaners === 1 ? "" : "s"})` : `${form.frequency} cleaning`);

      window.location.href = "/thank-you.html";
    } catch (err: any) {
      setError(err?.message || "Something went wrong while saving your booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ background: "var(--soft)", minHeight: "100vh", fontFamily: "DM Sans, sans-serif" }}>
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "2.25rem 1rem 4rem" }}>
        <p style={{ color: "var(--mint)", letterSpacing: "0.12em", textTransform: "uppercase", fontSize: "0.72rem", marginBottom: "0.65rem" }}>
          Step 2 of 3
        </p>
        <h1 style={{ color: "var(--dark)", fontFamily: "DM Serif Display, serif", fontWeight: 400, fontSize: "clamp(2rem,4vw,3rem)", margin: "0 0 0.55rem" }}>
          Complete your booking.
        </h1>
        <p style={{ color: "var(--gray)", marginBottom: "1.5rem", fontWeight: 300 }}>
          Custom booking form with service details, customer info, and payment authorization.
        </p>

        <div style={{ display: "grid", gap: "1rem", alignItems: "start", gridTemplateColumns: "minmax(0,1fr)" }} className="lg:grid-cols-[1.2fr,0.8fr]">
          <form onSubmit={handleSubmit} style={{ background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 14, padding: "1rem" }}>
            <div style={{ borderBottom: "1px solid rgba(0,0,0,.08)", paddingBottom: "1rem", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.15rem", marginBottom: ".85rem" }}>Section 1 - Service Details</h2>

              <div style={{ display: "grid", gap: ".6rem", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }} className="md:grid-cols-4">
                {frequencies.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setField("frequency", f)}
                    style={{
                      borderRadius: 8,
                      padding: ".55rem .7rem",
                      border: "1px solid rgba(0,0,0,.15)",
                      background: form.frequency === f ? "var(--mint)" : "#fff",
                      color: form.frequency === f ? "#fff" : "#0F0F0F",
                      fontSize: ".84rem",
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <p style={{ marginTop: ".75rem", fontSize: ".78rem", color: "#666" }}>
                Recurring frequency pricing starts on your next clean after the first visit.
              </p>

              {sourceSelection ? (
                <div style={{ marginTop: ".9rem", border: "1px solid rgba(29,158,117,.18)", background: "var(--mint-light)", color: "var(--mint-dark)", borderRadius: 10, padding: ".75rem .9rem", fontSize: ".84rem" }}>
                  Carrying over from home page: {sourceSelection}
                  {hourlySelection ? <div style={{ marginTop: ".35rem" }}>Hourly selection from the home page is setting the current quoted price here.</div> : null}
                </div>
              ) : null}

              {hourlySelection ? (
                <div style={{ marginTop: "1rem", border: "1px solid rgba(0,0,0,.08)", borderRadius: 10, padding: ".8rem .9rem", background: "#fafafa", fontSize: ".85rem", color: "#444" }}>
                  Hourly booking selected: {hourlySelection.hours} hours with {hourlySelection.cleaners} cleaner{hourlySelection.cleaners === 1 ? "" : "s"}.
                </div>
              ) : (
                <div style={{ marginTop: "1rem", display: "grid", gap: ".75rem", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }} className="md:grid-cols-2">
                  <label style={{ display: "grid", gap: ".3rem" }}>
                    <span style={{ fontSize: ".75rem", color: "#666" }}>Bedrooms</span>
                    <select value={form.bedrooms} onChange={(e) => setField("bedrooms", Number(e.target.value))} style={{ border: "1px solid rgba(0,0,0,.15)", borderRadius: 8, padding: ".6rem" }}>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5+</option>
                    </select>
                  </label>
                  <label style={{ display: "grid", gap: ".3rem" }}>
                    <span style={{ fontSize: ".75rem", color: "#666" }}>Bathrooms</span>
                    <select value={form.bathrooms} onChange={(e) => setField("bathrooms", Number(e.target.value))} style={{ border: "1px solid rgba(0,0,0,.15)", borderRadius: 8, padding: ".6rem" }}>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4+</option>
                    </select>
                  </label>
                </div>
              )}

              <div style={{ marginTop: "1rem" }}>
                <p style={{ fontSize: ".8rem", color: "#666", marginBottom: ".5rem" }}>Extras</p>
                <div style={{ display: "grid", gap: ".6rem", gridTemplateColumns: "repeat(2,minmax(0,1fr))" }} className="md:grid-cols-3">
                  {extrasCatalog.map((extra) => (
                    <button
                      key={extra.key}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, extras: { ...prev.extras, [extra.key]: !prev.extras[extra.key] } }))}
                      style={{
                        border: "1px solid rgba(0,0,0,.15)",
                        borderRadius: 10,
                        padding: ".6rem",
                        display: "flex",
                        alignItems: "center",
                        gap: ".55rem",
                        background: form.extras[extra.key] ? "var(--mint-light)" : "#fff",
                        fontSize: ".79rem",
                        textAlign: "left",
                      }}
                    >
                      <extra.Icon size={16} color="#1D9E75" />
                      <span style={{ lineHeight: 1.2 }}>{extra.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ borderBottom: "1px solid rgba(0,0,0,.08)", paddingBottom: "1rem", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.15rem", marginBottom: ".85rem" }}>Section 2 - Date &amp; Customer Info</h2>

              <label style={{ display: "grid", gap: ".3rem", marginBottom: ".75rem" }}>
                <span style={{ fontSize: ".75rem", color: "#666" }}>Date</span>
                <input type="date" min={minServiceDate} required value={form.serviceDate} onChange={(e) => setField("serviceDate", e.target.value)} style={{ border: "1px solid rgba(0,0,0,.15)", borderRadius: 8, padding: ".6rem" }} />
              </label>
              <p style={{ marginTop: "-.35rem", marginBottom: ".75rem", fontSize: ".76rem", color: "#666" }}>
                Earliest booking date is 2 days from today.
              </p>

              <div style={{ display: "grid", gap: ".75rem", gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>
                <label style={{ display: "grid", gap: ".3rem" }}>
                  <span style={{ fontSize: ".75rem", color: "#666" }}>First Name</span>
                  <input required value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} style={{ border: "1px solid rgba(0,0,0,.15)", borderRadius: 8, padding: ".6rem" }} />
                </label>
                <label style={{ display: "grid", gap: ".3rem" }}>
                  <span style={{ fontSize: ".75rem", color: "#666" }}>Last Name</span>
                  <input required value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} style={{ border: "1px solid rgba(0,0,0,.15)", borderRadius: 8, padding: ".6rem" }} />
                </label>
              </div>

              <div style={{ marginTop: ".75rem", display: "grid", gap: ".75rem", gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>
                <label style={{ display: "grid", gap: ".3rem" }}>
                  <span style={{ fontSize: ".75rem", color: "#666" }}>Email</span>
                  <input required type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} style={{ border: "1px solid rgba(0,0,0,.15)", borderRadius: 8, padding: ".6rem" }} />
                </label>
                <label style={{ display: "grid", gap: ".3rem" }}>
                  <span style={{ fontSize: ".75rem", color: "#666" }}>Phone</span>
                  <input required type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} style={{ border: "1px solid rgba(0,0,0,.15)", borderRadius: 8, padding: ".6rem" }} />
                </label>
              </div>

              <label style={{ marginTop: ".85rem", display: "flex", alignItems: "center", gap: ".5rem", fontSize: ".88rem" }}>
                <input type="checkbox" checked={form.smsReminder} onChange={(e) => setField("smsReminder", e.target.checked)} />
                SMS reminder
              </label>

              <div style={{ marginTop: ".75rem", display: "grid", gap: ".75rem", gridTemplateColumns: "2fr 1fr" }}>
                <label style={{ display: "grid", gap: ".3rem" }}>
                  <span style={{ fontSize: ".75rem", color: "#666" }}>Address</span>
                  <input required value={form.address} onChange={(e) => setField("address", e.target.value)} style={{ border: "1px solid rgba(0,0,0,.15)", borderRadius: 8, padding: ".6rem" }} />
                </label>
                <label style={{ display: "grid", gap: ".3rem" }}>
                  <span style={{ fontSize: ".75rem", color: "#666" }}>Apt No</span>
                  <input value={form.aptNo} onChange={(e) => setField("aptNo", e.target.value)} style={{ border: "1px solid rgba(0,0,0,.15)", borderRadius: 8, padding: ".6rem" }} />
                </label>
              </div>

              <label style={{ marginTop: ".85rem", display: "flex", alignItems: "center", gap: ".5rem", fontSize: ".88rem" }}>
                <input type="checkbox" checked={form.keyAccess} onChange={(e) => setField("keyAccess", e.target.checked)} />
                Key access
              </label>

              <div style={{ marginTop: ".75rem", display: "grid", gap: ".75rem" }}>
                <label style={{ display: "grid", gap: ".3rem" }}>
                  <span style={{ fontSize: ".75rem", color: "#666" }}>Access Notes</span>
                  <textarea placeholder="Passcode, key location, or other access details if needed" value={form.accessNotes} onChange={(e) => setField("accessNotes", e.target.value)} rows={3} style={{ border: "1px solid rgba(0,0,0,.15)", borderRadius: 8, padding: ".6rem" }} />
                </label>
                <label style={{ display: "grid", gap: ".3rem" }}>
                  <span style={{ fontSize: ".75rem", color: "#666" }}>Cleaning Notes</span>
                  <textarea placeholder="Any additional details or requests for the cleaning" value={form.cleaningNotes} onChange={(e) => setField("cleaningNotes", e.target.value)} rows={3} style={{ border: "1px solid rgba(0,0,0,.15)", borderRadius: 8, padding: ".6rem" }} />
                </label>
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: "1.15rem", marginBottom: ".85rem" }}>Section 3 - Payment</h2>

              <label style={{ display: "grid", gap: ".3rem", marginBottom: ".75rem" }}>
                <span style={{ fontSize: ".75rem", color: "#666" }}>Coupon Code</span>
                <input value={form.couponCode} onChange={(e) => setField("couponCode", e.target.value)} placeholder="MINT20" style={{ border: "1px solid rgba(0,0,0,.15)", borderRadius: 8, padding: ".6rem" }} />
              </label>

              <p style={{ marginBottom: ".75rem", fontSize: ".84rem", color: "#444" }}>
                Card authorization only. Your card is charged after the appointment.
              </p>

              <div style={{ display: "flex", gap: ".45rem", marginBottom: ".75rem", flexWrap: "wrap" }}>
                {[
                  "VISA",
                  "MASTERCARD",
                  "AMEX",
                  "DISCOVER",
                ].map((logo) => (
                  <span key={logo} style={{ fontSize: ".68rem", border: "1px solid rgba(0,0,0,.2)", borderRadius: 999, padding: ".25rem .55rem", background: "#fff" }}>
                    {logo}
                  </span>
                ))}
              </div>

              {stripeReady && <PaymentCardField />}

              {!stripeReady && (
                <div style={{ border: "1px solid rgba(0,0,0,.15)", borderRadius: 8, padding: ".9rem", background: "#fafafa", color: "#555", fontSize: ".86rem" }}>
                  Stripe is not connected yet. You can still save the booking now, and add live card authorization after you connect Stripe.
                </div>
              )}

              <p style={{ marginTop: ".75rem", fontSize: ".82rem", color: "#555", display: "flex", alignItems: "center", gap: ".4rem" }}>
                <ShieldCheck size={15} color="#1D9E75" /> Card charged AFTER appointment.
              </p>

              <label style={{ marginTop: ".85rem", display: "flex", alignItems: "center", gap: ".5rem", fontSize: ".88rem" }}>
                <input type="checkbox" checked={form.termsAccepted} onChange={(e) => setField("termsAccepted", e.target.checked)} />
                <span>
                  I agree to the <Link href="/terms" style={{ color: "var(--mint-dark)", textDecoration: "underline" }}>terms of service</Link>.
                </span>
              </label>

              {error ? <p style={{ color: "#b42318", marginTop: ".6rem", fontSize: ".86rem" }}>{error}</p> : null}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  marginTop: "1rem",
                  width: "100%",
                  border: "none",
                  borderRadius: 10,
                  background: "var(--mint)",
                  color: "#fff",
                  padding: ".8rem 1rem",
                  fontSize: ".92rem",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? "Saving..." : "Save Booking"}
              </button>
            </div>
          </form>

          <aside style={{ background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 14, padding: "1rem", position: "sticky", top: 16 }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: ".8rem" }}>Live Booking Summary</h3>
            <div style={{ display: "grid", gap: ".55rem", fontSize: ".88rem", color: "#333" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Frequency</span><strong>{form.frequency}</strong></div>
              {sourceSelection ? <div style={{ display: "flex", justifyContent: "space-between", gap: ".75rem" }}><span>From Home Page</span><strong style={{ textAlign: "right" }}>{sourceSelection}</strong></div> : null}
              {!hourlySelection ? <div style={{ display: "flex", justifyContent: "space-between" }}><span>Bedrooms</span><strong>{form.bedrooms}</strong></div> : null}
              {!hourlySelection ? <div style={{ display: "flex", justifyContent: "space-between" }}><span>Bathrooms</span><strong>{form.bathrooms}</strong></div> : null}
              {hourlySelection ? <div style={{ display: "flex", justifyContent: "space-between" }}><span>Hourly</span><strong>{hourlySelection.hours}h / {hourlySelection.cleaners} cleaner{hourlySelection.cleaners === 1 ? "" : "s"}</strong></div> : null}
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Service Date</span><strong>{form.serviceDate || "-"}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Payment</span><strong>Card</strong></div>
            </div>

            <div style={{ marginTop: ".9rem", borderTop: "1px solid rgba(0,0,0,.08)", paddingTop: ".8rem" }}>
              <div style={{ display: "grid", gap: ".4rem", fontSize: ".85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>{hourlySelection ? "Hourly Base" : "Base"}</span><span>${pricing.base}</span></div>
                {!!pricing.bathsAdd && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Bathrooms</span><span>+${pricing.bathsAdd}</span></div>}
                {!!pricing.extrasTotal && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Extras</span><span>+${pricing.extrasTotal}</span></div>}
                {!!pricing.coupon && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Coupon</span><span>-${pricing.coupon}</span></div>}
              </div>

              {selectedExtras.length > 0 && (
                <div style={{ marginTop: ".75rem", fontSize: ".8rem", color: "#555" }}>
                  <p style={{ marginBottom: ".25rem" }}>Selected Extras:</p>
                  <ul style={{ paddingLeft: "1.05rem", lineHeight: 1.5 }}>
                    {selectedExtras.map((item) => <li key={item.key}>{item.label}</li>)}
                  </ul>
                </div>
              )}

              <div style={{ marginTop: ".9rem", borderTop: "1px solid rgba(0,0,0,.08)", paddingTop: ".75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600 }}>Total Price</span>
                <span style={{ fontWeight: 700, fontSize: "1.15rem", color: "var(--mint-dark)" }}>${pricing.total}</span>
              </div>

              <p style={{ marginTop: ".6rem", fontSize: ".75rem", color: "#666" }}>
                Includes all selected options. Final card charge is processed after appointment completion.
              </p>

              {form.frequency !== "One-Time" && (
                <p style={{ marginTop: ".45rem", fontSize: ".75rem", color: "#666" }}>
                  Recurring discount starts on the next clean. Next clean total: ${pricing.nextCleanTotal}.
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function StripeEnabledQuoteForm() {
  const stripe = useStripe();
  const elements = useElements();

  return <QuoteForm stripeReady={true} stripe={stripe} elements={elements} />;
}

export default function QuotePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !stripePromise) {
    return <QuoteForm stripeReady={false} stripe={null} elements={null} />;
  }

  return (
    <Elements stripe={stripePromise}>
      <StripeEnabledQuoteForm />
    </Elements>
  );
}