"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

function StepToggle({
  value, onChange
}: { value: "flat" | "hourly"; onChange: (v:"flat"|"hourly")=>void }) {
  return (
    <div className="flex gap-2">
      <Button type="button" variant={value==="flat" ? "default":"outline"} className="rounded-2xl" onClick={()=>onChange("flat")}>Flat Rate</Button>
      <Button type="button" variant={value==="hourly" ? "default":"outline"} className="rounded-2xl" onClick={()=>onChange("hourly")}>Hourly</Button>
    </div>
  );
}

// Build 8:00 AM - 8:00 PM in 30-min steps, AM/PM labels
function buildTimes() {
  const out: {value:string; label:string}[] = [];
  for (let h=8; h<=20; h++) {
    for (let m=0; m<60; m+=30) {
      const hh = String(h).padStart(2,"0");
      const mm = String(m).padStart(2,"0");
      const raw = `${hh}:${mm}`;
      const ampm = h < 12 ? "AM" : "PM";
      const displayHour = ((h + 11) % 12) + 1;
      out.push({ value: raw, label: `${displayHour}:${mm === "00" ? "00" : "30"} ${ampm}` });
    }
  }
  return out;
}

export default function QuotePage() {
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
  }), [params]);

  const [style, setStyle] = useState<"flat"|"hourly">("flat");
  const [beds, setBeds] = useState<number>(2);
  const [baths, setBaths] = useState<number>(1);
  const [hours, setHours] = useState<number>(3);
  const [cleaners, setCleaners] = useState<number>(2);

  const [date, setDate] = useState<string>("");
  const times = useMemo(buildTimes, []);
  const [start, setStart] = useState<string>(times[0].value);
  const [end, setEnd] = useState<string>(times[times.length-1].value);
  const [flexible, setFlexible] = useState<boolean>(true);
  const [zip, setZip] = useState(initial.zip);

  useEffect(()=>{
    if (style === "flat") { setBeds((v)=> v || 2); setBaths((v)=> v || 1); }
    else { setHours((v)=> v || 3); setCleaners((v)=> v || 2); }
  }, [style]);

  const toQS = (o: Record<string, any>) =>
    new URLSearchParams(
      Object.entries(o).reduce((acc, [k, v]) => {
        if (v !== undefined && v !== null && v !== "") acc[k] = String(v);
        return acc;
      }, {} as Record<string, string>)
    ).toString();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/manhattan-mint-logo.png" alt="Manhattan Mint" width={28} height={28} className="rounded"/>
            <div className="font-semibold">Manhattan <span className="text-teal-700">Mint</span></div>
          </Link>
          <Badge className="bg-teal-100 text-teal-800 rounded-full">Step 1 of 3</Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10 grid lg:grid-cols-[1.2fr,0.8fr] gap-8">
        {/* LEFT */}
        <div className="bg-white rounded-2xl border p-6">
          <h1 className="text-3xl font-bold mb-2">Experience the Joy of a Spotless Home</h1>
          <p className="text-slate-700 leading-7">
            More than 5,000 New Yorkers—from busy parents to on-the-go professionals—trust Manhattan Mint to keep their spaces pristine.
            We handle the cleaning, so you can reclaim your time for what truly matters: family, friends, and the moments that make city life worth it.
          </p>
          <p className="text-slate-700 leading-7 mt-4">
            Your time is priceless. Don’t let it disappear under a layer of dust—let Manhattan Mint keep your home flawlessly clean, every time.
          </p>

          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-2 mt-6 text-slate-800">
            {[
              "Trained employees","All supplies included","Bonded & insured",
              "Book & pay online","No hidden fees","Transparent pricing",
            ].map((t)=>(
              <div key={t} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-teal-700 mt-[2px]" />
                <span>{t}</span>
              </div>
            ))}
          </div>

          {/* Testimonial with photo */}
          <blockquote className="mt-8 border-l-4 border-teal-200 pl-4 italic text-slate-700">
            “Manhattan Mint sent the most amazing person to help with our apartment. She’s incredibly kind, detail-oriented, and always on time.
            Our home feels organized even with two small children. She goes the extra mile and is one of the most decent human beings we’ve ever met.”
            <div className="mt-3 flex items-center gap-3">
              <Image src="/testimonial-stock.jpg" alt="Client" width={44} height={44} className="rounded-full object-cover"/>
              <div className="text-sm text-slate-500">— Leigh E. (Yelp)</div>
            </div>
          </blockquote>
        </div>

        {/* RIGHT */}
        <div className="bg-white rounded-2xl border p-6 h-fit">
          <h2 className="text-xl font-semibold">Get a Price</h2>
          <div className="mt-4 grid gap-4">
            <Input placeholder="Zip Code" value={zip} onChange={(e)=>setZip(e.target.value)} />

            <div>
              <div className="text-sm text-slate-600 mb-1">Cleaning Style</div>
              <StepToggle value={style} onChange={setStyle}/>
            </div>

            {style === "flat" ? (
              <div>
                <div className="text-sm text-slate-600 mb-1">Tell us about your home</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between rounded-xl border px-3 py-2">
                    <button type="button" onClick={()=>setBeds(Math.max(0,beds-1))} className="p-1 rounded hover:bg-slate-100">−</button>
                    <div className="text-sm">{beds} bedroom{beds!==1?"s":""}</div>
                    <button type="button" onClick={()=>setBeds(beds+1)} className="p-1 rounded hover:bg-slate-100">＋</button>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border px-3 py-2">
                    <button type="button" onClick={()=>setBaths(Math.max(0,baths-1))} className="p-1 rounded hover:bg-slate-100">−</button>
                    <div className="text-sm">{baths} bathroom{baths!==1?"s":""}</div>
                    <button type="button" onClick={()=>setBaths(baths+1)} className="p-1 rounded hover:bg-slate-100">＋</button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm text-slate-600 mb-1">Hourly details</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between rounded-xl border px-3 py-2">
                    <button type="button" onClick={()=>setHours(Math.max(1,hours-1))} className="p-1 rounded hover:bg-slate-100">−</button>
                    <div className="text-sm">{hours} hour{hours!==1?"s":""}</div>
                    <button type="button" onClick={()=>setHours(hours+1)} className="p-1 rounded hover:bg-slate-100">＋</button>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border px-3 py-2">
                    <button type="button" onClick={()=>setCleaners(Math.max(1,cleaners-1))} className="p-1 rounded hover:bg-slate-100">−</button>
                    <div className="text-sm">{cleaners} cleaner{cleaners!==1?"s":""}</div>
                    <button type="button" onClick={()=>setCleaners(cleaners+1)} className="p-1 rounded hover:bg-slate-100">＋</button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-3">
              <div>
                <div className="text-sm text-slate-600 mb-1">When would you like us to come?</div>
                <Input type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">Any time between</div>
                <div className="grid grid-cols-2 gap-3">
                  <select className="rounded-md border px-3 py-2" value={start} onChange={(e)=>setStart(e.target.value)}>
                    {times.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <select className="rounded-md border px-3 py-2" value={end} onChange={(e)=>setEnd(e.target.value)}>
                    {times.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={flexible} onChange={(e)=>setFlexible(e.target.checked)} />
                  I’m flexible
                </label>
              </div>
            </div>

            <Button
              className="rounded-2xl bg-teal-700 hover:bg-teal-800"
              onClick={()=>{
                const qs = toQS({
                  ...initial,
                  zip, style,
                  ...(style === "flat" ? { beds, baths } : { hours, cleaners }),
                  date, start, end, flexible,
                });
                router.push(`/pricing-availability?${qs}`);
              }}
            >
              Get a Price
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
