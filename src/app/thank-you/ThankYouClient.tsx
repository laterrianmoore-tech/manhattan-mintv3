"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ThankYouClient() {
  const sp = useSearchParams();

  const total = sp.get("total");
  const freq = sp.get("freq");
  const date = sp.get("date");
  const start = sp.get("start");
  const end = sp.get("end");
  const name = sp.get("name");
  const email = sp.get("email");
  const phone = sp.get("phone");

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Thank you!</h1>
      <p className="text-slate-600 mt-2">
        We’ve received your booking. A confirmation will be sent to your email.
      </p>

      <div className="mt-6 rounded-2xl border p-4">
        <div className="text-sm text-slate-500">Booking summary</div>
        <div className="mt-2 space-y-1 text-slate-800">
          <div><span className="text-slate-500">Name:</span> {name ?? "—"}</div>
          <div><span className="text-slate-500">Email:</span> {email ?? "—"}</div>
          <div><span className="text-slate-500">Phone:</span> {phone ?? "—"}</div>
          <div><span className="text-slate-500">Date/Time:</span> {date ?? "—"} • {start ?? "—"} – {end ?? "—"}</div>
          <div><span className="text-slate-500">Frequency:</span> {freq ?? "once"}</div>
          <div className="font-semibold"><span className="text-slate-500">Total:</span> {total ? `$${total}` : "—"}</div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/">
          <Button className="bg-teal-700 hover:bg-teal-800">Back to Home</Button>
        </Link>
        <Link href="/quote">
          <Button variant="outline" className="border-teal-200 text-teal-800">
            Make another booking
          </Button>
        </Link>
      </div>
    </div>
  );
}
