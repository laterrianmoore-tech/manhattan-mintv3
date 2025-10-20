import { Suspense } from "react";
import ThankYouClient from "./ThankYouClient";

export default async function ThankYouPage() {
  return (
    <Suspense fallback={<div />}>
      <ThankYouClient />
    </Suspense>
  );
}
