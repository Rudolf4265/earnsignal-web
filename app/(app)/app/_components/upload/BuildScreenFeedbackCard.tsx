"use client";

import { useState, useCallback } from "react";
import { submitFeedback } from "@/src/lib/api/feedback";

const PLATFORM_OPTIONS = [
  "Twitch",
  "Ko-fi",
  "Spotify",
  "Beehiiv",
  "Ghost",
  "Gumroad",
  "Fanfix",
  "Other",
] as const;

export function BuildScreenFeedbackCard() {
  const [dismissed, setDismissed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const togglePlatform = useCallback((p: string) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitFeedback({
        feedback_type: "build_screen",
        rating: rating ?? undefined,
        platform_requests: platforms.length > 0 ? platforms : undefined,
      });
    } catch {
      // swallow — feedback is best-effort
    }
    setSubmitted(true);
    setTimeout(() => setDismissed(true), 2000);
  }, [submitting, rating, platforms]);

  if (dismissed) return null;

  if (submitted) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-center rounded-[1.75rem] border border-white/8 bg-white/[0.02] px-6 py-5"
      >
        <p className="text-sm font-medium text-brand-accent-teal">
          Thanks for the feedback!
        </p>
      </div>
    );
  }

  const canSubmit = rating !== null || platforms.length > 0;
  const displayRating = hovered ?? rating;

  return (
    <section
      aria-label="Quick feedback"
      className="rounded-[1.75rem] border border-white/8 bg-white/[0.02] px-6 py-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-white">
          Quick question while you wait&hellip;
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors shrink-0"
          aria-label="Dismiss feedback card"
        >
          No thanks
        </button>
      </div>

      {/* Q1: Upload experience rating */}
      <div className="space-y-2">
        <p className="text-xs text-slate-400">How was uploading your data?</p>
        <div
          className="flex gap-1.5"
          role="group"
          aria-label="Upload experience rating"
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const isActive = displayRating !== null && star <= displayRating;
            return (
              <button
                key={star}
                type="button"
                aria-label={`${star} star${star === 1 ? "" : "s"}`}
                aria-pressed={rating === star}
                onClick={() => setRating(star === rating ? null : star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(null)}
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-xl border text-sm font-medium transition-colors",
                  isActive
                    ? "border-brand-accent-teal/60 bg-brand-accent-teal/15 text-brand-accent-teal"
                    : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:text-slate-200",
                ].join(" ")}
              >
                {star}
              </button>
            );
          })}
          {rating !== null && (
            <span className="ml-1 self-center text-xs text-slate-500">
              {rating <= 2 ? "Rough" : rating === 3 ? "Okay" : rating === 4 ? "Good" : "Great!"}
            </span>
          )}
        </div>
      </div>

      {/* Q2: Platform wishlist */}
      <div className="space-y-2">
        <p className="text-xs text-slate-400">
          Any platforms you&#39;d love to see supported?
        </p>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Platform wishlist">
          {PLATFORM_OPTIONS.map((p) => {
            const selected = platforms.includes(p);
            return (
              <button
                key={p}
                type="button"
                aria-pressed={selected}
                onClick={() => togglePlatform(p)}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  selected
                    ? "border-brand-accent-teal/60 bg-brand-accent-teal/15 text-brand-accent-teal"
                    : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:text-slate-200",
                ].join(" ")}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!canSubmit || submitting}
          onClick={() => void handleSubmit()}
          className={[
            "rounded-xl border px-4 py-1.5 text-xs font-semibold transition-colors",
            canSubmit && !submitting
              ? "border-brand-accent-teal/50 bg-brand-accent-teal/10 text-brand-accent-teal hover:bg-brand-accent-teal/20"
              : "border-white/10 bg-white/[0.04] text-slate-500 cursor-not-allowed",
          ].join(" ")}
        >
          {submitting ? "Sending…" : "Send feedback"}
        </button>
      </div>
    </section>
  );
}
