"use client";

import Image from "next/image";
import { useState } from "react";
import { updateOnboardingProfile } from "@/src/lib/api/profile";

type Platform = {
  id: string;
  label: string;
  iconSrc: string;
  iconExt: "svg" | "png";
  isReportDriving: boolean;
};

const PLATFORMS: Platform[] = [
  { id: "patreon", label: "Patreon", iconSrc: "/platforms/patreon.svg", iconExt: "svg", isReportDriving: true },
  { id: "youtube", label: "YouTube", iconSrc: "/platforms/youtube.png", iconExt: "png", isReportDriving: true },
  { id: "substack", label: "Substack", iconSrc: "/platforms/substack.svg", iconExt: "svg", isReportDriving: true },
  { id: "tiktok", label: "TikTok", iconSrc: "/platforms/tiktok.svg", iconExt: "svg", isReportDriving: false },
  { id: "instagram", label: "Instagram", iconSrc: "/platforms/instagram.svg", iconExt: "svg", isReportDriving: false },
];

type WelcomeModalProps = {
  onDismiss: (selectedPlatforms: string[]) => void;
};

export function WelcomeModal({ onDismiss }: WelcomeModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function save(platforms: string[]) {
    if (saving) return;
    setSaving(true);
    try {
      await updateOnboardingProfile({
        platform_preferences: platforms,
        onboarding_completed: true,
      });
    } catch {
      // Non-fatal: dismiss anyway; preferences can be saved next time.
    } finally {
      setSaving(false);
      onDismiss(platforms);
    }
  }

  function handleContinue() {
    void save(Array.from(selected));
  }

  function handleSkip() {
    void save([]);
  }

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      data-testid="welcome-modal-overlay"
    >
      {/* Modal card */}
      <div
        className="relative w-full max-w-md rounded-[1.75rem] border border-white/10 bg-[linear-gradient(160deg,rgba(11,22,48,0.99),rgba(8,18,40,0.99))] p-7 shadow-2xl"
        data-testid="welcome-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-modal-title"
      >
        {/* Logo mark */}
        <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-panel ring-1 ring-inset ring-white/10">
          <span className="text-sm font-semibold text-brand-accent-blue">S</span>
        </div>

        <h1 id="welcome-modal-title" className="text-xl font-semibold text-white">
          Welcome to EarnSigma
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          Which platforms are you on? We&apos;ll set up your workspace to match.
        </p>

        {/* Platform grid */}
        <div className="mt-5 grid grid-cols-5 gap-2" data-testid="welcome-platform-grid">
          {PLATFORMS.map((platform) => {
            const isSelected = selected.has(platform.id);
            return (
              <button
                key={platform.id}
                type="button"
                data-testid={`welcome-platform-${platform.id}`}
                aria-pressed={isSelected}
                onClick={() => toggle(platform.id)}
                className={[
                  "flex flex-col items-center gap-2 rounded-xl border px-2 py-3 transition",
                  isSelected
                    ? "border-brand-accent-blue/60 bg-brand-accent-blue/10 ring-1 ring-brand-accent-blue/30"
                    : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]",
                ].join(" ")}
              >
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg">
                  <Image
                    src={platform.iconSrc}
                    alt={platform.label}
                    width={24}
                    height={24}
                    className="h-6 w-6 object-contain"
                  />
                </div>
                <span className="text-center text-[10px] leading-tight text-slate-400">
                  {platform.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Role note */}
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          Patreon, YouTube, and Substack can generate standalone reports. TikTok and Instagram enrich combined reports.
        </p>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleContinue}
            disabled={saving}
            data-testid="welcome-modal-continue"
            className="w-full rounded-2xl border border-brand-accent-emerald/50 bg-[linear-gradient(120deg,rgba(13,148,136,0.95),rgba(16,185,129,0.92))] py-3 text-sm font-semibold text-white shadow-brand-glow transition hover:brightness-110 disabled:opacity-60"
          >
            {saving ? "Setting up…" : "Set up my workspace →"}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            disabled={saving}
            data-testid="welcome-modal-skip"
            className="w-full py-2 text-xs text-slate-500 transition hover:text-slate-300 disabled:opacity-50"
          >
            Skip — show me everything
          </button>
        </div>
      </div>
    </div>
  );
}
