import { Suspense } from "react";
import QuoteClient from "./QuoteClient";

export default async function QuotePage() {
  return (
    <Suspense fallback={<div />}>
      <QuoteClient />
    </Suspense>
  );
}
