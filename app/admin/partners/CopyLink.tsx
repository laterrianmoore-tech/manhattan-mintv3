"use client";

import { useState } from "react";

export default function CopyLink({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(url).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="px-2.5 py-1 rounded-lg border border-gray-300 bg-white text-xs font-medium hover:bg-gray-50"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
