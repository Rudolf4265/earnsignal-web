export type DashboardViewModel = {
  creatorHealth: {
    score: number | null;
    title: string;
    subtitle: string;
  };
  revenueSnapshot: {
    revenueDisplay: string;
    revenueDeltaText: string | null;
    subscribersDisplay: string;
    subscriberDeltaText: string | null;
    revenueSparkline: number[] | null;
    subscribersSparkline: number[] | null;
  };
};

export type BuildDashboardViewModelInput = {
  kpis: {
    netRevenue: number | null;
    subscribers: number | null;
    stabilityIndex: number | null;
  };
  revenueDeltaText?: string | null;
  subscriberDeltaText?: string | null;
  revenueSparkline?: number[] | null;
  subscribersSparkline?: number[] | null;
};

function formatCurrency(value: number | null): string {
  if (value === null) {
    return "$--";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number | null): string {
  if (value === null) {
    return "--";
  }

  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeScore(value: number | null): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  const rounded = Math.round(value);
  if (rounded < 0) {
    return 0;
  }

  if (rounded > 100) {
    return 100;
  }

  return rounded;
}

function normalizeSparkline(values: number[] | null | undefined): number[] | null {
  if (!Array.isArray(values)) {
    return null;
  }

  const normalized = values.filter((value) => typeof value === "number" && Number.isFinite(value));
  return normalized.length >= 2 ? normalized : null;
}

function toCreatorHealthCopy(score: number | null): Pick<DashboardViewModel["creatorHealth"], "title" | "subtitle"> {
  if (score === null) {
    return {
      title: "Your health score will appear after your next report.",
      subtitle: "Run a report to unlock a personalized health snapshot.",
    };
  }

  return {
    title: `Your creator health score is ${score}/100.`,
    subtitle: "This score updates from your latest completed report.",
  };
}

export function buildDashboardViewModel(input: BuildDashboardViewModelInput): DashboardViewModel {
  // Stability index is the only currently available score-like metric; map it directly when present.
  const creatorHealthScore = normalizeScore(input.kpis.stabilityIndex);
  const creatorHealthCopy = toCreatorHealthCopy(creatorHealthScore);

  return {
    creatorHealth: {
      score: creatorHealthScore,
      title: creatorHealthCopy.title,
      subtitle: creatorHealthCopy.subtitle,
    },
    revenueSnapshot: {
      revenueDisplay: formatCurrency(input.kpis.netRevenue),
      revenueDeltaText: normalizeOptionalText(input.revenueDeltaText),
      subscribersDisplay: formatNumber(input.kpis.subscribers),
      subscriberDeltaText: normalizeOptionalText(input.subscriberDeltaText),
      revenueSparkline: normalizeSparkline(input.revenueSparkline),
      subscribersSparkline: normalizeSparkline(input.subscribersSparkline),
    },
  };
}
