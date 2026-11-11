"use client";

import { useState } from "react";

// "Cleaning notes" link on every job on /admin/dispatch (2026-11-11). Tapping it
// opens the booking's cleaning_notes right under the job, the same text the
// cleaner sees on her portal. Read-only here; jobs with no notes say so.
export default function NotesLink({ notes }: { notes?: string | null }) {
  const [open, setOpen] = useState(false);
  const text = (notes ?? "").trim();

  if (!text) {
    return <div className="mt-1 text-xs text-gray-400">No cleaning notes</div>;
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        className="text-xs font-medium underline underline-offset-2 hover:no-underline"
        style={{ color: "#1d9e75" }}
      >
        {open ? "Hide cleaning notes" : "Cleaning notes"}
      </button>
      {open && (
        <div className="mt-1.5 max-w-2xl whitespace-pre-wrap break-words rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-gray-800">
          {text}
        </div>
      )}
    </div>
  );
}
