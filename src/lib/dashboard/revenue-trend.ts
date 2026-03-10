import type { DashboardRevenueTrendPoint } from "./artifact-hydration";

export type DashboardRevenueTrendViewModel = {
  points: DashboardRevenueTrendPoint[];
  hasRenderableChart: boolean;
  latestValueDisplay: string | null;
  movementLabel: string | null;
  periodLabel: string | null;
};

export type BuildDashboardRevenueTrendViewModelInput = {
  points: DashboardRevenueTrendPoint[] | null | undefined;
};

function normalizeLabel(value: string, index: number): string {
  const trimmed = value.trim();
  if (trimmed.length > 0) {
    return trimmed;
  }

  return `Point ${index + 1}`;
}

function normalizePoints(points: DashboardRevenueTrendPoint[] | null | undefined): DashboardRevenueTrendPoint[] {
  if (!Array.isArray(points)) {
    return [];
  }

  return points
    .map((point, index) => ({
      label: normalizeLabel(point.label, index),
      value: point.value,
    }))
    .filter((point) => Number.isFinite(point.value))
    .slice(-8);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMovementLabel(points: DashboardRevenueTrendPoint[]): string | null {
  if (points.length < 2) {
    return null;
  }

  const firstValue = points[0]?.value;
  const lastValue = points[points.length - 1]?.value;
  if (typeof firstValue !== "number" || typeof lastValue !== "number") {
    return null;
  }

  if (firstValue === 0) {
    const difference = lastValue - firstValue;
    if (difference === 0) {
      return "Flat vs start";
    }

    const direction = difference > 0 ? "Up" : "Down";
    return `${direction} ${formatCurrency(Math.abs(difference))} vs start`;
  }

  const percentage = ((lastValue - firstValue) / Math.abs(firstValue)) * 100;
  if (!Number.isFinite(percentage)) {
    return null;
  }

  if (Math.abs(percentage) < 0.1) {
    return "Flat vs start";
  }

  const direction = percentage > 0 ? "Up" : "Down";
  return `${direction} ${Math.abs(percentage).toFixed(1)}% vs start`;
}

function toPeriodLabel(points: DashboardRevenueTrendPoint[]): string | null {
  if (points.length < 2) {
    return null;
  }

  const firstLabel = points[0]?.label ?? null;
  const lastLabel = points[points.length - 1]?.label ?? null;
  if (!firstLabel || !lastLabel) {
    return null;
  }

  if (firstLabel === lastLabel) {
    return firstLabel;
  }

  return `${firstLabel} to ${lastLabel}`;
}

export function buildDashboardRevenueTrendViewModel(input: BuildDashboardRevenueTrendViewModelInput): DashboardRevenueTrendViewModel {
  const points = normalizePoints(input.points);
  const hasRenderableChart = points.length >= 2;
  const latestValue = points.length > 0 ? points[points.length - 1]?.value : null;

  return {
    points,
    hasRenderableChart,
    latestValueDisplay: typeof latestValue === "number" && Number.isFinite(latestValue) ? formatCurrency(latestValue) : null,
    movementLabel: formatMovementLabel(points),
    periodLabel: toPeriodLabel(points),
  };
}
