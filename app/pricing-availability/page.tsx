'use client';

import { Suspense } from "react";
import PricingAvailabilityClient from "../../src/app/pricing-availability/PricingAvailabilityClient";

export default function PricingAvailabilityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <PricingAvailabilityClient />
    </Suspense>
  );
}