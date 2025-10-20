"use client";

import { useMemo, useState } from "react";
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

function calcBasePriceFlat(beds: number, baths: number) {
  let base = 165;
  if (beds <= 1) base = 165;
  else if (beds === 2) base = 205;
  else if (beds === 3) base = 255;
  else base = 255 + (beds - 3) * 40;
  base += Math.max(0, baths - 1) * 20;
  return base;
}

function calcBasePriceHourly(hours: number, cleaners: number) {
  const RATE_PER_CLEANER = 65;
  return hours * cleaners * RATE_PER_CLEANER;
}

function discountFor(freq: Freq) {
  if (freq === "weekly") return 0.30;
  if (freq === "biweekly") return 0.20;
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

  const initial = useMemo(()=>({
    name: params.get("name") || "",
    email: params.get("email") || "",
    phone: params.get("phone") || "",
    address: params.get("address") || "",
    neighborhood: params.get("neighborhood") || "",
    zip: params.get("zip") || "",
    notes: params.get("notes") || "",
    style: (params.get("style") as "flat"|"hourly") || "flat",
    beds: Number(params.get("beds") || 2),
    baths: Number(params.get("baths") || 1),
    hours: Number(params.get("hours") || 3),
    cleaners: Number(params.get("cleaners") || 2),
    date: params.get("date") || "",
    start: params.get("start") || "",
    end: params.get("end") || "",
    flexible: params.get("flexible") === "true",
  }), [params]);

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

  const base =
    initial.style === "hourly"
      ? Math.round(calcBasePriceHourly(initial.hours, initial.cleaners))
      : Math.round(calcBasePriceFlat(initial.beds, initial.baths));

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

  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const faqs = [
    { q: "Who will do the cleaning?", a: "Vetted, background-checked Manhattan Mint pros trained on our 55-point protocol." },
    { q: "Can I request the same cleaner?", a: "Yes—recurring clients are matched with the same cleaner or small team whenever possible." },
    { q: "Do I need to supply anything?", a: "No—our teams bring professional supplies. Eco-friendly options available on request." },
    { q: "What’s your cancel/reschedule policy?", a: "No fees with 24+ hours’ notice. Inside 24 hours, a small late change fee may apply." },
    { q: "Are you bonded and insured?", a: "Yes—fully bonded and insured. COIs tailored to your building are available upon request." },
    { q: "Do you clean inside appliances or windows?", a: "Yes—add these as extras on flat-rate bookings. Hourly bookings do not include extras." },
  ];

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
          <h1 className="text-2xl font-semibold mb-1">Complete your booking</h1>
          <p className="text-slate-600">We have cleaners available at this time! Just a few more details and we can complete your booking.</p>

          {/* Frequency */}
          <div className="mt-6">
            <div className="text-sm font-medium mb-2">
              How often? <span className="text-slate-500 font-normal">(Recurring discounts apply from the second cleaning onward.)</span>
            </div>
            <div className="grid sm:grid-cols-4 gap-2">
              {([
                {k:"weekly", label:"Weekly", save:"save 30%"},
                {k:"biweekly", label:"Bi-weekly", save:"save 20%"},
                {k:"monthly", label:"Monthly", save:"save 15%"},
                {k:"once", label:"Once", save:""},
              ] as {k:Freq; label:string; save:string}[]).map(opt=>(
                <button
                  key={opt.k}
                  onClick={()=>setFreq(opt.k)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    freq===opt.k ? "border-teal-600 bg-teal-50 shadow-inner" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="font-medium">{opt.label}</div>
                  {opt.save && <div className="text-xs text-teal-700">{opt.save}</div>}
                </button>
              ))}
            </div>
          </div>

          {/* Address / contact */}
          <div className="mt-6 grid md:grid-cols-2 gap-3">
            <Input placeholder="Email" value={contact.email} onChange={(e)=>setContact(c=>({...c, email:e.target.value}))}/>
            <Input placeholder="Phone" value={contact.phone} onChange={(e)=>setContact(c=>({...c, phone:e.target.value}))}/>
            <Input placeholder="First name" value={contact.first} onChange={(e)=>setContact(c=>({...c, first:e.target.value}))}/>
            <Input placeholder="Last name" value={contact.last} onChange={(e)=>setContact(c=>({...c, last:e.target.value}))}/>
            <Input placeholder="Street address" value={contact.address} onChange={(e)=>setContact(c=>({...c, address:e.target.value}))}/>
            <Input placeholder="Apt #" value={contact.apt} onChange={(e)=>setContact(c=>({...c, apt:e.target.value}))}/>
            <Input placeholder="City" value={contact.city} onChange={(e)=>setContact(c=>({...c, city:e.target.value}))}/>
            <Input placeholder="State" value={contact.state} onChange={(e)=>setContact(c=>({...c, state:e.target.value}))}/>
            <Input placeholder="ZIP" value={contact.zip} onChange={(e)=>setContact(c=>({...c, zip:e.target.value}))}/>
          </div>

          {/* Entry method */}
          <div className="mt-6">
            <div className="text-sm font-medium mb-2">How will we get in?</div>
            <select
              className="rounded-md border px-3 py-2"
              value={contact.entry}
              onChange={(e)=>setContact(c=>({...c, entry:e.target.value}))}
            >
              <option value="home">I’ll be at home</option>
              <option value="doorman">The key is with the doorman</option>
              <option value="other">Other</option>
            </select>
            {contact.entry === "other" && (
              <Textarea
                className="mt-2"
                placeholder="Access instructions (lockbox code, super, neighbor, etc.)"
                value={contact.entryNotes}
                onChange={(e)=>setContact(c=>({...c, entryNotes:e.target.value}))}
              />
            )}
          </div>

          {/* Add-ons */}
          {initial.style === "hourly" ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              Extras are only available on flat-rate bookings. Switch to <span className="font-semibold">Flat Rate</span> on the previous step to add them.
            </div>
          ) : (
            <div className="mt-6">
              <div className="text-sm font-medium mb-2">Extras</div>
              <div className="grid sm:grid-cols-3 gap-3">
                {ADDONS.map(({key,label,Icon})=>(
                  <button
                    key={key}
                    onClick={()=>toggleAddon(key)}
                    className={`rounded-2xl border px-3 py-4 text-center transition ${
                      addons[key] ? "border-teal-600 bg-teal-50 shadow-inner" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-teal-50 grid place-items-center">
                      <Icon className="h-5 w-5 text-teal-700" />
                    </div>
                    <div className="font-medium text-sm">{label}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">Prices reflected in your estimate on the right.</p>
            </div>
          )}

          {/* Special requests */}
          <div className="mt-6">
            <div className="text-sm font-medium mb-2">Special requests</div>
            <Textarea placeholder="Anything we should know? Pets, access, sensitive surfaces, etc." />
          </div>

          {/* Secure payment */}
          <div className="mt-8">
            <div className="text-sm font-medium mb-2">Secure payment</div>
            <Card className="rounded-2xl p-4 border-teal-200">
              <div className="grid md:grid-cols-2 gap-3">
                <Input placeholder="Name on card" />
                <Input placeholder="Card number" />
                <Input placeholder="MM/YY" />
                <Input placeholder="CVC" />
              </div>
              <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" defaultChecked />
                <span>I agree to the <Link href="/terms" className="text-teal-700 underline">Terms of Service</Link>.</span>
              </label>
            </Card>
          </div>

          <div className="mt-6">
            <Button
              className="rounded-2xl bg-teal-700 hover:bg-teal-800"
              onClick={()=>{
                const qs = toQS({
                  total, freq,
                  date: initial.date, start: initial.start, end: initial.end,
                  name: `${contact.first} ${contact.last}`.trim(),
                  email: contact.email, phone: contact.phone,
                });
                router.push(`/thank-you?${qs}`);
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
              <div>{initial.date ? new Date(initial.date).toLocaleDateString() : "Select date"} • {initial.start || "—"} – {initial.end || "—"}</div>
              <div className="text-sm text-slate-600">
                {initial.style === "hourly"
                  ? `${initial.hours} hr • ${initial.cleaners} cleaner${initial.cleaners!==1?"s":""} • Hourly`
                  : `${initial.beds} BR • ${initial.baths} BA • Flat rate`}
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
