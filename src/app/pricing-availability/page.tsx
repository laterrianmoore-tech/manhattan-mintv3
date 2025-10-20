import { Suspense } from "react";
import PricingAvailabilityClient from "./PricingAvailabilityClient";

export default async function PricingAvailabilityPage() {
  return (
    <Suspense fallback={<div />}>
      <PricingAvailabilityClient />
    </Suspense>
  );
}
