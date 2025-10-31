"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Snowflake, Flame, PanelsTopLeft, Boxes, Sparkles, FolderCog, Truck } from "lucide-react";

type Freq = "once" | "weekly" | "biweekly" | "monthly";

function calcBasePriceFlat(beds: number, baths: number, cleaningType: string = "Standard Clean") {
  let base = 165;
  if (beds <= 1) base = 165;
  else if (beds === 2) base = 205;
  else if (beds === 3) base = 255;
  else base = 255 + (beds - 3) * 40;
  base += Math.max(0, baths - 1) * 20;

  // Apply multiplier based on cleaning type
  if (cleaningType === "Deep Clean") base *= 1.3;
  else if (cleaningType === "Move-In/Out") base *= 1.5;

  return Math.round(base);
}

function calcBasePriceHourly(hours: number, cleaners: number) {
  const RATE_PER_CLEANER = 65;
  return hours * cleaners * RATE_PER_CLEANER;
}

function discountFor(freq: Freq) {
  if (freq === "weekly") return 0.30;
  if (freq === "biweekly") return 0.25;
  if (freq === "monthly") return 0.15;
  return 0;
}

// Extras with icons (no images required)
const ADDONS = [
  { key: "insideFridge", label: "Inside fridge", price: 45, Icon: Snowflake },
  { key: "insideOven", label: "Inside oven", price: 45, Icon: Flame },
  { key: "interiorWindows", label: "Interior windows", price: 85, Icon: PanelsTopLeft },
  { key: "insideCabinets", label: "Inside cabinets", price: 66, Icon: Boxes },
  { key: "deepCleaning", label: "Deep cleaning", price: 50, Icon: Sparkles },
  { key: "organizing", label: "Organizing", price: 70, Icon: FolderCog },
  { key: "moveInOut", label: "Move In/Out", price: 200, Icon: Truck },
] as const;

const NYC_TAX_RATE = 0.08875;

