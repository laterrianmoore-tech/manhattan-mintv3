'use client';

import { Button } from './ui/button';

export function MobileCTA() {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg md:hidden">
      <div className="flex gap-2 max-w-lg mx-auto">
        <Button
          onClick={() => {
            const bookSection = document.getElementById('book');
            bookSection?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex-1 bg-teal-700 hover:bg-teal-800 rounded-2xl"
        >
          Book Now
        </Button>
        <Button
          onClick={() => {
            const quoteSection = document.getElementById('quote');
            quoteSection?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex-1 bg-teal-700 hover:bg-teal-800 rounded-2xl"
        >
          Get a Quote
        </Button>
      </div>
    </div>
  );
}