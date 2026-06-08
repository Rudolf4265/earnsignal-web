"use client";

import Link from "next/link";
import { SkeletonBlock } from "../../../_components/ui/skeleton";

// ── Types mirrored from SignalsPanel ────────────────────────────────────────
type SignalTone = "positive" | "warning" | "risk" | "neutral";

export type WhatsHappeningSignal = {
  id: string;
  tone: SignalTone;
  title: string;
  body: string;
};

export type AudienceRow = {
  platform: string; // "Instagram" | "TikTok" | …
  followersGained: number;
  period: string; // e.g. "Apr 2025"
};

export type DashboardWhatsHappeningProps = {
  headline: string | null;
  signals: WhatsHappeningSignal[];
  audienceRows: AudienceRow[];
  latestReportHref: string;
  loading: boolean;
};

// ── Tone → border + label color ─────────────────────────────────────────────
function toneClasses(tone: SignalTone): { border: string; label: string; dot: string } {
  switch (tone) {
    case "positive":
      return { border: "border-l-emerald-400", label: "text-emerald-300", dot: "bg-emerald-400" };
    case "warning":
      return { border: "border-l-amber-400", label: "text-amber-300", dot: "bg-amber-400" };
    case "risk":
      return { border: "border-l-rose-400", label: "text-rose-300", dot: "bg-rose-400" };
    case "neutral":
    default:
      return { border: "border-l-slate-600", label: "text-brand-text-muted", dot: "bg-slate-500" };
  }
}

function toneLabel(tone: SignalTone): string {
  switch (tone) {
    case "positive":
      return "Positive";
    case "warning":
      return "Watch";
    case "risk":
      return "Risk";
    case "neutral":
    default:
      return "Note";
  }
}

function formatFollowers(n: number): string {
  if (n >= 1000) return `+${(n / 1000).toFixed(1)}k`;
  return n > 0 ? `+${n}` : `${n}`;
}

// ── Component ────────────────────────────────────────────────────────────────

export function DashboardWhatsHappening({
  headline,
  signals,
  audienceRows,
  latestReportHref,
  loading,
}: DashboardWhatsHappeningProps) {
  return (
    <section
      className="rounded-[1.5rem] border border-brand-border/80 bg-[linear-gradient(150deg,rgba(13,28,62,0.96),rgba(18,38,76,0.90),rgba(13,28,62,0.96))] p-6 shadow-brand-card"
      data-testid="dashboard-whats-happening"
    >
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
          What&rsquo;s happening
        </p>
        {!loading && (
          <Link
            href={latestReportHref}
            className="text-xs font-medium text-brand-accent-blue hover:text-blue-300 hover:underline transition-colors"
          >
            View full report →
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-5">
          {/* Headline skeleton */}
          <div className="space-y-2">
            <SkeletonBlock className="h-5 w-3/4 bg-brand-border/55" />
            <SkeletonBlock className="h-4 w-1/2 bg-brand-border/40" />
          </div>
          {/* Signal skeletons */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 border-l-2 border-brand-border/30 pl-4">
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-3.5 w-16 bg-brand-border/50" />
                <SkeletonBlock className="h-4 w-full bg-brand-border/40" />
                <SkeletonBlock className="h-4 w-4/5 bg-brand-border/35" />
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

          {/* Signal bullets — up to 3 */}
          {signals.length > 0 && (
            <ul className="space-y-4" aria-label="Key signals">
              {signals.slice(0, 3).map((signal) => {
                const tc = toneClasses(signal.tone);
                return (
                  <li
                    key={signal.id}
                    className={`border-l-2 ${tc.border} pl-4`}
                  >
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${tc.label}`}>
                      {toneLabel(signal.tone)}
                    </p>
                    <p className="mt-1 text-sm font-medium leading-snug text-brand-text-primary">
                      {signal.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-brand-text-secondary">
                      {signal.body}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Audience signal rows — up to 2, compact */}
          {audienceRows.length > 0 && (
            <div className="space-y-2" aria-label="Audience signals">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                Audience
              </p>
              {audienceRows.slice(0, 2).map((row) => (
                <div
                  key={row.platform}
                  className="flex items-center justify-between rounded-xl border border-brand-border/50 bg-brand-panel/50 px-4 py-2.5 text-sm"
                >
                  <span className="font-medium text-brand-text-primary">{row.platform}</span>
                  <span className="flex items-center gap-2 text-brand-text-secondary">
                    <span className="font-semibold text-emerald-300">
                      {formatFollowers(row.followersGained)} followers
                    </span>
                    <span className="text-brand-text-muted">{row.period}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
