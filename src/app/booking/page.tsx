'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function BookingPage() {
  const router = useRouter();

  const navigateTo = (path: string) => {
    try {
      router.push(path);
    } catch (error) {
      // Fallback to window.location if router.push fails
      window.location.href = path;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Book Your Service</h1>
      <div className="space-y-4">
        <Button
          onClick={() => navigateTo('/quote')}
          className="w-full"
        >
          Request a Quote
        </Button>
        <Button
          onClick={() => navigateTo('/pricing-availability')}
          className="w-full"
        >
          Check Pricing & Availability
        </Button>
      </div>
    </div>
  );
}