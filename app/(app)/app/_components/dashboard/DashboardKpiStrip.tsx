"use client";

import { useEffect, useRef, useState } from "react";
import { SkeletonBlock } from "../../../_components/ui/skeleton";

// ── Arc constants — matched exactly to HeroCards.tsx marketing gauge ──────────
// viewBox "0 0 200 115", path M 20 105 A 80 80 0 0 1 180 105, ARC_LEN = π×80 ≈ 252
const ARC_LEN = 252;

// ── Score color helpers ───────────────────────────────────────────────────────

type ScoreColors = {
  fill: string;
  pillBg: string;
  pillBorder: string;
  pillText: string;
  bandLabel: string;
};

function scoreColors(score: number | null): ScoreColors {
  if (score === null)
    return {
      fill: "rgba(148,163,184,0.35)",
      pillBg: "rgba(148,163,184,0.10)",
      pillBorder: "rgba(148,163,184,0.28)",
      pillText: "var(--es-color-text-muted)",
      bandLabel: "Run a report to unlock",
    };
  if (score >= 85)
    return {
      fill: "var(--es-color-accent-emerald)",
      pillBg: "rgba(52,211,153,0.14)",
      pillBorder: "rgba(52,211,153,0.30)",
      pillText: "var(--es-color-accent-emerald)",
      bandLabel: "Strong",
    };
  if (score >= 70)
    return {
      fill: "var(--es-color-accent-teal)",
      pillBg: "rgba(47,217,197,0.13)",
      pillBorder: "rgba(47,217,197,0.28)",
      pillText: "var(--es-color-accent-teal)",
      bandLabel: "Healthy",
    };
  if (score >= 55)
    return {
      fill: "#fbbf24",
      pillBg: "rgba(245,158,11,0.13)",
      pillBorder: "rgba(245,158,11,0.28)",
      pillText: "#fbbf24",
      bandLabel: "Mixed — watch closely",
    };
  return {
    fill: "#fb7185",
    pillBg: "rgba(251,113,133,0.13)",
    pillBorder: "rgba(251,113,133,0.28)",
    pillText: "#fb7185",
    bandLabel: "At risk",
  };
}

// ── EarnScore gauge ───────────────────────────────────────────────────────────

type EarnScoreGaugeProps = {
  score: number | null;
  stateLabel: string | null;
  loading: boolean;
};

