"use client";

import { useEffect, useState } from "react";
import Head from "next/head";

export default function BookingPage() {
  const [embedStatus, setEmbedStatus] = useState<"loading"|"loaded"|"error">("loading");
  useEffect(() => {
    // Inject Jobber embed script with required custom attributes
    const script = document.createElement('script');
    script.src = 'https://d3ey4dbjkt2f6s.cloudfront.net/assets/static_link/work_request_embed_snippet.js';
    script.setAttribute('clienthub_id', '7d20bf1d-a855-4ac8-8c3d-9423657d717c-2035262');
    script.setAttribute('form_url', 'https://clienthub.getjobber.com/client_hubs/7d20bf1d-a855-4ac8-8c3d-9423657d717c/public/work_request/embedded_work_request_form?form_id=2035262');
    script.onload = () => setEmbedStatus("loaded");
    script.onerror = () => setEmbedStatus("error");
    document.body.appendChild(script);
    return () => { script.remove(); };
  }, []);
  return (
    <>
      <Head>
        <link
          rel="stylesheet"
          href="https://d3ey4dbjkt2f6s.cloudfront.net/assets/external/work_request_embed.css"
          media="screen"
        />
      </Head>
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold mb-4">Request a Booking</h1>
          <p className="text-slate-600 mb-6">Fill out the form below to request service. Your request will be sent directly to our Jobber account.</p>
          <div className="mb-4 text-xs text-slate-500">
            Tip: If the embedded form doesn’t submit, add this site to your Jobber allowlist: <code>{typeof window !== 'undefined' ? window.location.origin : ''}</code>
          </div>

          {/* Jobber Embedded Work Request Form */}
          <div id="7d20bf1d-a855-4ac8-8c3d-9423657d717c-2035262" />
          {embedStatus !== "loaded" && (
            <div className="mt-4 text-sm text-slate-600">
              {embedStatus === "loading" ? "Loading booking form…" : (
                <>
                  Couldn’t load the embedded form. You can still submit a request using the direct link:{' '}
                  <a
                    className="text-teal-700 underline"
                    href="https://clienthub.getjobber.com/hubs/7d20bf1d-a855-4ac8-8c3d-9423657d717c/public/requests/2035262/new"
                    target="_blank" rel="noopener noreferrer"
                  >
                    Open Booking Form
                  </a>.
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
