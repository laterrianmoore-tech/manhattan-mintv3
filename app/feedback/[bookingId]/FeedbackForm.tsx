"use client";

import { useState } from "react";

interface Props {
  bookingId: string;
  cleanerFirstName: string;
  serviceDate: string;
  serviceSummary: string | null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function FeedbackForm({
  bookingId,
  cleanerFirstName,
  serviceDate,
  serviceSummary,
}: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [wouldBookAgain, setWouldBookAgain] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/feedback/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId,
        rating,
        wouldBookAgain: wouldBookAgain,
        comment: comment.trim() || null,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (res.ok) {
      setDone(true);
    } else {
      setError(data.error ?? "Something went wrong. Please try again.");
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#f9fafb" }}>
        <div className="w-full max-w-[28rem] bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: "#0f0f0f" }}>
            Thanks for the feedback.
          </h2>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            See you next time. — Manhattan Mint NYC
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ backgroundColor: "#f9fafb" }}>
      <div className="w-full max-w-[28rem] bg-white rounded-2xl shadow-sm p-8">
        {/* Heading */}
        <h1 className="text-2xl font-semibold mb-1" style={{ color: "#0f0f0f" }}>
          How was your clean with {cleanerFirstName}?
        </h1>
        <p className="text-sm mb-8" style={{ color: "#6b7280" }}>
          {formatDate(serviceDate)}
          {serviceSummary ? ` · ${serviceSummary}` : ""}
        </p>

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Stars */}
          <div>
            <p className="text-sm font-medium mb-3" style={{ color: "#374151" }}>
              Your rating <span className="text-red-500">*</span>
            </p>
            <div
              className="flex gap-1"
              onMouseLeave={() => setHovered(0)}
              role="group"
              aria-label="Rating"
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= (hovered || rating);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                    className="transition-transform duration-100 active:scale-90 select-none"
                    style={{
                      fontSize: 52,
                      lineHeight: 1,
                      color: filled ? "#1d9e75" : "#e5e7eb",
                      transform: hovered === star ? "scale(1.15)" : "scale(1)",
                      cursor: "pointer",
                      background: "none",
                      border: "none",
                      padding: "0 2px",
                      display: "inline-block",
                      minWidth: 52,
                      minHeight: 52,
                    }}
                  >
                    ★
                  </button>
                );
              })}
            </div>
          </div>

          {/* Would book again */}
          <div>
            <p className="text-sm font-medium mb-3" style={{ color: "#374151" }}>
              Would you book us again?
              <span className="ml-1 font-normal" style={{ color: "#9ca3af" }}>
                Optional
              </span>
            </p>
            <div className="flex gap-2">
              {(["Yes", "Not sure"] as const).map((label) => {
                const val = label === "Yes";
                const selected = wouldBookAgain === val;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setWouldBookAgain(selected ? null : val)}
                    className="px-5 py-2 rounded-full text-sm font-medium transition-colors border"
                    style={{
                      backgroundColor: selected ? "#1d9e75" : "#fff",
                      color: selected ? "#fff" : "#374151",
                      borderColor: selected ? "#1d9e75" : "#d1d5db",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label
              htmlFor="comment"
              className="block text-sm font-medium mb-2"
              style={{ color: "#374151" }}
            >
              Anything we can do better?
              <span className="ml-1 font-normal" style={{ color: "#9ca3af" }}>
                Optional
              </span>
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 500))}
              placeholder="Quick note is fine — even one sentence helps."
              rows={3}
              className="w-full rounded-xl border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2"
              style={{
                borderColor: "#e5e7eb",
                color: "#0f0f0f",
                "--tw-ring-color": "#1d9e75",
              } as React.CSSProperties}
            />
            {comment.length > 420 && (
              <p className="text-xs mt-1 text-right" style={{ color: "#9ca3af" }}>
                {500 - comment.length} chars remaining
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={rating === 0 || loading}
              className="w-full h-12 rounded-xl text-white font-medium text-sm transition-colors disabled:opacity-40"
              style={{ backgroundColor: "#1d9e75" }}
              onMouseOver={(e) => {
                if (rating > 0 && !loading) e.currentTarget.style.backgroundColor = "#085041";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#1d9e75";
              }}
            >
              {loading ? "Submitting…" : "Submit feedback"}
            </button>
            <p
              className="text-xs text-center mt-3"
              style={{ color: "#9ca3af" }}
            >
              Your feedback helps us pay our cleaners fairly and improve every visit.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
