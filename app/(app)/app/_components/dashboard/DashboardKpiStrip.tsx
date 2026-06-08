"use client";

import { useEffect, useRef, useState } from "react";
import { SkeletonBlock } from "../../../_components/ui/skeleton";

// ── Arc constants ────────────────────────────────────────────────────────────
// Semicircle: center (100, 96), r=74, viewBox "0 0 200 100"
// Arc from left (26,96) counter-clockwise through top (100,22) to right (174,96)
const GAUGE_R = 74;
const GAUGE_CX = 100;
const GAUGE_CY = 96;
const ARC_PATH = `M ${GAUGE_CX - GAUGE_R} ${GAUGE_CY} A ${GAUGE_R} ${GAUGE_R} 0 0 0 ${GAUGE_CX + GAUGE_R} ${GAUGE_CY}`;
const ARC_LENGTH = Math.PI * GAUGE_R; // ≈ 232.5

// ── Count-up animation hook ──────────────────────────────────────────────────

function useCountUp(target: number | null, duration = 500): number | null {
  const [value, setValue] = useState<number | null>(null);
  const prevTarget = useRef<number | null>(null);

  useEffect(() => {
    if (target === null) {
      setValue(null);
      prevTarget.current = null;
      return;
    }
    if (prevTarget.current === target) return;
    prevTarget.current = target;

    const start = performance.now();
    let frame: number;

    function animate(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target! * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        setValue(target!);
      }
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

// ── EarnScore gauge ──────────────────────────────────────────────────────────

function scoreColorClass(score: number | null): string {
  if (score === null) return "text-brand-text-muted";
  if (score >= 85) return "text-emerald-300";
  if (score >= 70) return "text-blue-300";
  if (score >= 55) return "text-amber-300";
  return "text-rose-300";
}

function scoreLabel(score: number | null, stateLabel: string | null): string {
  if (score === null) return "Run a report to unlock";
  if (stateLabel) return "Provisional";
  if (score >= 85) return "Strong";
  if (score >= 70) return "Healthy";
  if (score >= 55) return "Mixed — watch closely";
  return "At risk";
}

type EarnScoreGaugeProps = {
  score: number | null;
  stateLabel: string | null;
  loading: boolean;
};

function EarnScoreGauge({ score, stateLabel, loading }: EarnScoreGaugeProps) {
  const [fillOffset, setFillOffset] = useState(ARC_LENGTH);

  useEffect(() => {
    if (score !== null && !loading) {
      const id = requestAnimationFrame(() => {
        setFillOffset(ARC_LENGTH * (1 - score / 100));
      });
      return () => cancelAnimationFrame(id);
    } else {
      setFillOffset(ARC_LENGTH);
    }
    return undefined;
  }, [score, loading]);

  const colorClass = scoreColorClass(score);
  const label = scoreLabel(score, stateLabel);

  return (
    <article
      className="relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-brand-border-strong/80 bg-[linear-gradient(145deg,rgba(8,20,48,0.98),rgba(13,34,72,0.97),rgba(15,30,62,0.98))] p-5 shadow-brand-glow"
      data-testid="dashboard-earnscore-gauge"
    >
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute -left-14 -top-12 h-52 w-52 rounded-full bg-brand-accent-blue/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-4 h-44 w-44 rounded-full bg-emerald-500/7 blur-3xl" />

      <p className="relative text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-text-secondary">
        EarnScore
      </p>

      <div className="relative mt-1 flex flex-1 flex-col items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <SkeletonBlock className="h-[68px] w-[148px] rounded-full bg-brand-border/45" />
            <SkeletonBlock className="h-10 w-12 bg-brand-border/40" />
            <SkeletonBlock className="h-3.5 w-24 bg-brand-border/30" />
          </div>
        ) : (
          <>
            {/* Arc gauge */}
            <svg
              viewBox="0 0 200 100"
              className="w-full max-w-[200px]"
              role="img"
              aria-label={score !== null ? `EarnScore: ${Math.round(score)} out of 100` : "EarnScore not yet available"}
            >
              <defs>
                {/* Gradient fill: rose → amber → blue → emerald */}
                <linearGradient id="es-fill-grad" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%"   stopColor="rgb(251,113,133)" />
                  <stop offset="36%"  stopColor="rgb(251,191,36)"  />
                  <stop offset="66%"  stopColor="rgb(96,165,250)"  />
                  <stop offset="100%" stopColor="rgb(52,211,153)"  />
                </linearGradient>
                {/* Subtle glow on the active arc */}
                <filter id="es-arc-glow" x="-20%" y="-60%" width="140%" height="220%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Background track */}
              <path
                d={ARC_PATH}
                fill="none"
                stroke="rgba(255,255,255,0.07)"
                strokeWidth={11}
                strokeLinecap="round"
              />

              {/* Active fill arc */}
              {score !== null && (
                <path
                  d={ARC_PATH}
                  fill="none"
                  stroke="url(#es-fill-grad)"
                  strokeWidth={11}
                  strokeLinecap="round"
                  strokeDasharray={`${ARC_LENGTH} ${ARC_LENGTH}`}
                  strokeDashoffset={fillOffset}
                  filter="url(#es-arc-glow)"
                  style={{ transition: "stroke-dashoffset 0.85s cubic-bezier(0.34,1.56,0.64,1)" }}
                />
              )}
            </svg>

            {/* Score number + label */}
            <div className="-mt-1 text-center">
              {score !== null ? (
                <p className={`text-5xl font-semibold leading-none tracking-tight ${colorClass}`}>
                  {Math.round(score)}
                </p>
              ) : (
                <p className="text-3xl font-semibold text-brand-text-muted">—</p>
              )}
              <p className="mt-2 text-sm text-brand-text-secondary">{label}</p>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

// ── Metric KPI card ──────────────────────────────────────────────────────────

function deltaColorClass(deltaText: string | null | undefined): string {
  if (!deltaText) return "text-brand-text-muted";
  const t = deltaText.toLowerCase();
  if (t.includes("up") || t.startsWith("+")) return "text-emerald-300";
  if (t.includes("down") || t.startsWith("-")) return "text-amber-300";
  return "text-brand-text-muted";
}

type MetricKpiCardProps = {
  label: string;
  value: string;
  deltaText?: string | null;
  loading: boolean;
  testId?: string;
};

function MetricKpiCard({ label, value, deltaText, loading, testId }: MetricKpiCardProps) {
  const dColor = deltaColorClass(deltaText);
  return (
    <article
      className="flex h-full flex-col justify-between rounded-[1.35rem] border border-brand-border/70 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(20,44,88,0.86),rgba(16,32,67,0.94))] p-5 shadow-brand-card"
      data-testid={testId}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text-secondary">{label}</p>
      {loading ? (
        <div className="mt-4 space-y-2">
          <SkeletonBlock className="h-9 w-28 bg-brand-border/55" />
          <SkeletonBlock className="h-3.5 w-20 bg-brand-border/40" />
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-3xl font-semibold tracking-tight text-brand-text-primary md:text-4xl">{value}</p>
          {deltaText ? (
            <p className={`mt-2 text-sm font-medium ${dColor}`}>{deltaText}</p>
          ) : (
            <p className="mt-2 text-sm text-brand-text-muted">Latest report baseline</p>
          )}
        </div>
      )}
    </article>
  );
}

// ── Tax coming-soon card ─────────────────────────────────────────────────────

function TaxComingSoonCard() {
  return (
    <article
      className="relative flex h-full flex-col justify-between overflow-hidden rounded-[1.35rem] border border-brand-border/50 bg-[linear-gradient(155deg,rgba(12,24,52,0.90),rgba(16,32,67,0.80))] p-5 shadow-brand-card"
      data-testid="dashboard-kpi-tax"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">Est. Tax Liability</p>
      <div className="mt-4">
        {/* Frosted placeholder */}
        <div className="relative inline-block select-none">
          <p className="text-3xl font-semibold tracking-tight text-brand-text-primary opacity-[0.15] blur-[7px] md:text-4xl">
            $4,200
          </p>
          <div className="absolute inset-0 flex items-center justify-start">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border-strong/55 bg-brand-panel/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text-secondary backdrop-blur-sm">
              <svg viewBox="0 0 16 16" className="h-3 w-3 flex-shrink-0 fill-current opacity-60" aria-hidden="true">
                <path d="M8 1a4 4 0 0 1 4 4v1h.5A1.5 1.5 0 0 1 14 7.5v6A1.5 1.5 0 0 1 12.5 15h-9A1.5 1.5 0 0 1 2 13.5v-6A1.5 1.5 0 0 1 3.5 6H4V5a4 4 0 0 1 4-4zm0 1.5A2.5 2.5 0 0 0 5.5 5v1h5V5A2.5 2.5 0 0 0 8 2.5z" />
              </svg>
              Coming soon
            </span>
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-brand-text-muted">
          Accurate estimates based on your actual income data.
        </p>
      </div>
    </article>
  );
}

// ── DashboardKpiStrip ────────────────────────────────────────────────────────

function formatRevenue(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatSubscribers(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

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
  const animatedRevenue = useCountUp(netRevenue);
  const animatedSubscribers = useCountUp(subscribers);

  return (
    <section
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[1.7fr_1fr_1fr_1fr]"
      data-testid="dashboard-kpi-strip"
    >
      <EarnScoreGauge score={earnScore} stateLabel={earnScoreStateLabel} loading={loading} />
      <MetricKpiCard
        label="Net Revenue"
        value={formatRevenue(animatedRevenue ?? netRevenue)}
        deltaText={revenueDeltaText}
        loading={loading}
        testId="dashboard-kpi-revenue"
      />
      <MetricKpiCard
        label="Paid Subscribers"
        value={formatSubscribers(animatedSubscribers ?? subscribers)}
        deltaText={subscriberDeltaText}
        loading={loading}
        testId="dashboard-kpi-subscribers"
      />
      <TaxComingSoonCard />
    </section>
  );
}
