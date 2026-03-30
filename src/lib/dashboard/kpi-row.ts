export type DashboardKpiItem = {
  id: string;
  label: string;
  value: string;
  changeLabel?: string;
};

type BuildDashboardKpiItemsInput = {
  netRevenue: number | null;
  subscribers: number | null;
  stabilityIndex: number | null;
  revenueDeltaText?: string | null;
  subscriberDeltaText?: string | null;
  stabilityLabel?: string | null;
  maxItems?: number;
};

function normalizeText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function clampMaxItems(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 3;
  }

  return Math.max(1, Math.min(3, Math.trunc(value)));
}

function formatCurrency(value: number | null): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatWholeNumber(value: number | null): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatScore(value: number | null): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  const rounded = Math.max(0, Math.min(100, Math.round(value)));
  return `${rounded}/100`;
}

export function buildDashboardKpiItems(input: BuildDashboardKpiItemsInput): DashboardKpiItem[] {
  const items: DashboardKpiItem[] = [];
  const maxItems = clampMaxItems(input.maxItems);

  const revenueValue = formatCurrency(input.netRevenue);
  if (revenueValue) {
    items.push({
      id: "net-revenue",
      label: "Net Revenue",
      value: revenueValue,
      changeLabel: normalizeText(input.revenueDeltaText) ?? undefined,
    });
  }

  const subscribersValue = formatWholeNumber(input.subscribers);
  if (subscribersValue) {
    items.push({
      id: "subscribers",
      label: "Subscribers",
      value: subscribersValue,
      changeLabel: normalizeText(input.subscriberDeltaText) ?? undefined,
    });
  }

  const stabilityValue = formatScore(input.stabilityIndex);
  if (stabilityValue) {
    items.push({
      id: "stability-index",
      label: "Stability Index",
      value: stabilityValue,
      changeLabel: normalizeText(input.stabilityLabel) ?? undefined,
    });
  }

  return items.slice(0, maxItems);
}
