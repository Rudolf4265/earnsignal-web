"use client";

import { useEffect, useRef, useState } from "react";
import { SkeletonBlock } from "../../../_components/ui/skeleton";

// ── Arc constants ────────────────────────────────────────────────────────────
const GAUGE_R = 76;
const GAUGE_CX = 100;
const GAUGE_CY = 98;
// Semicircle: left → CCW through top → right (sweep-flag=0 in SVG = CCW on screen = arc through top)
const ARC_PATH = `M ${GAUGE_CX - GAUGE_R} ${GAUGE_CY} A ${GAUGE_R} ${GAUGE_R} 0 0 0 ${GAUGE_CX + GAUGE_R} ${GAUGE_CY}`;
const ARC_LENGTH = Math.PI * GAUGE_R; // ≈ 238.8

// ── Count-up animation hook ──────────────────────────────────────────────────

function useCountUp(target: number | null, duration = 520): number | null {
  const [value, setValue] = useState<number | null>(null);
  const prevTarget = useRef<number | null>(null);

  useEffect(() => {
    if (target === null) { setValue(null); prevTarget.current = null; return; }
    if (prevTarget.current === target) return;
    prevTarget.current = target;

    const start = performance.now();
    let frame: number;

    function animate(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target! * eased));
      if (progress < 1) { frame = requestAnimationFrame(animate); }
      else { setValue(target!); }
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

// ── Score helpers ────────────────────────────────────────────────────────────

function scoreColor(score: number | null) {
  if (score === null) return { text: "text-brand-text-muted", glow: "transparent", stop: "#64748b" };
  if (score >= 85) return { text: "text-emerald-300", glow: "rgba(52,211,153,0.45)", stop: "#34d399" };
  if (score >= 70) return { text: "text-blue-300",    glow: "rgba(96,165,250,0.45)", stop: "#60a5fa" };
  if (score >= 55) return { text: "text-amber-300",   glow: "rgba(251,191,36,0.40)", stop: "#fbbf24" };
  return            { text: "text-rose-300",    glow: "rgba(251,113,133,0.40)", stop: "#fb7185" };
}

function scoreLabel(score: number | null, stateLabel: string | null): string {
  if (score === null) return "Run a report to unlock";
  if (stateLabel) return stateLabel;
  if (score >= 85) return "Strong";
  if (score >= 70) return "Healthy";
  if (score >= 55) return "Mixed — watch closely";
  return "At risk";
}

// ── EarnScore gauge ──────────────────────────────────────────────────────────

type EarnScoreGaugeProps = {
  score: number | null;
  stateLabel: string | null;
  loading: boolean;
};

function EarnScoreGauge({ score, stateLabel, loading }: EarnScoreGaugeProps) {
  const [fillOffset, setFillOffset] = useState(ARC_LENGTH);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);

    if (score === null || loading) {
      setFillOffset(ARC_LENGTH);
      return;
    }

    const targetOffset = ARC_LENGTH * (1 - score / 100);
    const startTime = performance.now();
    const duration = 950;

    function animate(now: number) {
      const t = Math.min((now - startTime) / duration, 1);
      // spring-like: easeOutCubic with slight overshoot
      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setFillOffset(ARC_LENGTH + (targetOffset - ARC_LENGTH) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    }

    // Tiny delay so element mounts before animation begins
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(animate);
    });

    return () => { if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current); };
  }, [score, loading]);

  const sc = scoreColor(score);
  const label = scoreLabel(score, stateLabel);

  return (
    <article
      className="relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-brand-border-strong/60 bg-[linear-gradient(145deg,rgba(6,16,40,0.99),rgba(10,26,62,0.98),rgba(8,20,52,0.99))] p-6 shadow-[0_0_40px_rgba(14,30,72,0.6),0_1px_0_rgba(255,255,255,0.04)_inset]"
      data-testid="dashboard-earnscore-gauge"
    >
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-emerald-500/8 blur-3xl" />

      <p className="relative text-[10px] font-bold uppercase tracking-[0.22em] text-brand-text-muted">
        EarnScore
      </p>

      <div className="relative mt-2 flex flex-1 flex-col items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <SkeletonBlock className="h-[80px] w-[180px] rounded-full bg-brand-border/35" />
            <SkeletonBlock className="h-12 w-14 bg-brand-border/30" />
            <SkeletonBlock className="h-3.5 w-28 bg-brand-border/25" />
          </div>
        ) : (
          <>
            {/* SVG gauge — drop-shadow applied via CSS on the wrapper */}
            <div style={{ filter: score !== null ? `drop-shadow(0 0 12px ${sc.glow})` : "none" }}>
              <svg
                viewBox="0 0 200 100"
                className="w-full max-w-[230px]"
                role="img"
                aria-label={score !== null ? `EarnScore: ${Math.round(score)} out of 100` : "EarnScore not available"}
              >
                <defs>
                  <linearGradient id="es-grad" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%"   stopColor="#fb7185" stopOpacity="1" />
                    <stop offset="33%"  stopColor="#fbbf24" stopOpacity="1" />
                    <stop offset="66%"  stopColor="#60a5fa" stopOpacity="1" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="1" />
                  </linearGradient>
                </defs>

                {/* Outer halo track — very subtle depth */}
                <path
                  d={ARC_PATH}
                  fill="none"
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth={24}
                  strokeLinecap="round"
                />

                {/* Background track */}
                <path
                  d={ARC_PATH}
                  fill="none"
                  stroke="rgba(255,255,255,0.10)"
                  strokeWidth={16}
                  strokeLinecap="round"
                />

                {/* Active fill arc — no filter here, drop-shadow on wrapper div instead */}
                {score !== null && (
                  <path
                    d={ARC_PATH}
                    fill="none"
                    stroke="url(#es-grad)"
                    strokeWidth={16}
                    strokeLinecap="round"
                    strokeDasharray={`${ARC_LENGTH} ${ARC_LENGTH}`}
                    strokeDashoffset={fillOffset}
                  />
                )}
              </svg>
            </div>

            {/* Score + label — positioned to overlap the arc's open bottom */}
            <div className="-mt-4 text-center">
              {score !== null ? (
                <p
                  className={`text-[52px] font-semibold leading-none tracking-tight ${sc.text}`}
                  style={{ textShadow: `0 0 24px ${sc.glow}` }}
                >
                  {Math.round(score)}
                </p>
              ) : (
                <p className="text-4xl font-semibold text-brand-text-muted">—</p>
              )}
              <p className="mt-2 text-[13px] font-medium text-brand-text-secondary">{label}</p>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

// ── Delta helpers ────────────────────────────────────────────────────────────

function parseDelta(deltaText: string | null | undefined): { dir: "up" | "down" | "flat"; display: string } {
  if (!deltaText) return { dir: "flat", display: "No prior baseline" };
  const t = deltaText.toLowerCase();
  if (t.includes("up") || t.startsWith("+")) return { dir: "up", display: deltaText };
  if (t.includes("down") || t.startsWith("-")) return { dir: "down", display: deltaText };
  if (t.startsWith("flat 0")) return { dir: "flat", display: "No change vs prior report" };
  return { dir: "flat", display: deltaText };
}

const deltaConfig = {
  up:   { border: "border-t-emerald-400/70", text: "text-emerald-300", dot: "bg-emerald-400", arrow: "↑" },
  down: { border: "border-t-amber-400/70",   text: "text-amber-300",   dot: "bg-amber-400",   arrow: "↓" },
  flat: { border: "border-t-brand-border-strong/40", text: "text-brand-text-muted", dot: "bg-brand-text-muted", arrow: "→" },
};

// ── Metric KPI card ──────────────────────────────────────────────────────────

type MetricKpiCardProps = {
  label: string;
  value: string;
  deltaText?: string | null;
  loading: boolean;
  testId?: string;
};

function MetricKpiCard({ label, value, deltaText, loading, testId }: MetricKpiCardProps) {
  const { dir, display } = parseDelta(deltaText);
  const cfg = deltaConfig[dir];

  return (
    <article
      className={`relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-brand-border/60 bg-[linear-gradient(155deg,rgba(14,28,60,0.96),rgba(20,44,90,0.85),rgba(14,28,60,0.96))] shadow-[0_0_32px_rgba(14,28,64,0.5),0_1px_0_rgba(255,255,255,0.04)_inset] border-t-2 ${cfg.border}`}
      data-testid={testId}
    >
      {/* Top accent shimmer */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),transparent)]" />

      <div className="relative flex h-full flex-col justify-between p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.20em] text-brand-text-muted">{label}</p>

        {loading ? (
          <div className="mt-4 space-y-2">
            <SkeletonBlock className="h-10 w-28 bg-brand-border/45" />
            <SkeletonBlock className="h-3 w-24 bg-brand-border/35" />
          </div>
        ) : (
          <div className="mt-auto pt-5">
            <p className="text-[38px] font-semibold leading-none tracking-tight text-brand-text-primary">{value}</p>
            <p className={`mt-3 flex items-center gap-1.5 text-[12px] font-medium ${cfg.text}`}>
              <span className={`inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${cfg.dot}`} aria-hidden="true" />
              {display}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

// ── Tax coming-soon card ─────────────────────────────────────────────────────

function TaxComingSoonCard() {
  return (
    <article
      className="relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-brand-border/40 bg-[linear-gradient(155deg,rgba(10,20,44,0.96),rgba(14,28,60,0.88))] shadow-brand-card border-t-2 border-t-brand-border/30"
      data-testid="dashboard-kpi-tax"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.015),transparent)]" />

      <div className="relative flex h-full flex-col justify-between p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.20em] text-brand-text-muted">Est. Tax Liability</p>

        <div className="mt-auto pt-5">
          {/* Frosted placeholder number */}
          <div className="relative">
            <p className="select-none text-[38px] font-semibold leading-none tracking-tight text-brand-text-primary opacity-[0.12] blur-[8px]">
              $4,872
            </p>
            <div className="absolute inset-0 flex items-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border-strong/50 bg-brand-panel/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-text-secondary backdrop-blur-sm">
                <svg viewBox="0 0 16 16" className="h-3 w-3 flex-shrink-0 fill-current opacity-50" aria-hidden="true">
                  <path d="M8 1a4 4 0 0 1 4 4v1h.5A1.5 1.5 0 0 1 14 7.5v6A1.5 1.5 0 0 1 12.5 15h-9A1.5 1.5 0 0 1 2 13.5v-6A1.5 1.5 0 0 1 3.5 6H4V5a4 4 0 0 1 4-4zm0 1.5A2.5 2.5 0 0 0 5.5 5v1h5V5A2.5 2.5 0 0 0 8 2.5z" />
                </svg>
                Coming soon
              </span>
            </div>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-brand-text-muted">
            Accurate estimates based on your actual income data.
          </p>
        </div>
      </div>
    </article>
  );
}

