'use client';

import { Suspense } from 'react';
import TermsClient from '../../src/app/terms/page';

export default function TermsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}> 
      <TermsClient />
    </Suspense>
  );
}
