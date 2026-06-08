"use client";

import Link from "next/link";
import { SkeletonBlock } from "../../../_components/ui/skeleton";

type SignalTone = "positive" | "warning" | "risk" | "neutral";

export type WhatsHappeningSignal = {
  id: string;
  tone: SignalTone;
  title: string;
  body: string;
};

export type AudienceRow = {
  platform: string;
  followersGained: number;
  period: string;
};

export type DashboardWhatsHappeningProps = {
  headline: string | null;
  signals: WhatsHappeningSignal[];
  audienceRows: AudienceRow[];
  latestReportHref: string;
  loading: boolean;
};

// Tone config — badge pill uses inline rgba to match HeroCards insight badge style
const toneConfig: Record<
  SignalTone,
  { pillBg: string; pillBorder: string; pillColor: string; label: string }
> = {
  positive: {
    pillBg:     "rgba(52,211,153,0.13)",
    pillBorder: "rgba(52,211,153,0.30)",
    pillColor:  "var(--es-color-accent-emerald)",
    label:      "Positive",
  },
  warning: {
    pillBg:     "rgba(245,158,11,0.13)",
    pillBorder: "rgba(245,158,11,0.28)",
    pillColor:  "#fbbf24",
    label:      "Watch",
  },
  risk: {
    pillBg:     "rgba(251,113,133,0.13)",
    pillBorder: "rgba(251,113,133,0.28)",
    pillColor:  "#fb7185",
    label:      "Risk",
  },
  neutral: {
    pillBg:     "rgba(59,130,246,0.12)",
    pillBorder: "rgba(59,130,246,0.25)",
    pillColor:  "var(--es-color-accent-blue)",
    label:      "Note",
  },
};

function formatFollowers(n: number): string {
  if (n >= 1000) return `+${(n / 1000).toFixed(1)}k`;
  return n > 0 ? `+${n}` : `${n}`;
}

export function DashboardWhatsHappening({
  headline,
  signals,
  audienceRows,
  latestReportHref,
  loading,
}: DashboardWhatsHappeningProps) {
  return (
    <section
      className="rounded-[1.5rem] border border-brand-border/70 bg-brand-panel p-5 shadow-brand-card"
      data-testid="dashboard-whats-happening"
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-text-muted">
          What&rsquo;s happening
        </p>
        {!loading && (
          <Link
            href={latestReportHref}
            className="flex items-center gap-1 text-[12px] font-semibold text-brand-accent-blue transition hover:text-blue-300"
          >
            View full report
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <SkeletonBlock className="h-5 w-4/5 bg-brand-border/40" />
            <SkeletonBlock className="h-4 w-3/5 bg-brand-border/30" />
          </div>
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-[10px] bg-brand-panel-muted px-3.5 py-3"
            >
              <SkeletonBlock className="h-3 w-14 bg-brand-border/40" />
              <SkeletonBlock className="mt-2 h-4 w-full bg-brand-border/35" />
              <SkeletonBlock className="mt-1.5 h-4 w-4/5 bg-brand-border/25" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Headline summary */}
          {headline ? (
            <p className="text-[14px] font-medium leading-relaxed text-brand-text-primary">
              {headline}
            </p>
          ) : (
            <p className="text-[13px] italic text-brand-text-muted">
              Run a report to see your creator intelligence summary.
            </p>
          )}

          {/* Signal rows — panel-muted cards matching HeroCards insight row style */}
          {signals.length > 0 && (
            <div className="flex flex-col gap-2" role="list" aria-label="Key signals">
              {signals.slice(0, 3).map((signal) => {
                const cfg = toneConfig[signal.tone];
                return (
                  <div
                    key={signal.id}
                    role="listitem"
                    className="flex items-start justify-between gap-3 rounded-[10px] bg-brand-panel-muted px-3.5 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.10em] text-brand-text-muted">
                        {signal.title}
                      </p>
                      <p className="mt-0.5 text-[13px] font-medium leading-relaxed text-brand-text-secondary">
                        {signal.body}
                      </p>
                    </div>
                    <span
                      className="mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                      style={{
                        background: cfg.pillBg,
                        border: `1px solid ${cfg.pillBorder}`,
                        color: cfg.pillColor,
                      }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Audience rows */}
          {audienceRows.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.20em] text-brand-text-muted">
                Audience
              </p>
              <div className="flex flex-col gap-2">
                {audienceRows.slice(0, 2).map((row) => (
                  <div
                    key={row.platform}
                    className="flex items-center justify-between rounded-[10px] bg-brand-panel-muted px-3.5 py-2.5"
                  >
                    <span className="text-[13px] font-semibold text-brand-text-primary">
                      {row.platform}
                    </span>
                    <span className="flex items-center gap-2">
                      <span
                        className="text-[13px] font-bold"
                        style={{ color: "var(--es-color-accent-emerald)" }}
                      >
                        {formatFollowers(row.followersGained)} followers
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] text-brand-text-muted"
                        style={{
                          background: "rgba(148,163,184,0.10)",
                          border: "1px solid rgba(148,163,184,0.18)",
                        }}
                      >
                        {row.period}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
