'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from './ui/button';

export function MobileCTA() {
  const router = useRouter();
  const pathname = usePathname();

  const goBook = () => {
    const bookSection = document.getElementById('book');
    if (bookSection) {
      bookSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Fallback to pricing/availability step
      router.push('/pricing-availability');
    }
  };

  const goQuote = () => {
    const quoteSection = document.getElementById('quote');
    if (quoteSection && pathname === '/') {
      quoteSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Always works across the site
      router.push('/quote');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg md:hidden">
      <div className="flex gap-2 max-w-lg mx-auto">
        <Button onClick={goBook} className="flex-1 bg-teal-700 hover:bg-teal-800 rounded-2xl">
          Book Now
        </Button>
        <Button onClick={goQuote} className="flex-1 bg-teal-700 hover:bg-teal-800 rounded-2xl">
          Get a Quote
        </Button>
      </div>
    </div>
  );
}