"use client";

import { Suspense } from "react";
import ThankYouClient from "../../src/app/thank-you/ThankYouClient";

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}> 
      <ThankYouClient />
    </Suspense>
  );
}
