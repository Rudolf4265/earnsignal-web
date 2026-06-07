"use client";

import { useState, useCallback } from "react";
import { submitFeedback } from "@/src/lib/api/feedback";

export function PostReportFeedbackCard({ reportRunId }: { reportRunId: string }) {
  const [dismissed, setDismissed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitFeedback({
        feedback_type: "review",
        rating: rating ?? undefined,
        message: message.trim() || undefined,
        report_run_id: reportRunId,
      });
    } catch {
      // best-effort
    }
    setSubmitted(true);
    setTimeout(() => setDismissed(true), 2000);
  }, [submitting, rating, message, reportRunId]);

  if (dismissed) return null;

  if (submitted) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-center rounded-2xl border border-brand-border/60 bg-brand-panel/50 px-6 py-5"
      >
        <p className="text-sm font-medium text-brand-accent-teal">
          Thanks for the feedback!
        </p>
      </div>
    );
  }

  const displayRating = hovered ?? rating;
  const canSubmit = rating !== null || message.trim().length > 0;

  return (
    <section
      aria-label="Rate this report"
      className="rounded-2xl border border-brand-border/60 bg-[linear-gradient(165deg,rgba(18,37,74,0.58),rgba(11,24,50,0.72))] px-5 py-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-text-primary">Was this report useful?</p>
          <p className="mt-0.5 text-xs text-brand-text-muted">Your feedback makes the next one better.</p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-xs text-brand-text-muted transition-colors hover:text-brand-text-secondary shrink-0"
          aria-label="Dismiss report feedback"
        >
          Dismiss
        </button>
      </div>

      {/* Star rating */}
      <div
        className="flex items-center gap-2"
        role="group"
        aria-label="Report rating"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const active = displayRating !== null && star <= displayRating;
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
                "flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-medium transition-colors",
                active
                  ? "border-brand-accent-teal/60 bg-brand-accent-teal/15 text-brand-accent-teal"
                  : "border-brand-border/60 bg-brand-panel/40 text-brand-text-muted hover:border-brand-border-strong hover:text-brand-text-secondary",
              ].join(" ")}
            >
              {star}
            </button>
          );
        })}
        {rating !== null && (
          <span className="ml-1 text-xs text-brand-text-muted">
            {rating <= 2 ? "Not useful" : rating === 3 ? "Somewhat useful" : rating === 4 ? "Useful" : "Very useful"}
          </span>
        )}
      </div>

      {/* Optional message */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Anything specific to share? (optional)"
        rows={2}
        className="w-full resize-none rounded-xl border border-brand-border/60 bg-brand-panel/40 px-3 py-2 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-border-strong focus:outline-none"
      />

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!canSubmit || submitting}
          onClick={() => void handleSubmit()}
          className={[
            "rounded-xl border px-4 py-1.5 text-xs font-semibold transition-colors",
            canSubmit && !submitting
              ? "border-brand-accent-teal/50 bg-brand-accent-teal/10 text-brand-accent-teal hover:bg-brand-accent-teal/20"
              : "border-brand-border/50 bg-transparent text-brand-text-muted cursor-not-allowed",
          ].join(" ")}
        >
          {submitting ? "Sending…" : "Send feedback"}
        </button>
      </div>
    </section>
  );
}