export default function PricingAvailabilityClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [embedStatus, setEmbedStatus] = useState<"loading"|"loaded"|"error">("loading");

  // Helper function to convert 24h to 12h format
  const formatTime = (time: string) => {
    if (!time) return "—";
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Luhn checksum validation for card numbers
  const luhnCheck = (num: string) => {
    // num is digits only
    let sum = 0;
    let shouldDouble = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  const initial = useMemo(() => {
    // Try to get data from sessionStorage first
    const storedData = typeof window !== 'undefined' ? sessionStorage.getItem('pricingFormData') : null;
    if (storedData) {
      const parsed = JSON.parse(storedData);
      // Clear the stored data since we've used it
      sessionStorage.removeItem('pricingFormData');
      return parsed;
    }
    // Fallback to defaults
    return {
      name: "",
      email: "",
      phone: "",
      address: "",
      neighborhood: "",
      zip: "",
      notes: "",
      style: "flat" as "flat"|"hourly",
      beds: 2,
      baths: 1,
      hours: 3,
      cleaners: 2,
      cleaningType: "Standard Clean",
      date: "",
      start: "",
      end: "",
      flexible: false,
    };
  }, []);

  const [freq, setFreq] = useState<Freq>("once");
  const [contact, setContact] = useState({
    email: initial.email,
    phone: initial.phone,
    first: initial.name.split(" ")[0] || "",
    last: initial.name.split(" ").slice(1).join(" "),
    address: initial.address,
    apt: "",
    city: "New York City",
    state: "NY",
    zip: initial.zip,
    entry: "home",
    entryNotes: "",
  });

  const [addons, setAddons] = useState<Record<string, boolean>>({});
  // Payment fields and validation
  const [payment, setPayment] = useState({
    nameOnCard: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
    agree: true,
  });
  const [paymentErrors, setPaymentErrors] = useState<{[k:string]:string}>({});

  const base =
    initial.style === "hourly"
      ? Math.round(calcBasePriceHourly(initial.hours, initial.cleaners))
      : Math.round(calcBasePriceFlat(initial.beds, initial.baths, initial.cleaningType));

  const addonsTotal = ADDONS.reduce((sum, a) => sum + (addons[a.key] ? a.price : 0), 0);
  const preDiscount = base + addonsTotal;
  const discPct = discountFor(freq);
  const discounted = Math.round(preDiscount * (1 - discPct));
  const tax = Math.round(discounted * NYC_TAX_RATE);
  const total = discounted + tax;

  const toggleAddon = (k: string) => setAddons(a => ({...a, [k]: !a[k]}));

  const toQS = (o: Record<string, any>) =>
    new URLSearchParams(Object.entries(o).reduce((acc, [k, v]) => {
      if (v !== undefined && v !== null) acc[k] = String(v);
      return acc;
    }, {} as Record<string, string>)).toString();

  // Navigation helper
  const navigateTo = (url: string) => {
    try {
      const push = router.push as unknown as (u: string) => Promise<void> | void;
      const result = push(url);
      if (result && typeof (result as Promise<void>).then === 'function') {
        (result as Promise<void>).catch(() => { window.location.href = url; });
      }
    } catch (err) {
      window.location.href = url;
    }
  };

  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const faqs = [
    { q: "Who will do the cleaning?", a: "Vetted, background-checked Manhattan Mint pros trained on our 55-point protocol." },
    { q: "Can I request the same cleaner?", a: "Yes—recurring clients are matched with the same cleaner or small team whenever possible." },
    { q: "Do I need to supply anything?", a: "No—our teams bring professional supplies. Eco-friendly options available on request." },
    { q: "What’s your cancel/reschedule policy?", a: "No fees with 24+ hours’ notice. Inside 24 hours, a small late change fee may apply." },
    { q: "Are you bonded and insured?", a: "Yes—fully bonded and insured. COIs tailored to your building are available upon request." },
    { q: "Do you clean inside appliances or windows?", a: "Yes—add these as extras on flat-rate bookings. Hourly bookings do not include extras." },
  ];

  // Launch27 embed loader
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://manhattanmintnyc.launch27.com/jsbundle';
    script.onload = () => setEmbedStatus("loaded");
    script.onerror = () => setEmbedStatus("error");
    document.body.appendChild(script);
    return () => { script.remove(); };
  }, []);

  // Build Launch27 iframe URL with best-effort prefill
  const iframeSrc = useMemo(() => {
    const base = 'https://manhattanmintnyc.launch27.com/?w_cleaning';
    const qs = new URLSearchParams();
    if (contact.email) qs.set('email', contact.email);
    if (contact.phone) qs.set('phone', contact.phone);
    if (contact.first) qs.set('first_name', contact.first);
    if (contact.last) qs.set('last_name', contact.last);
    if (contact.address) qs.set('address', contact.address);
    if (contact.city) qs.set('city', contact.city);
    if (contact.state) qs.set('state', contact.state);
    if (contact.zip) qs.set('zip', contact.zip);
    if (initial.date) qs.set('date', initial.date);
    if (initial.start) qs.set('time', initial.start);
    const serviceName = initial.style === "hourly"
      ? `Hourly Cleaning (${initial.hours}hr, ${initial.cleaners} cleaner${initial.cleaners!==1?"s":""})`
      : `${initial.cleaningType} (${initial.beds}BR, ${initial.baths}BA)`;
    qs.set('service', serviceName);
    const q = qs.toString();
    return q ? `${base}&${q}` : base;
  }, [contact, initial.date, initial.start, initial.end, initial.style, initial.hours, initial.cleaners, initial.cleaningType, initial.beds, initial.baths]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-slate-50">
      <header className="bg-white/90 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/manhattan-mint-logo.png" alt="Manhattan Mint" width={28} height={28} className="rounded"/>
            <div className="font-semibold">Manhattan <span className="text-teal-700">Mint</span></div>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Badge className="bg-teal-100 text-teal-800 rounded-full">Cleaning</Badge>
            <span>➜</span>
            <Badge className="bg-teal-700 text-white rounded-full shadow">Pricing/Availability</Badge>
            <span>➜</span>
            <Badge className="bg-slate-100 text-slate-700 rounded-full">Done</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[1.2fr,0.8fr] gap-8">
        {/* LEFT */}
        <Card className="rounded-2xl p-6 border-teal-200 shadow-sm">
          <h1 className="text-2xl font-semibold mb-1">Almost Done!</h1>
          <p className="text-slate-600">Just add a few final details to secure your spot.</p>

          {/* Launch27 embedded booking form (primary) */}
          <div className="mt-6">
            {embedStatus === "loading" && (
              <div className="p-6 text-center text-slate-600">Loading booking form…</div>
            )}
            {embedStatus === "error" && (
              <div className="p-6 text-center text-red-700">Couldn't load the booking form. Please refresh or use the link below.</div>
            )}
            <div className={embedStatus === "loaded" ? "" : "hidden"}>
              <iframe
                id="booking-widget-iframe"
                src={iframeSrc}
                style={{ border: 'none', width: '100%', minHeight: '2739px', overflow: 'hidden' }}
                scrolling="no"
                title="Manhattan Mint Booking Form"
              />
              <div className="mt-3 text-xs text-slate-500 text-center">
                If the embedded form doesn’t load, <a className="text-teal-700 underline" href={iframeSrc} target="_blank" rel="noopener noreferrer">open it in a new tab</a>.
              </div>
            </div>
          </div>

          {/* Contact fields removed — Launch27 embedded form handles email, phone, name, address, etc. */}

          {/* Entry method removed — handled by embedded form */}

          {/* Extras removed — handled by embedded form */}

          {/* Special requests removed — handled by embedded form */}

          {/* Payment section moved above as the main embedded form */}

          {/* Removed Complete Booking button — payment occurs in the embedded form */}
          <div className="mt-6 hidden">
            <Button
              className={`rounded-2xl ${!payment.agree ? 'bg-slate-300 cursor-not-allowed' : 'bg-teal-700 hover:bg-teal-800'}`}
              onClick={async ()=>{
                // Contact Information Validation
                const contactErrors: string[] = [];
                if (!contact.email) contactErrors.push("Email address");
                // require at least 10 digits for phone
                const phoneDigits = (contact.phone || '').replace(/\D/g, '');
                if (!phoneDigits) contactErrors.push("Phone number");
                else if (phoneDigits.length < 10) contactErrors.push("Phone number (enter at least 10 digits)");
                if (!contact.first) contactErrors.push("First name");
                if (!contact.last) contactErrors.push("Last name");
                if (!contact.address) contactErrors.push("Street address");
                if (!contact.zip) contactErrors.push("ZIP code");

                if (contactErrors.length > 0) {
                  alert("Please fill in the following required fields:\n• " + contactErrors.join("\n• "));
                  return;
                }

                // Date and Time Validation
                if (!initial.date) {
                  alert("Please select a date for your cleaning");
                  return;
                }
                if (!initial.start || !initial.end) {
                  alert("Please select your preferred time window");
                  return;
                }

                // (Hidden)

                // Prepare booking data for Launch27 API
                const bookingData = {
                  contact: {
                    first: contact.first,
                    last: contact.last,
                    email: contact.email,
                    phone: contact.phone,
                    address: contact.address,
                    apt: contact.apt,
                    city: contact.city,
                    state: contact.state,
                    zip: contact.zip,
                    entry: contact.entry,
                    entryNotes: contact.entryNotes,
                  },
                  date: initial.date,
                  start: initial.start,
                  end: initial.end,
                  frequency: freq,
                  serviceName: initial.style === "hourly" 
                    ? `Hourly Cleaning (${initial.hours}hr, ${initial.cleaners} cleaner${initial.cleaners!==1?"s":""})`
                    : `${initial.cleaningType} (${initial.beds}BR, ${initial.baths}BA)`,
                  hours: initial.style === "hourly" ? initial.hours : undefined,
                  cleaners: initial.style === "hourly" ? initial.cleaners : undefined,
                  addons: initial.style === "flat" 
                    ? ADDONS.filter(a => addons[a.key]).map(a => ({ label: a.label, price: a.price }))
                    : [],
                  notes: initial.neighborhood || "",
                  total,
                  // For demo/testing: we're NOT sending actual card details to our API
                  // In production, you'd tokenize with Stripe/Launch27's payment gateway first
                  payment: {
                    nameOnCard: payment.nameOnCard,
                    // DO NOT send raw card data in production
                  }
                };

                // (Hidden)
              }}
            >
              Complete Booking
            </Button>
          </div>
        </Card>

        {/* RIGHT: summary */}
        <div className="space-y-4">
          <Card className="rounded-2xl p-6 shadow-sm border-teal-200">
            <div className="text-sm text-slate-500">Your booking</div>
            <div className="mt-2 text-slate-800">
              <div className="text-sm text-slate-600 font-medium">Requested time</div>
              <div>
                {formatTime(initial.start)} – {formatTime(initial.end)} • {initial.date ? new Date(initial.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : "Select date"}
              </div>
              <div className="text-sm text-slate-600">
                {initial.style === "hourly"
                  ? `${initial.hours} hr • ${initial.cleaners} cleaner${initial.cleaners!==1?"s":""} • Hourly`
                  : `${initial.cleaningType} • ${initial.beds} BR • ${initial.baths} BA • Flat rate`}
              </div>
            </div>
            <div className="mt-4 border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Cleaning Fee</span>
                <span>${base}</span>
              </div>
              {initial.style === "flat" && ADDONS.map(a => addons[a.key] && (
                <div key={a.key} className="flex justify-between text-sm">
                  <span>{a.label}</span>
                  <span>${a.price}</span>
                </div>
              ))}
              {discPct > 0 && (
                <div className="flex justify-between text-sm text-teal-700">
                  <span>Recurring discount</span>
                  <span>−{Math.round(discPct*100)}%</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${discounted}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>NYC Sales Tax (8.875%)</span>
                <span>${tax}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                <span>TOTAL</span>
                <span className="text-teal-700">${total}</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">* Tax rate reflects Manhattan (NYC) combined rate.</div>
          </Card>

          {/* FAQ */}
          <Card className="rounded-2xl p-6">
            <h3 className="font-semibold mb-2">Questions?</h3>
            <div className="divide-y">
              {faqs.map(({q,a})=>{
                const open = openFaq === q;
                return (
                  <div key={q} className="py-2">
                    <button
                      className="w-full flex items-center justify-between text-left"
                      onClick={()=>setOpenFaq(open ? null : q)}
                    >
                      <span className="text-sm text-slate-800">{q}</span>
                      {open ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                    </button>
                    {open && <div className="mt-2 text-sm text-slate-600">{a}</div>}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
