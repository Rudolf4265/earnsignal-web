"use client";

import Link from "next/link";
import { buttonClassName } from "@/src/components/ui/button";
import type { ReportDetailPresentationModel } from "@/src/lib/report/detail-presentation";

// ── View model ────────────────────────────────────────────────────────────────

export type ReportFreeTeaserViewModel = {
  platformCount: number;
  hasRevenueSignals: boolean;
  hasSubscriberSignals: boolean;
};

export function buildReportFreeTeaserViewModel(presentation: ReportDetailPresentationModel): ReportFreeTeaserViewModel {
  const platformCount = presentation.platformMix.platformsConnected ?? presentation.platformMix.highlights.filter(Boolean).length;
  const hasRevenueSignals = presentation.heroMetrics.some((m) => m.id === "net_revenue" && m.value !== "--");
  const hasSubscriberSignals = presentation.heroMetrics.some((m) => m.id === "subscribers" && m.value !== "--");
  return { platformCount, hasRevenueSignals, hasSubscriberSignals };
}

// ── Component ─────────────────────────────────────────────────────────────────

type SignalPillProps = { label: string };

function SignalPill({ label }: SignalPillProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border/60 bg-brand-panel/60 px-2.5 py-1 text-[11px] text-brand-text-secondary">
      <span className="h-1.5 w-1.5 rounded-full bg-brand-accent-teal/70" aria-hidden="true" />
      {label}
    </span>
  );
}

type ReportFreeTeaserProps = {
  model: ReportFreeTeaserViewModel;
};

export function ReportFreeTeaser({ model }: ReportFreeTeaserProps) {
  const platformLabel =
    model.platformCount > 1
      ? `Data from ${model.platformCount} platforms detected`
      : model.platformCount === 1
        ? "Data from 1 platform detected"
        : "Platform data detected";

  return (
    <div className="space-y-4" data-testid="report-free-teaser">
      {/* Report ready banner */}
      <div className="relative overflow-hidden rounded-[1.2rem] border border-brand-accent-teal/30 bg-[linear-gradient(155deg,rgba(14,42,65,0.97),rgba(16,50,68,0.93),rgba(11,34,55,0.98))] p-5 shadow-brand-card">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand-accent-teal/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-accent-teal/55 via-brand-accent-teal/22 to-transparent" />

        <div className="relative space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-accent-teal/35 bg-brand-accent-teal/10 text-brand-accent-teal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent-teal">Report Ready</p>
          </div>

          <p className="text-base font-semibold leading-snug text-brand-text-primary">
            Your data is ready. Unlock the full report to see your biggest opportunity, platform risks, and next actions.
          </p>

          <div className="flex flex-wrap gap-2">
            <SignalPill label={platformLabel} />
            {model.hasRevenueSignals ? <SignalPill label="Revenue signals detected" /> : null}
            {model.hasSubscriberSignals ? <SignalPill label="Subscriber data present" /> : null}
          </div>
        </div>
      </div>

      {/* Locked sections preview */}
      <div className="grid gap-3 sm:grid-cols-2" data-testid="report-free-teaser-locked-sections">
        {[
          { label: "Biggest Opportunity", description: "Your highest-value growth lever and the action to take" },
          { label: "Platform Mix", description: "Concentration risk across your revenue sources" },
          { label: "Strengths & Risks", description: "What is working and what to watch closely" },
          { label: "Next 3 Actions", description: "Prioritized steps to improve your creator business" },
        ].map((section) => (
          <div
            key={section.label}
            className="rounded-[1.1rem] border border-dashed border-brand-border-strong/55 bg-brand-panel-muted/60 p-4"
          >
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5 flex-shrink-0 text-brand-text-muted" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">{section.label}</p>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-brand-text-muted">{section.description}</p>
          </div>
        ))}
      </div>

      {/* Upgrade CTA */}
      <div className="relative overflow-hidden rounded-[1.2rem] border border-brand-border-strong/80 bg-[linear-gradient(155deg,rgba(16,32,67,0.95),rgba(23,49,117,0.78),rgba(15,118,110,0.32))] p-5 shadow-brand-card">
        <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-brand-accent-blue/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-14 bottom-[-4.5rem] h-36 w-36 rounded-full bg-brand-accent-emerald/16 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <p className="inline-flex rounded-full border border-brand-border-strong/80 bg-brand-panel/72 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">
              Report Access Required
            </p>
            <p className="text-sm leading-relaxed text-brand-text-secondary">
              <span className="font-medium text-brand-text-primary">Unlock your full creator business report. </span>
              See revenue breakdown, subscriber trends, platform concentration, and prioritized next actions in one place.
            </p>
          </div>
          <Link
            href="/app/billing"
            className={buttonClassName({ variant: "primary", size: "sm", className: "relative z-10 shrink-0 px-4 shadow-brand-glow" })}
            data-testid="report-free-teaser-upgrade-cta"
          >
            View plans
          </Link>
        </div>
      </div>

      {/* Pro upsell teaser */}
      <div className="rounded-xl border border-brand-border/45 bg-brand-panel/30 px-4 py-3" data-testid="report-free-teaser-pro-upsell">
        <p className="text-xs leading-relaxed text-brand-text-muted">
          <span className="font-medium text-brand-text-secondary">Already have a report? </span>
          Upgrade to Pro to track changes over time, compare periods, and monitor new risks and opportunities.
        </p>
      </div>
    </div>
  );
}
