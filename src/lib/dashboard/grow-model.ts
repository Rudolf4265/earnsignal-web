import type { NormalizedGrowDashboardData } from "./grow-adapter";

export type GrowDashboardTone = "positive" | "neutral" | "warning";

export type GrowDashboardModel = {
  availability: "structured" | "partial";
  creatorScore: {
    score: number;
    delta?: number;
    label?: string;
  } | null;
  growthHealth: {
    value: string | number;
    trend?: string;
    tone: GrowDashboardTone;
  } | null;
  engagementHealth: {
    rate?: number;
    label: string;
    tone: GrowDashboardTone;
  } | null;
  growthVelocity: {
    weeklyGrowthRate?: number;
    label: string;
    tone: GrowDashboardTone;
  } | null;
  audienceValue: {
    score?: number;
    label: string;
  } | null;
  bestPostingWindow: {
    primaryWindow?: string;
    secondaryWindow?: string;
    rationale?: string;
  } | null;
  topOpportunity: {
    title: string;
    summary: string;
    estimatedImpact?: string;
  } | null;
  nextActions: Array<{
    title: string;
    impact?: string;
  }>;
  latestGrowthSummary: {
    label: string;
    body: string;
    tone: GrowDashboardTone;
  } | null;
  sourceUpdatedLabel: string | null;
};

function normalizeSignedPercent(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.round(value * 10) / 10;
}

function formatSignedPercent(value: number | null | undefined): string | null {
  const normalized = normalizeSignedPercent(value);
  if (normalized === null) {
    return null;
  }

  const absolute = Math.abs(normalized);
  const formatted = Number.isInteger(absolute) ? absolute.toFixed(0) : absolute.toFixed(1);
  if (normalized > 0) {
    return `Up ${formatted}% vs prior comparable growth evidence.`;
  }
  if (normalized < 0) {
    return `Down ${formatted}% vs prior comparable growth evidence.`;
  }

  return "Flat vs prior comparable growth evidence.";
}

function normalizeToneFromScore(value: number | null): GrowDashboardTone {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "neutral";
  }

  if (value >= 75) {
    return "positive";
  }
  if (value >= 55) {
    return "neutral";
  }

  return "warning";
}

function normalizeToneFromPercent(value: number | null): GrowDashboardTone {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "neutral";
  }

  if (value >= 3) {
    return "positive";
  }
  if (value <= -1) {
    return "warning";
  }

  return "neutral";
}

function normalizeToneFromRate(value: number | null): GrowDashboardTone {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "neutral";
  }

  if (value >= 8) {
    return "positive";
  }
  if (value >= 4) {
    return "neutral";
  }

  return "warning";
}

function toGrowthHealthValue(score: number): string {
  if (score >= 75) {
    return "Healthy";
  }
  if (score >= 55) {
    return "Watch";
  }

  return "Needs attention";
}

function toEngagementLabel(rate: number): string {
  const formatted = Number.isInteger(rate) ? rate.toFixed(0) : rate.toFixed(1);
  return `${formatted}% engagement rate from the latest supported growth evidence.`;
}

function toGrowthVelocityLabel(value: number): string {
  return formatSignedPercent(value) ?? "Growth insights based on your available audience data.";
}

function toAudienceValueLabel(score: number): string {
  return `Audience quality score from the latest supported growth evidence (${score}/100).`;
}

function normalizeSummaryTone(data: NormalizedGrowDashboardData): GrowDashboardTone {
  if (data.creatorScore !== null) {
    return normalizeToneFromScore(data.creatorScore);
  }
  if (data.growthVelocityPercent !== null) {
    return normalizeToneFromPercent(data.growthVelocityPercent);
  }
  if (data.engagementRate !== null) {
    return normalizeToneFromRate(data.engagementRate);
  }

  return "neutral";
}

function normalizeDateLabel(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

export function buildGrowDashboardModel(data: NormalizedGrowDashboardData): GrowDashboardModel {
  const creatorScore =
    data.creatorScore === null
      ? null
      : {
          score: data.creatorScore,
          label: "Based on your available audience and engagement data.",
        };
  const growthHealth =
    creatorScore === null
      ? null
      : {
          value: toGrowthHealthValue(creatorScore.score),
          trend: formatSignedPercent(data.growthVelocityPercent) ?? data.trendSummary ?? undefined,
          tone: normalizeToneFromScore(creatorScore.score),
        };
  const engagementHealth =
    data.engagementRate === null
      ? null
      : {
          rate: data.engagementRate,
          label: toEngagementLabel(data.engagementRate),
          tone: normalizeToneFromRate(data.engagementRate),
        };
  const growthVelocity =
    data.growthVelocityPercent === null
      ? null
      : {
          weeklyGrowthRate: normalizeSignedPercent(data.growthVelocityPercent) ?? undefined,
          label: toGrowthVelocityLabel(data.growthVelocityPercent),
          tone: normalizeToneFromPercent(data.growthVelocityPercent),
        };
  const audienceValue =
    data.audienceValueScore === null
      ? null
      : {
          score: data.audienceValueScore,
          label: toAudienceValueLabel(data.audienceValueScore),
        };
  const bestPostingWindow =
    data.bestPostingWindow && (data.bestPostingWindow.primaryWindow || data.bestPostingWindow.secondaryWindow || data.bestPostingWindow.rationale)
      ? {
          primaryWindow: data.bestPostingWindow.primaryWindow ?? undefined,
          secondaryWindow: data.bestPostingWindow.secondaryWindow ?? undefined,
          rationale: data.bestPostingWindow.rationale ?? undefined,
        }
      : null;
  const summaryBody = data.diagnosisSummary ?? data.trendSummary ?? null;

  return {
    availability: data.hasStructuredGrowthEvidence ? "structured" : "partial",
    creatorScore,
    growthHealth,
    engagementHealth,
    growthVelocity,
    audienceValue,
    bestPostingWindow,
    topOpportunity: data.topOpportunity
      ? {
          title: data.topOpportunity.title,
          summary: data.topOpportunity.summary,
          estimatedImpact: data.topOpportunity.estimatedImpact ?? undefined,
        }
      : null,
    nextActions: data.nextActions.slice(0, 3).map((action) => ({
      title: action.title,
      impact: action.impact ?? undefined,
    })),
    latestGrowthSummary: summaryBody
      ? {
          label: data.hasStructuredGrowthEvidence ? "Growth insights" : "Available guidance",
          body: summaryBody,
          tone: normalizeSummaryTone(data),
        }
      : null,
    sourceUpdatedLabel: normalizeDateLabel(data.sourceUpdatedAt),
  };
}
