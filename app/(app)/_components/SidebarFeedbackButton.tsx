"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { submitFeedback } from "@/src/lib/api/feedback";

type PanelState = "closed" | "open" | "submitted";

const STAR_LABELS: Record<number, string> = {
  1: "Not useful",
  2: "Slightly useful",
  3: "Okay",
  4: "Useful",
  5: "Very useful",
};

export function SidebarFeedbackButton() {
  const [panel, setPanel] = useState<PanelState>("closed");
  const [rating, setRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus textarea when panel opens
  useEffect(() => {
    if (panel === "open") {
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
  }, [panel]);

  // Close on Escape
  useEffect(() => {
    if (panel !== "open") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanel("closed");
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [panel]);

  const handleOpen = useCallback(() => {
    setPanel("open");
    setRating(null);
    setMessage("");
  }, []);

  const handleClose = useCallback(() => {
    setPanel("closed");
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    const trimmed = message.trim();
    if (!trimmed && rating === null) return;
    setSubmitting(true);
    try {
      await submitFeedback({
        feedback_type: "general",
        rating: rating ?? undefined,
        message: trimmed || undefined,
      });
    } catch {
      // best-effort
    }
    setSubmitting(false);
    setPanel("submitted");
    setTimeout(() => setPanel("closed"), 2500);
  }, [submitting, rating, message]);

  const displayRating = hovered ?? rating;
  const canSubmit = message.trim().length > 0 || rating !== null;

  return (
    <>
      {/* Trigger button — always rendered */}
      <button
        type="button"
        onClick={handleOpen}
        aria-expanded={panel === "open"}
        aria-haspopup="dialog"
        className="flex w-full items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-xs text-brand-text-muted transition duration-200 hover:border-brand-border hover:bg-brand-panel-muted/60 hover:text-brand-text-secondary"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="shrink-0"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Share feedback
      </button>

      {/* Backdrop + floating panel */}
      {panel !== "closed" && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Share feedback"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            ref={panelRef}
            className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[linear-gradient(155deg,rgba(16,32,67,0.98),rgba(14,28,60,0.99))] p-6 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.8)] space-y-5"
          >
            {panel === "submitted" ? (
              <div
                role="status"
                aria-live="polite"
                className="flex flex-col items-center gap-2 py-4 text-center"
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-brand-accent-teal"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p className="text-base font-semibold text-brand-text-primary">Thanks for the feedback!</p>
                <p className="text-sm text-brand-text-muted">It helps make EarnSigma better.</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-brand-text-primary">Share feedback</p>
                    <p className="mt-0.5 text-sm text-brand-text-muted">
                      What&apos;s working? What&apos;s not? We read everything.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    aria-label="Close feedback"
                    className="rounded-lg p-1 text-brand-text-muted transition-colors hover:bg-white/[0.06] hover:text-brand-text-secondary"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Overall rating */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-brand-text-secondary">Overall rating</p>
                  <div className="flex items-center gap-2" role="group" aria-label="Overall rating">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = displayRating !== null && star <= displayRating;
                      return (
                        <button
                          key={star}
                          type="button"
                          aria-label={`${star} — ${STAR_LABELS[star]}`}
                          aria-pressed={rating === star}
                          onClick={() => setRating(star === rating ? null : star)}
                          onMouseEnter={() => setHovered(star)}
                          onMouseLeave={() => setHovered(null)}
                          className={[
                            "flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-semibold transition-colors",
                            active
                              ? "border-brand-accent-teal/60 bg-brand-accent-teal/15 text-brand-accent-teal"
                              : "border-white/10 bg-white/[0.04] text-brand-text-muted hover:border-white/20 hover:text-brand-text-secondary",
                          ].join(" ")}
                        >
                          {star}
                        </button>
                      );
                    })}
                  </div>
                  {displayRating !== null && (
                    <p className="text-xs text-brand-text-muted">{STAR_LABELS[displayRating]}</p>
                  )}
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-brand-text-secondary">Your thoughts</p>
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What's working well? What could be better?"
                    rows={4}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                  />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-brand-text-secondary transition-colors hover:bg-white/[0.07] hover:text-brand-text-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!canSubmit || submitting}
                    onClick={() => void handleSubmit()}
                    className={[
                      "rounded-xl border px-5 py-2 text-sm font-semibold transition-colors",
                      canSubmit && !submitting
                        ? "border-brand-accent-teal/50 bg-brand-accent-teal/12 text-brand-accent-teal hover:bg-brand-accent-teal/20"
                        : "border-white/10 bg-white/[0.04] text-brand-text-muted cursor-not-allowed",
                    ].join(" ")}
                  >
                    {submitting ? "Sending…" : "Send feedback"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
