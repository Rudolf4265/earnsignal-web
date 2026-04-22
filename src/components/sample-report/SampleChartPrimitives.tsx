import { cn } from "@earnsigma/ui";

/* ── Revenue bar chart ──────────────────────────────────────────── */
type RevenueBarChartProps = {
  bars: readonly number[];
  highlightLastN?: number;
  className?: string;
};

export function RevenueBarChart({ bars, highlightLastN = 3, className }: RevenueBarChartProps) {
  const maxH = Math.max(...bars);
  return (
    <div
      className={cn("flex items-end gap-1", className)}
      role="img"
      aria-label="Monthly revenue trend bar chart"
    >
      {bars.map((h, i) => (
        <div
          key={i}
          className={cn(
            "flex-1 rounded-t-sm",
            i >= bars.length - highlightLastN
              ? "bg-brand-accent-blue"
              : "bg-brand-accent-blue/35",
          )}
          style={{ height: `${(h / maxH) * 100}%` }}
          title={`Month ${i + 1}: $${h.toLocaleString()}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/* ── Sparkline bar chart (small inline version) ─────────────────── */
type SparklineProps = {
  bars: readonly number[];
  accentColor?: string;
  className?: string;
  ariaLabel?: string;
};

export function Sparkline({ bars, accentColor = "var(--es-color-accent-blue)", className, ariaLabel }: SparklineProps) {
  const mn = Math.min(...bars);
  const mx = Math.max(...bars);
  return (
    <div
      className={cn("flex items-end gap-0.5", className)}
      role="img"
      aria-label={ariaLabel ?? "Sparkline chart"}
    >
      {bars.map((h, i) => {
        const pct = mx === mn ? 50 : ((h - mn) / (mx - mn)) * 75 + 25;
        const isLast = i === bars.length - 1;
        return (
          <div
            key={i}
            className="flex-1 rounded-t-[2px]"
            style={{
              height: `${pct}%`,
              backgroundColor: accentColor,
              opacity: isLast ? 1 : 0.4,
            }}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

/* ── Platform donut ring (SVG, 3 slices) ────────────────────────── */
type DonutSlice = {
  pct: number;
  color: string;
  label: string;
};

type PlatformDonutRingProps = {
  slices: DonutSlice[];
  centerLabel: string;
  centerSublabel: string;
  className?: string;
};

export function PlatformDonutRing({
  slices,
  centerLabel,
  centerSublabel,
  className,
}: PlatformDonutRingProps) {
  const r = 76;
  const cx = 100;
  const cy = 100;
  const circ = 2 * Math.PI * r;
  let cumulative = 0;

  return (
    <svg
      viewBox="0 0 200 200"
      className={cn("w-full", className)}
      role="img"
      aria-label={slices.map((s) => `${s.label}: ${s.pct}%`).join(", ")}
    >
      {slices.map((s, i) => {
        const offset = cumulative;
        cumulative += s.pct;
        const dash = (s.pct / 100) * circ;
        const angle = -90 + (offset / 100) * 360;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="26"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="butt"
            transform={`rotate(${angle} ${cx} ${cy})`}
          />
        );
      })}
      <text
        x={cx}
        y={cy - 7}
        textAnchor="middle"
        fill="var(--es-color-text-primary)"
        fontSize="22"
        fontWeight="700"
        fontFamily="inherit"
      >
        {centerLabel}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fill="var(--es-color-text-muted)"
        fontSize="12"
        fontFamily="inherit"
      >
        {centerSublabel}
      </text>
    </svg>
  );
}

/* ── Churn timing bar chart ─────────────────────────────────────── */
type ChurnTimingChartProps = {
  bars: readonly number[];
  highlightFirstN?: number;
  className?: string;
};

export function ChurnTimingChart({
  bars,
  highlightFirstN = 3,
  className,
}: ChurnTimingChartProps) {
  const maxH = Math.max(...bars);
  return (
    <div
      className={cn("flex items-end gap-1", className)}
      role="img"
      aria-label="Churn timing by month of membership — most cancellations occur in months 2 and 3"
    >
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex flex-1 flex-col items-center gap-1"
        >
          <div
            className="w-full rounded-t-sm"
            style={{
              height: `${(h / maxH) * 100}%`,
              backgroundColor:
                i < highlightFirstN
                  ? "var(--es-color-accent-blue)"
                  : "rgba(59,130,246,0.3)",
            }}
            title={`Month ${i + 1}: ${h} cancellations`}
            aria-hidden="true"
          />
          <span className="text-[9px] text-brand-text-muted">{i + 1}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Lorenz curve SVG ───────────────────────────────────────────── */
type LorenzCurveProps = {
  points: Array<[number, number]>;
  annotated?: Array<[number, number, string]>;
  className?: string;
};

export function LorenzCurve({ points, annotated = [], className }: LorenzCurveProps) {
  const W = 400;
  const H = 220;
  const tx = (p: number) => (p / 100) * W;
  const ty = (p: number) => H - (p / 100) * H;

  const pathD = points
    .map(([sx, sy], i) => `${i === 0 ? "M" : "L"}${tx(sx)},${ty(sy)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H + 24}`}
      className={cn("w-full", className)}
      role="img"
      aria-label="Lorenz curve showing revenue concentration: top 5% drive 46%, top 20% drive 74%, top 50% drive 91%"
    >
      {/* Equality line */}
      <line
        x1="0"
        y1={H}
        x2={W}
        y2="0"
        stroke="rgba(148,163,184,0.2)"
        strokeWidth="1"
        strokeDasharray="6 4"
      />
      {/* Fill area under curve */}
      <path
        d={`${pathD} L${W},${H} L0,${H} Z`}
        fill="rgba(59,130,246,0.1)"
      />
      {/* Curve stroke */}
      <path
        d={pathD}
        fill="none"
        stroke="var(--es-color-accent-blue)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Annotated data points */}
      {annotated.map(([sx, sy, label], i) => (
        <g key={i}>
          <circle
            cx={tx(sx)}
            cy={ty(sy)}
            r="4.5"
            fill="var(--es-color-accent-teal)"
            stroke="var(--es-color-bg)"
            strokeWidth="2"
          />
          <text
            x={tx(sx) + (sx < 50 ? 8 : -8)}
            y={ty(sy) - 8}
            fill="var(--es-color-text-secondary)"
            fontSize="10"
            fontFamily="inherit"
            textAnchor={sx < 50 ? "start" : "end"}
          >
            {label}
          </text>
        </g>
      ))}
      {/* Axis labels */}
      <text x="0" y={H + 20} fill="var(--es-color-text-muted)" fontSize="10" fontFamily="inherit">
        0%
      </text>
      <text
        x={W}
        y={H + 20}
        fill="var(--es-color-text-muted)"
        fontSize="10"
        fontFamily="inherit"
        textAnchor="end"
      >
        100% of supporters
      </text>
    </svg>
  );
}

/* ── Sub-score meter bar ────────────────────────────────────────── */
type SubScoreBarProps = {
  label: string;
  score: number;
  note: string;
};

export function SubScoreBar({ label, score, note }: SubScoreBarProps) {
  const meterColor =
    score >= 70
      ? "var(--es-color-accent-emerald)"
      : score >= 50
        ? "var(--es-color-accent-blue)"
        : "#fbbf24";

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-brand-text-primary">{label}</p>
        <span className="shrink-0 text-sm font-semibold text-white">{score}/100</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-brand-panel-muted/80">
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, backgroundColor: meterColor }}
          aria-hidden="true"
        />
      </div>
      <p className="mt-1 text-xs text-brand-text-muted">{note}</p>
    </div>
  );
}

/* ── Difficulty dot indicator ───────────────────────────────────── */
type DifficultyDotsProps = {
  level: 1 | 2 | 3;
};

export function DifficultyDots({ level }: DifficultyDotsProps) {
  return (
    <div
      className="flex gap-1.5"
      role="img"
      aria-label={`Difficulty: ${level} out of 3`}
    >
      {[1, 2, 3].map((d) => (
        <div
          key={d}
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor:
              d <= level
                ? "var(--es-color-accent-blue)"
                : "rgba(59,130,246,0.18)",
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
