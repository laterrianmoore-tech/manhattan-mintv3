"use client";

import React, { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Shield, Phone, Share2, Star, Sparkles, Calendar, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { LocalBusinessSchema, FAQPageSchema } from "@/components/StructuredData";

const faqs = [
  { q: "What does COI-ready mean?", a: "We can provide a Certificate of Insurance tailored to your building's requirements — just share the details and we'll handle it." },
  { q: "Do you bring supplies?", a: "Yes — professional, high-quality supplies. Eco-friendly options available upon request." },
  { q: "Can you handle keys/doorman?", a: "Yes. We can leave keys with your doorman or follow specific access instructions." },
  { q: "What if I'm not 100% happy?", a: "Tell us within 24 hours and we'll make it right with a free touch-up." },
  { q: "How do subscriptions work?", a: "Choose weekly, bi-weekly, or monthly. You can skip or pause anytime." },
  { q: "How do I reschedule?", a: "Just text or email us — no fees with 24+ hours' notice." },
];

function ManhattanMint() {
  const router = useRouter();
  const scrollToBook = (e?: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e?.preventDefault();
    const el = document.getElementById('book');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const [zip, setZip] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    neighborhood: "",
    zip: "",
    notes: "",
  });

  const checklistCols: string[][] = [
    ["Bedrooms","Living Rooms","Kitchens","Bathrooms","TV/Accessories","Shelves","Picture Frames","Tables","Chairs","Return Supplies","Above Refrigerator","Blinds","Lamps Lighting"],
    ["Turn off Lights","Vents","Fans","Window Sills","Kitchen Counters","Kitchen Cabinets","Refrigerator Sides","Table Tops","Bathroom Counters","Bathroom Shelves","Shower Caddys","Trash Cans","Shower Doors"],
    ["Stove Tops","Toilets Behind","Bathtubs/Showers","Bathroom Tiles","Microwave","Toaster","AC Units","Behind the Stove","Kitchen Sinks","Bathroom Sinks","Return Mats","Items on Shelves","Behind Wall Units"],
    ["Dishwasher","Make Beds","Vacuum Carpets","Straighten Up","Door Frames","Trashcan Liners","Edging on Couch","Swiffer","Laundry (extra)","Inside cabinets (extra)","Inside refrig. (extra)","Inside oven (extra)","Plus more!"],
  ];

  const toQS = (o: Record<string, any>) =>
    new URLSearchParams(Object.entries(o).reduce((acc, [k, v]) => {
      if (v !== undefined && v !== null) acc[k] = String(v);
      return acc;
    }, {} as Record<string, string>)).toString();

  // Navigation helper: router.push may return void in some Next versions
  const navigateTo = (url: string) => {
    try {
      const push = router.push as unknown as (u: string) => Promise<void> | void;
      const result = push(url);
      // If it returned a promise, attach a catch fallback; otherwise do nothing and assume success
      if (result && typeof (result as Promise<void>).then === 'function') {
        (result as Promise<void>).catch(() => { window.location.href = url; });
      }
    } catch (err) {
      window.location.href = url;
    }
  };

  return (
    <>
      <Head>
        <link rel="icon" href="/manhattan-mint-logo.png" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `{
  "@context":"https://schema.org",
  "@type":"LocalBusiness",
  "name":"Manhattan Mint",
  "image":"https://www.manhattanmintnyc.com/og-image.jpg",
  "url":"https://www.manhattanmintnyc.com/",
  "telephone":"+1-914-873-4430",
  "priceRange":"$$",
  "address":{
    "@type":"PostalAddress",
    "addressLocality":"New York",
    "addressRegion":"NY",
    "addressCountry":"US"
  },
  "areaServed":[{"@type":"City","name":"New York"}],
  "openingHoursSpecification":[
    {"@type":"OpeningHoursSpecification",
     "dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
     "opens":"08:00","closes":"20:00"}
  ]
}` }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqs.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": { "@type": "Answer", "text": f.a }
          }))
        }) }} />
      </Head>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        {/* Top Bar */}
        <div className="w-full bg-slate-900 text-slate-100 text-sm">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
              <Shield size={16} className="opacity-80" />
              <span>Bonded • Insured • 100% Happiness Guarantee</span>
            </div>
            <a href="tel:+1-000-000-0000" className="inline-flex items-center gap-2 hover:opacity-90">
              <Phone size={16} /> <span>(914) 873-4430</span>
            </a>
          </div>
        </div>
        {/* Nav */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/manhattan-mint-logo.png"
                alt="Manhattan Mint cleaning service logo"
                width={36}
                height={36}
                className="rounded-md"
                priority
                sizes="36px"
              />
              <div className="font-semibold tracking-tight">
                <span className="text-slate-900">Manhattan</span>{" "}
                <span className="text-teal-700">Mint</span>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm">
                {['subscriptions', 'services', 'pricing', 'areas', 'reviews', 'faq'].map((section) => (
                  <button
                    key={section}
                    onClick={() => {
                      document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="hover:text-teal-700 capitalize"
                  >
                    {section === 'faq' ? 'FAQ' : section}
                  </button>
                ))}
            </nav>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const shareText = "I'm booking Manhattan Mint for home cleaning \u2014 NYC-based, COI-ready, flat-rate. Grab $20 off your first clean: https://manhattanmintnyc.com/";
                  if (navigator.share) {
                    navigator.share({
                      title: 'Manhattan Mint Cleaning',
                      text: shareText,
                      url: 'https://manhattanmintnyc.com'
                    }).catch(console.error);
                  } else {
                    window.open(`sms:&body=${encodeURIComponent(shareText)}`, '_blank');
                  }
                }}
                className="hidden md:inline-flex items-center gap-2 rounded-2xl px-5 h-10 bg-white text-teal-700 hover:bg-teal-50 border border-teal-200"
              >
                <Share2 className="h-4 w-4" />
                Share & Save $20
              </button>
              <Button onClick={scrollToBook} className="hidden md:inline-block rounded-2xl px-5 bg-teal-700 hover:bg-teal-800">Book Now</Button>
            </div>
          </div>
        </header>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-100 via-white to-teal-50" />
          <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-start">
            <div>
              <Badge className="bg-teal-100 text-teal-800 rounded-full mb-4">The Gold Standard in Clean</Badge>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight text-slate-900">
                Premium home cleaning for busy New Yorkers
              </h1>
              <p className="mt-2 text-xl font-medium text-teal-700">Flawless Clean. Every Time.</p>
              <p className="mt-4 text-lg text-slate-700 md:max-w-xl">
                Book in 60 seconds. Flat-rate pricing. Meticulous pros. We bring that fresh-mint feeling to every room so you can get back to living.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button onClick={scrollToBook} size="lg" className="rounded-2xl px-6 bg-teal-700 hover:bg-teal-800">Schedule a Cleaning</Button>
                <a href="#subscriptions"><Button size="lg" variant="outline" className="rounded-2xl px-6 border-teal-200 text-teal-800">See Subscriptions</Button></a>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm text-slate-600">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>5-star rated • No hidden fees • Eco-friendly options</span>
              </div>
            </div>
            {/* CONTACT SNIPPET */}
            <div className="bg-white/80 backdrop-blur rounded-2xl border p-5 md:p-6 shadow-sm">
              <h3 className="text-xl font-semibold">Get a fast quote</h3>
              <p className="text-slate-600 text-sm mt-1">Tell us a few details and we'll confirm your booking ASAP.</p>
              <form
                className="mt-4 grid grid-cols-1 gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  // Validate phone has at least 10 digits
                  const digits = (form.phone || '').replace(/\D/g, '');
                  if (digits.length < 10) {
                    alert('Please enter a valid phone number (at least 10 digits).');
                    return;
                  }
                  const qs = toQS({
                    ...form,
                    zip: form.zip || zip,
                    source: "home-quote",
                  });
                  // For static export, we'll use the base path
                  navigateTo(`/quote`);
                  // Store form data in sessionStorage for quote page
                  sessionStorage.setItem('quoteFormData', JSON.stringify({
                    ...form,
                    zip: form.zip || zip,
                    source: "home-quote",
                  }));
                }}
              >
                <Input placeholder="Full name" required value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setForm(f=>({...f, name:e.target.value}))}/>
                <Input type="email" placeholder="Email" required value={form.email} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setForm(f=>({...f, email:e.target.value}))}/>
                <Input type="tel" placeholder="Phone" required value={form.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>{
                  const sanitized = e.target.value.replace(/[^0-9()+\-\.\s]/g,'');
                  setForm(f=>({...f, phone: sanitized}));
                }}/>
                <Input placeholder="Address (Building & Unit)" required value={form.address} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setForm(f=>({...f, address:e.target.value}))}/>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Neighborhood" value={form.neighborhood} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setForm(f=>({...f, neighborhood:e.target.value}))}/>
                  <Input placeholder="ZIP" value={form.zip} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>{setZip(e.target.value); setForm(f=>({...f, zip:e.target.value}))}}/>
                </div>
                <Textarea placeholder="Notes (pets, preferences, preferred dates)" rows={3} value={form.notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>)=>setForm(f=>({...f, notes:e.target.value}))}/>
                <Button type="submit" className="rounded-2xl bg-teal-700 hover:bg-teal-800">Request Quote</Button>
                <div className="text-xs text-slate-500">COI-ready • Doorman/key handling • Digital receipts</div>
                <div className="text-xs text-teal-700 font-medium mt-1">27 cleans booked in the last 24 hours</div>
              </form>
            </div>
          </div>
        </section>
        {/* ...rest of homepage sections... */}
      </div>
      {/* 3 EASY STEPS */}
      <section className="bg-slate-50 border-t" id="steps">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center">Book your NYC maid service in 3 easy steps</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-8 text-center">
            <div>
              <Sparkles className="mx-auto h-10 w-10 text-teal-700" />
              <h3 className="mt-3 font-semibold">Choose Your Cleaning Service</h3>
              <p className="text-slate-600 mt-1 text-sm">Tell us what you need and get transparent pricing.</p>
            </div>
            <div>
              <Calendar className="mx-auto h-10 w-10 text-teal-700" />
              <h3 className="mt-3 font-semibold">Schedule Your Cleaning Time</h3>
              <p className="text-slate-600 mt-1 text-sm">Pick a time that works. Reschedule anytime.</p>
            </div>
            <div>
              <Home className="mx-auto h-10 w-10 text-teal-700" />
              <h3 className="mt-3 font-semibold">Enjoy a Clean, Tidy Home</h3>
              <p className="text-slate-600 mt-1 text-sm">Relax—our pros handle the rest from top to bottom.</p>
            </div>
          </div>
          <div className="text-center mt-8">
            <Button onClick={scrollToBook} size="lg" className="rounded-2xl bg-teal-700 hover:bg-teal-800">Book Your Home Clean ➜</Button>
          </div>
        </div>
      </section>

      {/* SUBSCRIPTIONS */}
      <section id="subscriptions" className="scroll-mt-24 bg-white border-t">
        <div className="max-w-6xl mx-auto px-4 py-14 grid md:grid-cols-3 gap-6">
          {[
            {title:"Weekly", save:"Save 30%", copy:"Our best value. Same pro, same time, always guest-ready."},
            {title:"Bi-weekly", save:"Save 25%", copy:"Perfect balance for busy schedules and tidy homes."},
            {title:"Monthly", save:"Save 15%", copy:"A regular reset that keeps everything under control."},
          ].map((p)=> (
            <Card key={p.title} className="rounded-3xl border-teal-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {p.title} <Badge className="bg-teal-100 text-teal-800">{p.save}</Badge>
                </CardTitle>
                <CardDescription>Flexible skips • Pause anytime</CardDescription>
              </CardHeader>
              <CardContent className="text-slate-700">{p.copy}</CardContent>
              <CardFooter>
                <Button onClick={scrollToBook} className="rounded-2xl w-full bg-teal-700 hover:bg-teal-800">Choose {p.title}</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="scroll-mt-24 bg-white border-t">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-3xl md:text-4xl font-bold text-center">Services</h2>
          <p className="text-center text-slate-600 mt-2">Standard • Deep Clean • Move-In/Out • Post-Renovation • Add-ons</p>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            {[
              { title: "Standard Clean", desc: "All rooms + kitchens/baths + surfaces, floors, dusting, trash." },
              { title: "Deep Clean", desc: "Baseboards, vents, behind/under, extra detail for first-time or reset." },
              { title: "Move-In/Out", desc: "Empty home detail incl. inside cabinets/fridge/oven available." },
            ].map((s) => (
              <Card key={s.title} className="rounded-2xl">
                <CardHeader>
                  <CardTitle>{s.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-700">{s.desc}</CardContent>
                <CardFooter>
                  <Button 
                    className="w-full rounded-2xl bg-teal-700 hover:bg-teal-800"
                    onClick={() => {
                      const qs = toQS({
                        cleaningType: s.title,
                        source: "services"
                      });
                      // use navigateTo helper for robustness
                      navigateTo(`/quote?${qs}`);
                    }}
                  >
                    Book {s.title}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="scroll-mt-24 bg-slate-50 border-t">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-3xl md:text-4xl font-bold text-center">Pricing</h2>
          <p className="text-center text-slate-600 mt-2">Flat-rate by home size + clear add-ons. No hidden fees.</p>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            {[
              { title: "Studio / 1BR", price: "$145", note: "Flat rate, standard clean" },
              { title: "2BR", price: "$185", note: "Flat rate, standard clean" },
              { title: "3BR+", price: "", note: "Custom quote" },
            ].map((t) => (
              <Card key={t.title} className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">{t.title}<span className="text-teal-700 font-bold">{t.price}</span></CardTitle>
                  <CardDescription>{t.note}</CardDescription>
                </CardHeader>
                <CardFooter><Button onClick={scrollToBook} className="w-full rounded-2xl bg-teal-700 hover:bg-teal-800">Get Exact Quote</Button></CardFooter>
              </Card>
            ))}
          </div>
          <p className="text-center text-xs text-slate-500 mt-3">Add-ons: inside fridge/oven, laundry, windows, organization, and more.</p>
        </div>
      </section>

      {/* AREAS */}
      <section id="areas" className="scroll-mt-24 bg-white border-t">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-3xl md:text-4xl font-bold text-center">Service Areas</h2>
          <p className="text-center text-slate-600 mt-2">Manhattan (all neighborhoods) • Select Brooklyn & Queens on request</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mt-6 text-slate-700">
            {["FiDi","Tribeca","SoHo","West Village","Chelsea","Flatiron","Midtown","UES","UWS","Harlem","Inwood","Battery Park"].map((n)=>(
              <div key={n} className="rounded-xl border p-3 text-center">{n}</div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-500 mt-4">Not sure if we cover you? <a onClick={scrollToBook} className="text-teal-700 underline" href="#book">Ask us</a>.</p>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="scroll-mt-24 bg-slate-50 border-t">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-3xl md:text-4xl font-bold text-center">Reviews</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            {[{ q:"Incredible attention to detail. My apartment has never looked better.", a:"— Alex, Tribeca" },
              { q:"Reliable, friendly, and so easy to book. Worth every penny.", a:"— Maya, UWS" },
              { q:"They handled my COI and keys with my doorman—super smooth.", a:"— Daniel, FiDi" }].map((r, i) => (
              <Card key={i} className="rounded-2xl">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <p className="text-slate-800">{r.q}</p>
                  <p className="text-slate-500 text-sm mt-2">{r.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 py-14">
          <h2 className="text-3xl md:text-4xl font-bold text-center">FAQ</h2>
          <LocalBusinessSchema />
          <FAQPageSchema faqs={faqs} />
          <div className="mt-6 space-y-5">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-xl border p-4">
                <div className="font-semibold">{f.q}</div>
                <div className="text-slate-600 mt-1">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 55-POINT + EXTRA LISTS */}
      <section id="checklist" className="scroll-mt-24 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center">Our Signature 55-Point Cleaning Protocol</h2>
          <p className="text-center text-slate-600 mt-2">What we touch, we perfect—room by room.</p>
          <div className="grid md:grid-cols-4 gap-8 mt-10 text-slate-700">
            {checklistCols.map((col, i) => (
              <ul key={i} className="space-y-2 list-disc pl-5">
                {col.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ))}
          </div>

          {/* Extra Services */}
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <Card className="rounded-2xl p-6">
              <h3 className="text-xl font-semibold">Extra Services</h3>
              <p className="text-slate-600 text-sm">(All bookings include 1 bathroom by default.)</p>
              <ul className="mt-4 space-y-2 list-disc pl-5 text-slate-700">
                {[
                  "Additional Bathrooms to Clean",
                  "Move In/Move Out Cleaning",
                  "Deep Cleaning (For Extra Messy Homes!)",
                  "Post Construction",
                  "Clean Inside the Cabinets",
                  "Clean Inside the Fridge",
                  "Clean Inside the Oven",
                  "Clean Interior Windows",
                  "Finished Basement Apartment",
                  "Finished Basement (Standard)",
                  "Organizing",
                  "Balcony",
                  "Terrace/Patio",
                  "Laundry",
                ].map(x => <li key={x}>{x}</li>)}
              </ul>
            </Card>

            {/* Services Not Offered */}
            <Card className="rounded-2xl p-6">
              <h3 className="text-xl font-semibold">Services Not Offered</h3>
              <p className="text-slate-600 text-sm">There are a few things we don’t include as part of regular cleaning:</p>
              <ul className="mt-4 space-y-2 list-disc pl-5 text-slate-700">
                <li>Wet wiping light bulbs (risk of breakage is too high).</li>
                <li>Putting away dishes (to avoid stacking in a way you wouldn’t prefer and reduce breakage risk).</li>
              </ul>
              <p className="mt-4 text-slate-700">
                There are a host of ways we make it easier for you to maintain your home, apartment, or commercial space. Let’s start today…
              </p>
            </Card>
          </div>

          <div className="text-center mt-10">
            <a href="#book"><Button className="rounded-2xl px-6 bg-teal-700 hover:bg-teal-800">Book Your Home Clean ➜</Button></a>
          </div>
        </div>
      </section>

      {/* ABOUT US */}
      <section id="about" className="scroll-mt-24 bg-white border-t">
        <div className="max-w-3xl mx-auto px-4 py-14">
          <h2 className="text-3xl md:text-4xl font-bold text-center">About Us</h2>
          <div className="mt-6 space-y-4 text-slate-700 leading-7">
            <p>
              Manhattan Mint started the way a lot of New York stories do — out of necessity and hustle. What began as a small idea to bring reliability and respect back to home cleaning turned into a mission to do things differently. No gimmicks, no shortcuts — just honest work done right.
            </p>
            <p>
              In the early days, we cleaned every apartment ourselves. We learned how hard it is to find people you can actually trust in your home — and how much small details matter. That’s where our name comes from: the goal to make every home feel freshly minted, no matter how busy city life gets.
            </p>
            <p>
              As word spread, our team grew — not through ads or agencies, but through referrals from New Yorkers who noticed the difference. Today, we still carry that same pride into every job. Our cleaners are trained to the standards we set from day one: be on time, be respectful, and leave a space better than you found it.
            </p>
            <p>
              We built Manhattan Mint around the belief that cleaning should feel personal, not transactional. Behind every booking is someone trusting us with their home — and we never take that lightly.
            </p>
            <p className="font-semibold text-slate-800">
              Flawless clean. Honest service. True to New York.
            </p>
          </div>
        </div>
      </section>

      {/* BOOK */}
      <section id="book" className="scroll-mt-24 bg-teal-50 border-t">
        <div className="max-w-4xl mx-auto px-4 py-14">
          <h2 className="text-3xl md:text-4xl font-bold text-center">Book a Cleaning</h2>
          <Card className="mt-8 rounded-2xl">
            <CardContent className="pt-6">
              <form
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  const phoneRaw = String(data.get("phone") || "");
                  const phoneDigits = phoneRaw.replace(/\D/g, '');
                  if (phoneDigits.length < 10) {
                    alert('Please enter a valid phone number (at least 10 digits).');
                    return;
                  }
                  const qs = toQS({
                    name: String(data.get("name") || ""),
                    email: String(data.get("email") || ""),
                    phone: phoneRaw,
                    address: String(data.get("address") || ""),
                    neighborhood: String(data.get("neighborhood") || ""),
                    zip: String(data.get("zip") || ""),
                    notes: String(data.get("notes") || ""),
                    cleaningType: String(data.get("cleaningType") || "Standard Clean"),
                    source: "home-book",
                  });
                  // Navigate using helper that supports router.push returning void or Promise
                  navigateTo(`/quote?${qs}`);
                }}
              >
                <Input name="name" placeholder="Full name" required />
                <Input name="email" type="email" placeholder="Email" required />
                <Input name="phone" type="tel" placeholder="Phone" required className="md:col-span-2" />
                <Input name="address" placeholder="Address (Building & Unit)" required className="md:col-span-2" />
                <select name="cleaningType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2" required>
                  <option value="Standard Clean">Standard Clean</option>
                  <option value="Deep Clean">Deep Clean</option>
                  <option value="Move-In/Out">Move-In/Out Clean</option>
                </select>
                <div className="grid grid-cols-2 gap-3 md:col-span-2">
                  <Input name="neighborhood" placeholder="Neighborhood" />
                  <Input name="zip" placeholder="ZIP" />
                </div>
                <Textarea name="notes" placeholder="Notes (pets, preferences, preferred dates)" rows={4} className="md:col-span-2" />
                <div className="md:col-span-2">
                  <Button type="submit" className="rounded-2xl bg-teal-700 hover:bg-teal-800 w-full">Request Booking</Button>
                </div>
              </form>
              <p className="text-center text-xs text-slate-500 mt-3">Professionally insured. Personally invested. Manhattan Mint clean.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <Image 
                src="/manhattan-mint-logo.png" 
                alt="Manhattan Mint cleaning service logo" 
                width={28} 
                height={28} 
                className="rounded"
                sizes="28px"
              />
              <div className="text-lg font-semibold">Manhattan <span className="text-teal-400">Mint</span></div>
            </Link>
            <p className="text-slate-400 text-sm mt-2">Flawless Clean. Every Time.</p>
          </div>
          <div>
            <h5 className="font-semibold mb-2">Contact</h5>
            <ul className="space-y-1 text-sm">
              <li>Phone: <a className="hover:text-white" href="tel:+10000000000">(914) 873-4430</a></li>
              <li>Email: <a className="hover:text-white" href="mailto:hello@manhattanmintnyc.com">hello@manhattanmintnyc.com</a></li>
              <li>Hours: 8am–8pm, 7 days</li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold mb-2">Quick Links</h5>
            <ul className="space-y-1 text-sm">
              <li><a className="hover:text-white" href="#subscriptions">Subscriptions</a></li>
              <li><a className="hover:text-white" href="/terms">Terms</a></li>
              <li><a className="hover:text-white" onClick={scrollToBook} href="#book">Book</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-slate-400">© {new Date().getFullYear()} Manhattan Mint. All rights reserved.</div>
        </div>
      </footer>

      {/* Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg md:hidden">
        <div className="flex gap-2 max-w-lg mx-auto">
          <Button
            onClick={() => {
              document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex-1 bg-teal-700 hover:bg-teal-800 rounded-2xl"
          >
            Book Now
          </Button>
          <Button
            onClick={() => {
              document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex-1 bg-teal-700 hover:bg-teal-800 rounded-2xl"
          >
            Get a Quote
          </Button>
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return <ManhattanMint />;
}
