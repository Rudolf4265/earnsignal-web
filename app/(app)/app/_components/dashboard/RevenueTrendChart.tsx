import type { DashboardRevenueTrendViewModel } from "@/src/lib/dashboard/revenue-trend";

type RevenueTrendChartProps = {
  points: DashboardRevenueTrendViewModel["points"];
};

type ChartPoint = {
  x: number;
  y: number;
  label: string;
};

const CHART_WIDTH = 640;
const CHART_HEIGHT = 248;
const CHART_PADDING = {
  top: 20,
  right: 20,
  bottom: 40,
  left: 20,
};

function buildChartPoints(points: DashboardRevenueTrendViewModel["points"]): ChartPoint[] {
  if (points.length === 0) {
    return [];
  }

  const values = points.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;
  const effectiveRange = range > 0 ? range : Math.max(1, Math.abs(maxValue) * 0.12);
  const lowerBound = range > 0 ? minValue : minValue - effectiveRange / 2;
  const upperBound = range > 0 ? maxValue : maxValue + effectiveRange / 2;
  const chartLeft = CHART_PADDING.left;
  const chartRight = CHART_WIDTH - CHART_PADDING.right;
  const chartTop = CHART_PADDING.top;
  const chartBottom = CHART_HEIGHT - CHART_PADDING.bottom;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;
  const stepX = points.length > 1 ? chartWidth / (points.length - 1) : 0;

  return points.map((point, index) => {
    const position = (upperBound - point.value) / (upperBound - lowerBound);
    return {
      x: chartLeft + stepX * index,
      y: chartTop + position * chartHeight,
      label: point.label,
    };
  });
}

function toLinePath(points: ChartPoint[]): string {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
}

function toAreaPath(points: ChartPoint[]): string {
  if (points.length === 0) {
    return "";
  }

  const linePath = toLinePath(points);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const chartBottom = CHART_HEIGHT - CHART_PADDING.bottom;
  return `${linePath} L ${lastPoint.x.toFixed(2)} ${chartBottom.toFixed(2)} L ${firstPoint.x.toFixed(2)} ${chartBottom.toFixed(2)} Z`;
}

function chartLabelIndexes(pointsLength: number): number[] {
  if (pointsLength <= 2) {
    return Array.from({ length: pointsLength }, (_, index) => index);
  }

  const middleIndex = Math.floor((pointsLength - 1) / 2);
  return Array.from(new Set([0, middleIndex, pointsLength - 1]));
}

export function RevenueTrendChart({ points }: RevenueTrendChartProps) {
  const chartPoints = buildChartPoints(points);
  const linePath = toLinePath(chartPoints);
  const areaPath = toAreaPath(chartPoints);
  const chartBottom = CHART_HEIGHT - CHART_PADDING.bottom;
  const chartLeft = CHART_PADDING.left;
  const chartRight = CHART_WIDTH - CHART_PADDING.right;
  const labelIndexes = chartLabelIndexes(chartPoints.length);
  const lastPoint = chartPoints[chartPoints.length - 1];

  return (
    <div
      className="overflow-hidden rounded-[1.2rem] border border-brand-border-strong/70 bg-[linear-gradient(165deg,rgba(19,41,80,0.82),rgba(16,32,67,0.92))] p-3.5"
      data-testid="dashboard-revenue-trend-chart"
    >
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="h-52 w-full" role="img" aria-label="Revenue trend chart">
        <defs>
          <linearGradient id="dashboard-revenue-trend-line" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="rgb(96 165 250)" />
            <stop offset="55%" stopColor="rgb(59 130 246)" />
            <stop offset="100%" stopColor="rgb(52 211 153)" />
          </linearGradient>
          <linearGradient id="dashboard-revenue-trend-fill" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.3)" />
            <stop offset="100%" stopColor="rgba(52,211,153,0.03)" />
          </linearGradient>
          <filter id="dashboard-revenue-trend-line-glow" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g stroke="currentColor" className="text-brand-border/35">
          <line x1={chartLeft} y1={CHART_PADDING.top} x2={chartRight} y2={CHART_PADDING.top} />
          <line x1={chartLeft} y1={(CHART_PADDING.top + chartBottom) / 2} x2={chartRight} y2={(CHART_PADDING.top + chartBottom) / 2} />
          <line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom} />
        </g>

        {areaPath ? <path d={areaPath} fill="url(#dashboard-revenue-trend-fill)" /> : null}
        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke="url(#dashboard-revenue-trend-line)"
            strokeWidth={3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#dashboard-revenue-trend-line-glow)"
          />
        ) : null}

        {chartPoints.slice(0, Math.max(0, chartPoints.length - 1)).map((point, index) => (
          <circle key={`dashboard-trend-point-${index}`} cx={point.x} cy={point.y} r={2.6} fill="rgba(148, 163, 184, 0.35)" />
        ))}
        {lastPoint ? (
          <circle cx={lastPoint.x} cy={lastPoint.y} r={5.2} fill="rgb(52 211 153)" stroke="rgb(16 32 67)" strokeWidth={2.4} />
        ) : null}

        {labelIndexes.map((index) => {
          const point = chartPoints[index];
          if (!point) {
            return null;
          }

          return (
            <text key={`${point.label}-${index}`} x={point.x} y={CHART_HEIGHT - 14} textAnchor="middle" className="fill-brand-text-muted text-[11px]">
              {point.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
