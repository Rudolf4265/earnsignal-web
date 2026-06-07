"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { submitFeedback } from "@/src/lib/api/feedback";

const PLATFORM_SUGGESTIONS = [
  "Twitch",
  "Ko-fi",
  "Spotify",
  "Beehiiv",
  "Ghost",
  "Gumroad",
  "Fanfix",
  "OnlyFans",
  "Kajabi",
  "Shopify",
  "Etsy",
  "Bandcamp",
  "SoundCloud",
  "Rumble",
  "Kick",
  "Discord",
  "Telegram",
  "Buy Me a Coffee",
  "Stan.store",
  "Whop",
  "Memberful",
  "Fansly",
  "Linktree",
];

export function BuildScreenFeedbackCard() {
  const [dismissed, setDismissed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = PLATFORM_SUGGESTIONS.filter(
    (p) =>
      p.toLowerCase().includes(inputValue.toLowerCase()) &&
      !platforms.includes(p),
  );

  const showAddOption =
    inputValue.trim().length > 0 &&
    !PLATFORM_SUGGESTIONS.some(
      (p) => p.toLowerCase() === inputValue.trim().toLowerCase(),
    ) &&
    !platforms.includes(inputValue.trim());

  const dropdownOptions = [
    ...filteredSuggestions,
    ...(showAddOption ? [`Add "${inputValue.trim()}"`] : []),
  ];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
        setFocusedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addPlatform = useCallback(
    (option: string) => {
      const value = option.startsWith('Add "')
        ? option.slice(5, -1)
        : option;
      if (value && !platforms.includes(value)) {
        setPlatforms((prev) => [...prev, value]);
      }
      setInputValue("");
      setShowDropdown(false);
      setFocusedIndex(-1);
      inputRef.current?.focus();
    },
    [platforms],
  );

  const removePlatform = useCallback((p: string) => {
    setPlatforms((prev) => prev.filter((x) => x !== p));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setShowDropdown(true);
          setFocusedIndex((i) => Math.min(i + 1, dropdownOptions.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < dropdownOptions.length) {
            addPlatform(dropdownOptions[focusedIndex]);
          } else if (inputValue.trim() && !platforms.includes(inputValue.trim())) {
            addPlatform(inputValue.trim());
          }
          break;
        case "Escape":
          setShowDropdown(false);
          setFocusedIndex(-1);
          break;
        case "Backspace":
          if (inputValue === "" && platforms.length > 0) {
            setPlatforms((prev) => prev.slice(0, -1));
          }
          break;
      }
    },
    [focusedIndex, dropdownOptions, inputValue, platforms, addPlatform],
  );

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

      {/* Q2: Platform type-ahead combobox */}
      <div className="space-y-2">
        <p className="text-xs text-slate-400">
          Any platforms you&#39;d love to see supported?
        </p>

        {/* Selected platform chips */}
        {platforms.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {platforms.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1 rounded-full border border-brand-accent-teal/60 bg-brand-accent-teal/15 px-3 py-0.5 text-xs font-medium text-brand-accent-teal"
              >
                {p}
                <button
                  type="button"
                  onClick={() => removePlatform(p)}
                  aria-label={`Remove ${p}`}
                  className="text-brand-accent-teal/60 hover:text-brand-accent-teal transition-colors leading-none"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Combobox */}
        <div ref={containerRef} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowDropdown(true);
              setFocusedIndex(-1);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search or type a platform…"
            aria-label="Platform search"
            aria-autocomplete="list"
            aria-expanded={showDropdown && dropdownOptions.length > 0}
            autoComplete="off"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-white/25 transition-colors"
          />

          {showDropdown && dropdownOptions.length > 0 && (
            <div
              role="listbox"
              aria-label="Platform suggestions"
              className="absolute left-0 right-0 top-full z-20 mt-1 max-h-44 overflow-y-auto rounded-xl border border-white/10 bg-[#0a1120] shadow-lg"
            >
              {dropdownOptions.map((option, index) => {
                const isAddOption = option.startsWith('Add "');
                const displayName = isAddOption ? option.slice(5, -1) : option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={index === focusedIndex}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addPlatform(option);
                    }}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={[
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                      index === focusedIndex
                        ? "bg-white/[0.07] text-slate-200"
                        : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
                    ].join(" ")}
                  >
                    {isAddOption ? (
                      <>
                        <span className="font-semibold text-brand-accent-teal">+</span>
                        <span>{displayName}</span>
                        <span className="ml-auto text-[10px] text-slate-600">custom</span>
                      </>
                    ) : (
                      displayName
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {platforms.length === 0 && (
          <p className="text-[10px] text-slate-600">
            Type to search · press Enter or pick from dropdown to add
          </p>
        )}
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
