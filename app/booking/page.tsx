"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function BookingPage() {
  const [embedStatus, setEmbedStatus] = useState<"loading"|"loaded"|"error">("loading");

  useEffect(() => {
    // Inject Launch27 bundle script
    const script = document.createElement('script');
    script.src = 'https://manhattanmintnyc.launch27.com/jsbundle';
    script.onload = () => setEmbedStatus("loaded");
    script.onerror = () => setEmbedStatus("error");
    document.body.appendChild(script);
    return () => { script.remove(); };
  }, []);

  // Build iframe URL with optional prefill from sessionStorage set by pricing page
  const buildIframeUrl = () => {
    const baseUrl = 'https://manhattanmintnyc.launch27.com/?w_cleaning';
    if (typeof window === 'undefined') return baseUrl;
    const stored = sessionStorage.getItem('bookingData');
    if (!stored) return baseUrl;
    const data = JSON.parse(stored);
    const params = new URLSearchParams();
    if (data?.contact?.email) params.set('email', data.contact.email);
    if (data?.contact?.phone) params.set('phone', data.contact.phone);
    if (data?.contact?.first) params.set('first_name', data.contact.first);
    if (data?.contact?.last) params.set('last_name', data.contact.last);
    if (data?.contact?.address) params.set('address', data.contact.address);
    if (data?.contact?.city) params.set('city', data.contact.city);
    if (data?.contact?.state) params.set('state', data.contact.state);
    if (data?.contact?.zip) params.set('zip', data.contact.zip);
    if (data?.date) params.set('date', data.date);
    if (data?.start) params.set('time', data.start);
    if (data?.serviceName) params.set('service', data.serviceName);
    if (data?.notes) params.set('notes', data.notes);
    const qs = params.toString();
    return qs ? `${baseUrl}&${qs}` : baseUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-slate-50">
      <header className="bg-white/90 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/manhattan-mint-logo.png" alt="Manhattan Mint" width={28} height={28} className="rounded"/>
            <div className="font-semibold">Manhattan <span className="text-teal-700">Mint</span></div>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-4 text-teal-700">Complete Your Booking</h1>
        <p className="text-slate-600 mb-6">Review your details and complete payment to confirm your cleaning appointment.</p>

        {embedStatus === "loading" && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading booking form...</p>
            </div>
          </div>
        )}

        {embedStatus === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-700 font-medium mb-2">Couldn't load the booking form</p>
            <p className="text-slate-600 text-sm mb-4">Please try refreshing the page or contact us directly.</p>
            <a href="mailto:hello@manhattanmintnyc.com" className="text-teal-700 underline">Email us for assistance</a>
          </div>
        )}

        <div id="launch27-embed-container" className={embedStatus === "loaded" ? "" : "hidden"}>
          <iframe
            id="booking-widget-iframe"
            src={buildIframeUrl()}
            style={{ border: 'none', width: '100%', minHeight: '2739px', overflow: 'hidden' }}
            scrolling="no"
            title="Manhattan Mint Booking Form"
          />
        </div>

        {embedStatus === "loaded" && (
          <div className="mt-6 text-center text-sm text-slate-500">
            Having trouble?{' '}
            <a href="https://manhattanmintnyc.launch27.com/?w_cleaning" target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">Open booking form in new window</a>
          </div>
        )}
      </main>

      <style jsx global>{`
        /* Manhattan Mint brand styling for Launch27 embed */
        #booking-widget-iframe { border-radius: 12px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); }
      `}</style>
    </div>
  );
}