// ── DashboardKpiStrip ────────────────────────────────────────────────────────

function fmt(currency: boolean) {
  return (v: number | null) => {
    if (v === null) return "—";
    return currency
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v)
      : new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);
  };
}
const fmtRevenue = fmt(true);
const fmtSubs = fmt(false);

export type DashboardKpiStripProps = {
  netRevenue: number | null;
  subscribers: number | null;
  earnScore: number | null;
  earnScoreStateLabel: string | null;
  revenueDeltaText?: string | null;
  subscriberDeltaText?: string | null;
  loading: boolean;
};

export function DashboardKpiStrip({
  netRevenue,
  subscribers,
  earnScore,
  earnScoreStateLabel,
  revenueDeltaText,
  subscriberDeltaText,
  loading,
}: DashboardKpiStripProps) {
  const animRevenue = useCountUp(netRevenue);
  const animSubs = useCountUp(subscribers);

  return (
    <section
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[1.8fr_1fr_1fr_1fr]"
      data-testid="dashboard-kpi-strip"
    >
      <EarnScoreGauge score={earnScore} stateLabel={earnScoreStateLabel} loading={loading} />
      <MetricKpiCard
        label="Net Revenue"
        value={fmtRevenue(animRevenue ?? netRevenue)}
        deltaText={revenueDeltaText}
        loading={loading}
        testId="dashboard-kpi-revenue"
      />
      <MetricKpiCard
        label="Paid Subscribers"
        value={fmtSubs(animSubs ?? subscribers)}
        deltaText={subscriberDeltaText}
        loading={loading}
        testId="dashboard-kpi-subscribers"
      />
      <TaxComingSoonCard />
    </section>
  );
}
