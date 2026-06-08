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

const toneMap: Record<SignalTone, { border: string; pill: string; label: string; dot: string }> = {
  positive: {
    border: "border-l-emerald-400",
    pill:   "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    label:  "Positive",
    dot:    "bg-emerald-400",
  },
  warning: {
    border: "border-l-amber-400",
    pill:   "border-amber-500/40 bg-amber-500/10 text-amber-300",
    label:  "Watch",
    dot:    "bg-amber-400",
  },
  risk: {
    border: "border-l-rose-400",
    pill:   "border-rose-500/40 bg-rose-500/10 text-rose-300",
    label:  "Risk",
    dot:    "bg-rose-400",
  },
  neutral: {
    border: "border-l-slate-600",
    pill:   "border-slate-600/40 bg-slate-600/10 text-brand-text-muted",
    label:  "Note",
    dot:    "bg-slate-500",
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
      className="relative overflow-hidden rounded-[1.5rem] border border-brand-border/70 bg-[linear-gradient(150deg,rgba(10,24,56,0.97),rgba(16,38,80,0.92),rgba(10,24,56,0.97))] shadow-[0_0_40px_rgba(10,24,64,0.5),0_1px_0_rgba(255,255,255,0.03)_inset]"
      data-testid="dashboard-whats-happening"
    >
      {/* Ambient blob */}
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-600/5 blur-3xl" />

      <div className="relative p-6">
        {/* Header row */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
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
          <div className="space-y-5">
            <div className="space-y-2">
              <SkeletonBlock className="h-5 w-4/5 bg-brand-border/40" />
              <SkeletonBlock className="h-4 w-3/5 bg-brand-border/30" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 border-l-2 border-brand-border/25 pl-4">
                <div className="flex-1 space-y-2">
                  <SkeletonBlock className="h-3 w-14 bg-brand-border/40" />
                  <SkeletonBlock className="h-4 w-full bg-brand-border/35" />
                  <SkeletonBlock className="h-4 w-4/5 bg-brand-border/25" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Headline */}
            {headline ? (
              <p className="text-[15px] font-medium leading-relaxed text-brand-text-primary">
                {headline}
              </p>
            ) : (
              <p className="text-sm italic text-brand-text-muted">
                Run a report to see your creator intelligence summary.
              </p>
            )}

            {/* Signal bullets */}
            {signals.length > 0 && (
              <ul className="space-y-4" aria-label="Key signals">
                {signals.slice(0, 3).map((signal) => {
                  const t = toneMap[signal.tone];
                  return (
                    <li key={signal.id} className={`border-l-[3px] ${t.border} pl-4`}>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${t.pill}`}
                      >
                        <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${t.dot}`} aria-hidden="true" />
                        {t.label}
                      </span>
                      <p className="mt-1.5 text-[13px] font-semibold leading-snug text-brand-text-primary">
                        {signal.title}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-brand-text-secondary">
                        {signal.body}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Audience rows */}
            {audienceRows.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.20em] text-brand-text-muted">
                  Audience
                </p>
                <div className="space-y-2">
                  {audienceRows.slice(0, 2).map((row) => (
                    <div
                      key={row.platform}
                      className="flex items-center justify-between rounded-xl border border-brand-border/40 bg-brand-panel/40 px-4 py-2.5"
                    >
                      <span className="text-[13px] font-semibold text-brand-text-primary">{row.platform}</span>
                      <span className="flex items-center gap-2.5">
                        <span className="text-[13px] font-bold text-emerald-300">
                          {formatFollowers(row.followersGained)} followers
                        </span>
                        <span className="rounded-full bg-brand-border/40 px-2 py-0.5 text-[11px] text-brand-text-muted">
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
      </div>
    </section>
  );
}