function EarnScoreGauge({ score, stateLabel, loading }: EarnScoreGaugeProps) {
  const [gaugeValue, setGaugeValue] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (timerRef.current !== undefined) clearTimeout(timerRef.current);
    if (score === null || loading) {
      setGaugeValue(0);
      return;
    }
    // Same approach as HeroCards.tsx: delay 300ms then trigger CSS transition
    timerRef.current = setTimeout(() => {
      setGaugeValue(Math.round((ARC_LEN * score) / 100));
    }, 300);
    return () => {
      if (timerRef.current !== undefined) clearTimeout(timerRef.current);
    };
  }, [score, loading]);

  const sc = scoreColors(score);
  const displayScore = score !== null ? Math.round(score) : null;
  // stateLabel from backend ("Medium confidence") takes priority over band label
  const confidenceLabel = stateLabel ?? sc.bandLabel;

  return (
    <article
      className="relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-brand-border/70 bg-brand-panel p-5 shadow-brand-card"
      data-testid="dashboard-earnscore-gauge"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-text-muted">
        EarnScore
      </p>

      {loading ? (
        <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-3 py-4">
          <SkeletonBlock className="h-[80px] w-[180px] rounded-full bg-brand-border/35" />
          <SkeletonBlock className="h-8 w-14 bg-brand-border/30" />
          <SkeletonBlock className="h-3.5 w-28 bg-brand-border/25" />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center">
          {/* SVG gauge — identical arc path to HeroCards.tsx */}
          <svg
            viewBox="0 0 200 115"
            className="w-full max-w-[220px]"
            role="img"
            aria-label={
              displayScore !== null
                ? `EarnScore: ${displayScore} out of 100 — ${confidenceLabel}`
                : "EarnScore not yet available"
            }
          >
            {/* Track */}
            <path
              d="M 20 105 A 80 80 0 0 1 180 105"
              fill="none"
              stroke="var(--es-color-border)"
              strokeWidth="11"
              strokeLinecap="round"
            />
            {/* Fill — CSS transition, same as HeroCards.tsx */}
            <path
              d="M 20 105 A 80 80 0 0 1 180 105"
              fill="none"
              stroke={sc.fill}
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={`${gaugeValue} ${ARC_LEN}`}
              style={{ transition: "stroke-dasharray 1.9s cubic-bezier(0.4,0,0.2,1)" }}
            />
            {/* Score number + confidence label inside SVG, same layout as HeroCards */}
            <text
              x="100"
              y="88"
              textAnchor="middle"
              fontSize="44"
              fontWeight="700"
              fill="var(--es-color-text-primary)"
              fontFamily="Inter,system-ui,sans-serif"
            >
              {displayScore !== null ? String(displayScore) : "—"}
            </text>
            <text
              x="100"
              y="108"
              textAnchor="middle"
              fontSize="11"
              fill="var(--es-color-text-muted)"
              fontFamily="Inter,system-ui,sans-serif"
            >
              {confidenceLabel}
            </text>
          </svg>

          {/* Strength badge below gauge */}
          {displayScore !== null && (
            <div className="mt-3">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
                style={{
                  background: sc.pillBg,
                  border: `1px solid ${sc.pillBorder}`,
                  color: sc.pillText,
                }}
              >
                {sc.bandLabel}
              </span>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

// ── Delta pill helpers ────────────────────────────────────────────────────────

function parseDelta(deltaText: string | null | undefined): {
  dir: "up" | "down" | "flat";
  display: string;
} {
  if (!deltaText) return { dir: "flat", display: "No prior baseline" };
  const t = deltaText.toLowerCase();
  if (t.includes("up") || t.startsWith("+")) return { dir: "up", display: deltaText };
  if (t.includes("down") || t.startsWith("-")) return { dir: "down", display: deltaText };
  if (t.startsWith("flat 0")) return { dir: "flat", display: "No change vs prior report" };
  return { dir: "flat", display: deltaText };
}

const DELTA_PILL = {
  up:   { bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.28)",  color: "var(--es-color-accent-emerald)", prefix: "↑ " },
  down: { bg: "rgba(245,158,11,0.13)",  border: "rgba(245,158,11,0.28)",  color: "#fbbf24",                        prefix: "↓ " },
  flat: { bg: "rgba(148,163,184,0.10)", border: "rgba(148,163,184,0.22)", color: "var(--es-color-text-muted)",     prefix: "" },
} as const;

// ── Metric KPI card ───────────────────────────────────────────────────────────

type MetricKpiCardProps = {
  label: string;
  value: string;
  deltaText?: string | null;
  loading: boolean;
  testId?: string;
};

function MetricKpiCard({ label, value, deltaText, loading, testId }: MetricKpiCardProps) {
  const { dir, display } = parseDelta(deltaText);
  const pill = DELTA_PILL[dir];

  return (
    <article
      className="relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-brand-border/70 bg-brand-panel p-5 shadow-brand-card"
      data-testid={testId}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.20em] text-brand-text-muted">
        {label}
      </p>

      {loading ? (
        <div className="mt-4 space-y-3">
          <SkeletonBlock className="h-10 w-28 bg-brand-border/45" />
          <SkeletonBlock className="h-6 w-24 bg-brand-border/35" />
        </div>
      ) : (
        <div className="mt-3 flex flex-1 flex-col justify-between">
          <p className="text-[40px] font-semibold leading-none tracking-tight text-brand-text-primary">
            {value}
          </p>
          <span
            className="mt-4 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{
              background: pill.bg,
              border: `1px solid ${pill.border}`,
              color: pill.color,
            }}
          >
            {pill.prefix}
            {display}
          </span>
        </div>
      )}
    </article>
  );
}

// ── Tax coming-soon card ──────────────────────────────────────────────────────

function TaxComingSoonCard() {
  return (
    <article
      className="relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-brand-border/50 bg-brand-panel p-5 shadow-brand-card"
      data-testid="dashboard-kpi-tax"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.20em] text-brand-text-muted">
        Est. Tax Liability
      </p>

      <div className="mt-3 flex flex-1 flex-col justify-between">
        <div className="relative">
          <p
            className="select-none text-[40px] font-semibold leading-none tracking-tight text-brand-text-primary"
            style={{ opacity: 0.12, filter: "blur(8px)" }}
          >
            $4,872
          </p>
          <div className="absolute inset-0 flex items-center">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{
                background: "rgba(96,165,250,0.10)",
                border: "1px solid rgba(96,165,250,0.22)",
                color: "#60a5fa",
              }}
            >
              <svg
                viewBox="0 0 16 16"
                className="h-3 w-3 flex-shrink-0 fill-current"
                style={{ opacity: 0.7 }}
                aria-hidden="true"
              >
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
    </article>
  );
}

// ── Formatters ────────────────────────────────────────────────────────────────

function fmt(currency: boolean) {
  return (v: number | null) => {
    if (v === null) return "—";
    return currency
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(v)
      : new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);
  };
}
const fmtRevenue = fmt(true);
const fmtSubs = fmt(false);

// ── DashboardKpiStrip ─────────────────────────────────────────────────────────

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
  return (
    <section
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1.8fr_1fr_1fr_1fr]"
      data-testid="dashboard-kpi-strip"
    >
      <EarnScoreGauge
        score={earnScore}
        stateLabel={earnScoreStateLabel}
        loading={loading}
      />
      <MetricKpiCard
        label="Net Revenue"
        value={fmtRevenue(netRevenue)}
        deltaText={revenueDeltaText}
        loading={loading}
        testId="dashboard-kpi-revenue"
      />
      <MetricKpiCard
        label="Paid Subscribers"
        value={fmtSubs(subscribers)}
        deltaText={subscriberDeltaText}
        loading={loading}
        testId="dashboard-kpi-subscribers"
      />
      <TaxComingSoonCard />
    </section>
  );
}
