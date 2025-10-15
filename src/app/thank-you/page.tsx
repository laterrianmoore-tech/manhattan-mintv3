"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ThankYouPage() {
  const params = useSearchParams();
  const total = params.get("total");
  const date = params.get("date");
  const start = params.get("start");
  const end = params.get("end");
  const name = params.get("name");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/manhattan-mint-logo.png" alt="Manhattan Mint" width={28} height={28} className="rounded"/>
            <div className="font-semibold">Manhattan <span className="text-teal-700">Mint</span></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">Thanks for booking{ name ? `, ${name}` : "" }!</h1>
        <p className="mt-3 text-slate-700">
          We’ve received your request and will send a confirmation shortly.
        </p>
        <div className="mt-6 inline-block bg-white rounded-2xl border px-6 py-4 text-left">
          <div className="text-sm text-slate-600">Summary</div>
          <div className="mt-1 text-slate-800">
            <div>Date: {date ? new Date(date).toLocaleDateString() : "—"}</div>
            <div>Window: {start || "—"} – {end || "—"}</div>
            {total && <div>Quoted Total: ${total}</div>}
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <Link href="/"><Button className="rounded-2xl bg-teal-700 hover:bg-teal-800">Back to Home</Button></Link>
          <Link href="/quote"><Button variant="outline" className="rounded-2xl">Book Another Cleaning</Button></Link>
        </div>

        <p className="mt-6 text-xs text-slate-500">Fresh-mint feeling, guaranteed.</p>
      </main>
    </div>
  );
}
