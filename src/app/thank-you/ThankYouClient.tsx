"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface BookingData {
  total?: string;
  freq?: string;
  date?: string;
  start?: string;
  end?: string;
  name?: string;
  email?: string;
  phone?: string;
}

// Small helper to format HH:MM -> h:mm AM/PM
function formatTime(time?: string) {
  if (!time) return '—';
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const m = Number(mStr || 0);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 || 12;
  return `${displayHour}:${String(m).padStart(2, '0')} ${period}`;
}

export default function ThankYouClient() {
  const [bookingData, setBookingData] = useState<BookingData>({});

  useEffect(() => {
    // Get data from sessionStorage
    const storedData = sessionStorage.getItem('thankYouData');
    if (storedData) {
      const data = JSON.parse(storedData);
      setBookingData(data);
      // Clear the stored data since we've used it
      sessionStorage.removeItem('thankYouData');
    }
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Thank you!</h1>
      <p className="text-slate-600 mt-2">
        We’ve received your booking. A confirmation will be sent to your email.
      </p>

      <div className="mt-6 rounded-2xl border p-4">
        <div className="text-sm text-slate-500">Booking summary</div>
        <div className="mt-2 space-y-1 text-slate-800">
          <div><span className="text-slate-500">Name:</span> {bookingData.name ?? "—"}</div>
          <div><span className="text-slate-500">Email:</span> {bookingData.email ?? "—"}</div>
          <div><span className="text-slate-500">Phone:</span> {bookingData.phone ?? "—"}</div>
          <div>
            <span className="text-slate-500">Requested time:</span>{' '}
            {bookingData.start ? `${formatTime(bookingData.start)} – ${formatTime(bookingData.end)}` : '—'}
          </div>
          <div>
            <span className="text-slate-500">Date:</span>{' '}
            {bookingData.date ? new Date(bookingData.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
          </div>
          <div><span className="text-slate-500">Frequency:</span> {bookingData.freq ?? "once"}</div>
          <div className="font-semibold"><span className="text-slate-500">Total:</span> {bookingData.total ? `$${bookingData.total}` : "—"}</div>
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
