"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { submitFeedback } from "@/src/lib/api/feedback";

type PanelState = "closed" | "open" | "submitted";

export function SidebarFeedbackButton() {
  const [panel, setPanel] = useState<PanelState>("closed");
  const [rating, setRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when panel opens
  useEffect(() => {
    if (panel === "open") {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [panel]);

  const handleOpen = useCallback(() => {
    setPanel("open");
    setRating(null);
    setMessage("");
  }, []);

  const handleCancel = useCallback(() => {
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

  if (panel === "submitted") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl border border-brand-border/60 bg-brand-panel/50 px-3 py-2.5 text-xs text-brand-accent-teal"
      >
        Thanks for the feedback!
      </div>
    );
  }

  if (panel === "open") {
    return (
      <div className="space-y-3 rounded-xl border border-brand-border-strong/60 bg-brand-panel/60 p-3">
        {/* Star rating */}
        <div
          className="flex gap-1"
          role="group"
          aria-label="Overall rating"
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
                  "flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-medium transition-colors",
                  active
                    ? "border-brand-accent-teal/60 bg-brand-accent-teal/15 text-brand-accent-teal"
                    : "border-brand-border/60 bg-brand-panel/40 text-brand-text-muted hover:border-brand-border-strong hover:text-brand-text-secondary",
                ].join(" ")}
              >
                {star}
              </button>
            );
          })}
        </div>

        {/* Message */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What's on your mind?"
          rows={3}
          className="w-full resize-none rounded-lg border border-brand-border/60 bg-brand-panel/40 px-2.5 py-2 text-xs text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-border-strong focus:outline-none"
        />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canSubmit || submitting}
            onClick={() => void handleSubmit()}
            className={[
              "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
              canSubmit && !submitting
                ? "border-brand-accent-teal/50 bg-brand-accent-teal/10 text-brand-accent-teal hover:bg-brand-accent-teal/20"
                : "border-brand-border/50 bg-transparent text-brand-text-muted cursor-not-allowed",
            ].join(" ")}
          >
            {submitting ? "Sending…" : "Send"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg px-2 py-1.5 text-xs text-brand-text-muted transition-colors hover:text-brand-text-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // closed state
  return (
    <button
      type="button"
      onClick={handleOpen}
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
  );
}
