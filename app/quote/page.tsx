'use client';

import { Suspense } from "react";
import QuoteClient from "../../src/app/quote/QuoteClient";

export default function QuotePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <QuoteClient />
    </Suspense>
  );
}