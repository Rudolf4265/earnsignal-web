import type { GrowthReport, ReportDetail } from "../api/reports";
import type {
  ReportDiagnosisSupportingMetricViewModel,
  ReportRecommendationViewModel,
  ReportSectionViewModel,
  ReportSignalViewModel,
  ReportWhatChangedViewModel,
} from "../report/normalize-artifact-to-report-model";
import { prioritizeRecommendations } from "../report/recommendation-prioritization";
import type { UploadStatusView } from "../upload/status";
import type { DashboardArtifactHydrationResult } from "./artifact-hydration";

export type NormalizedGrowDashboardAction = {
  title: string;
  impact: string | null;
};

export type NormalizedGrowDashboardOpportunity = {
  title: string;
  summary: string;
  estimatedImpact: string | null;
};

export type NormalizedGrowDashboardPostingWindow = {
  primaryWindow: string | null;
  secondaryWindow: string | null;
  rationale: string | null;
};

export type NormalizedGrowDashboardData = {
  hasStructuredGrowthEvidence: boolean;
  creatorScore: number | null;
  growthVelocityPercent: number | null;
  engagementRate: number | null;
  audienceValueScore: number | null;
  diagnosisSummary: string | null;
  trendSummary: string | null;
  bestPostingWindow: NormalizedGrowDashboardPostingWindow | null;
  topOpportunity: NormalizedGrowDashboardOpportunity | null;
  nextActions: NormalizedGrowDashboardAction[];
  sourceUpdatedAt: string | null;
};

export type AdaptGrowDashboardSourceInput = {
  latestArtifact: DashboardArtifactHydrationResult | null;
  latestReport: ReportDetail | null;
  latestUpload: UploadStatusView | null;
  growthReport: GrowthReport | null;
};

const GROWTH_TEXT_HINTS = [
  "growth",
  "audience",
  "engagement",
  "reach",
  "follower",
  "followers",
  "view",
  "views",
  "watch time",
  "watch-time",
  "watchtime",
  "impression",
  "impressions",
  "posting",
  "posted",
  "publish",
  "published",
  "content",
  "profile",
  "discovery",
  "demographic",
  "territor",
  "reel",
  "video",
];

const BLOCKED_GROWTH_TEXT_HINTS = [
  "revenue",
  "net revenue",
  "arpu",
  "pricing",
  "price",
  "margin",
  "billing",
  "checkout",
  "payout",
  "monetization",
  "subscriber",
  "subscribers",
  "sales",
];

const CREATOR_SCORE_METRIC_HINTS = ["creator_score", "growth_score", "growth_health_score", "audience_health_score"];
const ENGAGEMENT_RATE_METRIC_HINTS = ["engagement_rate", "save_rate", "share_rate", "completion_rate", "watch_rate"];
const GROWTH_VELOCITY_METRIC_HINTS = ["follower", "followers", "audience_growth", "growth_rate", "growth_velocity"];
const AUDIENCE_VALUE_METRIC_HINTS = ["audience_value_score", "audience_quality_score", "audience_fit_score", "engaged_audience_score"];
const POSTING_WINDOW_HINTS = ["post", "posting", "publish", "audience active"];

function clampScore(value: number | null): number | null {
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

function normalizePercent(value: number | null): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  const percent = value >= -1 && value <= 1 ? value * 100 : value;
  return Math.round(percent * 10) / 10;
}

function normalizeRate(value: number | null): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  const percent = value >= 0 && value <= 1 ? value * 100 : value;
  return Math.round(percent * 10) / 10;
}

function normalizeText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeTextList(values: Array<string | null | undefined>): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const trimmed = normalizeText(value);
    if (!trimmed) {
      continue;
    }

    const dedupeKey = trimmed.toLowerCase();
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    result.push(trimmed);
  }

  return result;
}

function normalizeMetricKey(metric: string | null | undefined): string | null {
  const normalized = normalizeText(metric)?.toLowerCase();
  if (!normalized) {
    return null;
  }

  return normalized.replace(/[^a-z0-9]+/g, "_");
}

function metricMatches(metric: string | null | undefined, hints: string[]): boolean {
  const normalizedMetric = normalizeMetricKey(metric);
  if (!normalizedMetric) {
    return false;
  }

  return hints.some((hint) => normalizedMetric.includes(hint));
}

function containsBlockedGrowthHint(value: string): boolean {
  return BLOCKED_GROWTH_TEXT_HINTS.some((hint) => value.includes(hint));
}

function isGrowthNarrative(text: string | null | undefined): boolean {
  const normalized = normalizeText(text)?.toLowerCase();
  if (!normalized) {
    return false;
  }

  if (containsBlockedGrowthHint(normalized)) {
    return false;
  }

  return GROWTH_TEXT_HINTS.some((hint) => normalized.includes(hint));
}

function collectSupportingMetrics(input: AdaptGrowDashboardSourceInput): ReportDiagnosisSupportingMetricViewModel[] {
  return [
    ...(input.latestArtifact?.diagnosis?.supportingMetrics ?? []),
    ...(input.latestReport?.diagnosis?.supportingMetrics ?? []),
  ];
}

function pickSupportingMetricRate(
  metrics: ReportDiagnosisSupportingMetricViewModel[],
  hints: string[],
): number | null {
  for (const metric of metrics) {
    if (!metricMatches(metric.metric, hints)) {
      continue;
    }

    const rate = normalizeRate(metric.currentValue);
    if (rate !== null) {
      return rate;
    }
  }

  return null;
}

function pickSupportingMetricScore(
  metrics: ReportDiagnosisSupportingMetricViewModel[],
  hints: string[],
): number | null {
  for (const metric of metrics) {
    if (!metricMatches(metric.metric, hints)) {
      continue;
    }

    const score = clampScore(metric.currentValue);
    if (score !== null) {
      return score;
    }
  }

  return null;
}

function pickDeltaPercentFromWhatChanged(whatChanged: ReportWhatChangedViewModel | null | undefined): number | null {
  const deltas = whatChanged?.deltas;
  if (!deltas) {
    return null;
  }

  for (const [deltaKey, delta] of Object.entries(deltas)) {
    if (!delta?.comparable) {
      continue;
    }

    const metricKey = normalizeMetricKey(delta.metric) ?? normalizeMetricKey(deltaKey);
    if (!metricKey || !GROWTH_VELOCITY_METRIC_HINTS.some((hint) => metricKey.includes(hint))) {
      continue;
    }

    const percentDelta = normalizePercent(delta.percentDelta ?? null);
    if (percentDelta !== null) {
      return percentDelta;
    }
  }

  return null;
}

function pickGrowthVelocityPercent(input: AdaptGrowDashboardSourceInput): number | null {
  return (
    pickDeltaPercentFromWhatChanged(input.latestArtifact?.whatChanged) ??
    pickDeltaPercentFromWhatChanged(input.latestReport?.whatChanged)
  );
}

function collectRecommendationItems(input: AdaptGrowDashboardSourceInput): ReportRecommendationViewModel[] {
  return (input.latestArtifact?.model?.recommendations ?? []).filter((item) => normalizeText(item.title));
}

function isGrowthRecommendation(recommendation: ReportRecommendationViewModel): boolean {
  const recommendationCopy = normalizeTextList([
    recommendation.title,
    recommendation.description,
    recommendation.expectedImpact,
    ...recommendation.steps,
    ...recommendation.supportingContextReasonCodes.map((code) => code.replace(/[_-]+/g, " ")),
  ]).join(" ");

  return isGrowthNarrative(recommendationCopy);
}

function toRecommendationAction(recommendation: ReportRecommendationViewModel): NormalizedGrowDashboardAction | null {
  if (!isGrowthRecommendation(recommendation)) {
    return null;
  }

  const title = normalizeText(recommendation.title);
  if (!title) {
    return null;
  }

  return {
    title,
    impact: normalizeText(recommendation.expectedImpact) ?? normalizeText(recommendation.description),
  };
}

function toRecommendationOpportunity(recommendation: ReportRecommendationViewModel): NormalizedGrowDashboardOpportunity | null {
  if (!isGrowthRecommendation(recommendation)) {
    return null;
  }

  const title = normalizeText(recommendation.title);
  const summary =
    normalizeText(recommendation.description) ??
    normalizeText(recommendation.steps[0]) ??
    normalizeText(recommendation.expectedImpact);
  if (!title || !summary) {
    return null;
  }

  return {
    title,
    summary,
    estimatedImpact: normalizeText(recommendation.expectedImpact),
  };
}

function collectFallbackActionStrings(input: AdaptGrowDashboardSourceInput): string[] {
  return normalizeTextList([
    ...(input.latestArtifact?.recommendedActions ?? []),
    ...(input.latestReport?.recommendedActions ?? []),
  ]).filter((action) => isGrowthNarrative(action));
}

function pickText(value: string | null | undefined): string | null {
  const normalized = normalizeText(value);
  return isGrowthNarrative(normalized) ? normalized : null;
}

function collectPostingWindowCandidates(input: AdaptGrowDashboardSourceInput): string[] {
  const sectionText =
    input.latestArtifact?.model?.sections.flatMap((section: ReportSectionViewModel) => [
      ...section.bullets,
      ...section.paragraphs,
      section.title,
    ]) ?? [];
  const signalText =
    input.latestArtifact?.model?.signals.flatMap((signal: ReportSignalViewModel) => [
      signal.title,
      signal.description,
    ]) ?? [];
  const recommendationText =
    input.latestArtifact?.model?.recommendations.flatMap((recommendation: ReportRecommendationViewModel) => [
      recommendation.title,
      recommendation.description,
      recommendation.expectedImpact,
      ...recommendation.steps,
    ]) ?? [];

  return normalizeTextList([
    ...sectionText,
    ...signalText,
    ...recommendationText,
    ...(input.latestReport?.keySignals ?? []),
    ...(input.latestReport?.recommendedActions ?? []),
  ]).filter((candidate) => isGrowthNarrative(candidate));
}

function extractPostingWindow(input: AdaptGrowDashboardSourceInput): NormalizedGrowDashboardPostingWindow | null {
  const candidates = collectPostingWindowCandidates(input);
  const explicitWindowPattern =
    /(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*(?:\s*(?:-|to|through)\s*(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*)?.{0,24}\d{1,2}(?::\d{2})?\s?(?:am|pm).{0,12}(?:-|to|through).{0,12}\d{1,2}(?::\d{2})?\s?(?:am|pm)/i;

  for (const candidate of candidates) {
    const normalizedCandidate = candidate.toLowerCase();
    if (!POSTING_WINDOW_HINTS.some((hint) => normalizedCandidate.includes(hint))) {
      continue;
    }

    const match = candidate.match(explicitWindowPattern);
    if (!match) {
      continue;
    }

    return {
      primaryWindow: match[0],
      secondaryWindow: null,
      rationale: candidate,
    };
  }

  return null;
}

function hasStructuredGrowthEvidence(data: {
  creatorScore: number | null;
  growthVelocityPercent: number | null;
  engagementRate: number | null;
  audienceValueScore: number | null;
  bestPostingWindow: NormalizedGrowDashboardPostingWindow | null;
}): boolean {
  return (
    data.creatorScore !== null ||
    data.growthVelocityPercent !== null ||
    data.engagementRate !== null ||
    data.audienceValueScore !== null ||
    Boolean(data.bestPostingWindow?.primaryWindow || data.bestPostingWindow?.secondaryWindow)
  );
}

export function adaptGrowDashboardSource(input: AdaptGrowDashboardSourceInput): NormalizedGrowDashboardData | null {
  const supportingMetrics = collectSupportingMetrics(input);
  const creatorScoreFromEarn = pickSupportingMetricScore(supportingMetrics, CREATOR_SCORE_METRIC_HINTS);
  const hasSocialSources = (input.growthReport?.growth_snapshot.sources_available.length ?? 0) > 0;
  const growthReportCreatorScore =
    hasSocialSources &&
    typeof input.growthReport?.creator_score_v1 === "number"
      ? clampScore(input.growthReport.creator_score_v1)
      : null;
  const coverageScoreFallback =
    growthReportCreatorScore === null &&
    hasSocialSources &&
    (input.growthReport?.growth_snapshot.coverage_score ?? 0) > 0
      ? clampScore(input.growthReport!.growth_snapshot.coverage_score)
      : null;
  const creatorScore = growthReportCreatorScore ?? coverageScoreFallback ?? creatorScoreFromEarn;
  const growthVelocityPercent = pickGrowthVelocityPercent(input);
  const engagementRate = pickSupportingMetricRate(supportingMetrics, ENGAGEMENT_RATE_METRIC_HINTS);
  const audienceValueScore = pickSupportingMetricScore(supportingMetrics, AUDIENCE_VALUE_METRIC_HINTS);
  const bestPostingWindow = extractPostingWindow(input);
  const diagnosisSummaryFromEarn =
    pickText(input.latestArtifact?.diagnosis?.summaryText) ??
    pickText(input.latestReport?.diagnosis?.summaryText);
  const diagnosisSummary =
    diagnosisSummaryFromEarn ??
    (growthReportCreatorScore !== null
      ? "Growth insights based on your available audience data."
      : coverageScoreFallback !== null
        ? "Growth insights based on your available audience data."
        : null);
  const trendSummary =
    pickText(input.latestArtifact?.trendPreview) ??
    pickText(input.latestReport?.summary);
  const prioritizedRecommendations = prioritizeRecommendations(
    collectRecommendationItems(input).filter((recommendation) => isGrowthRecommendation(recommendation)),
    {
      diagnosis: input.latestArtifact?.diagnosis ?? input.latestReport?.diagnosis ?? null,
      whatChanged: input.latestArtifact?.whatChanged ?? input.latestReport?.whatChanged ?? null,
    },
  );
  const nextActions =
    prioritizedRecommendations
      .map((recommendation) => toRecommendationAction(recommendation))
      .filter((item): item is NormalizedGrowDashboardAction => item !== null)
      .slice(0, 3) ??
    [];
  const fallbackActions =
    nextActions.length > 0
      ? nextActions
      : collectFallbackActionStrings(input).slice(0, 3).map((title) => ({
          title,
          impact: null,
        }));
  const topOpportunity =
    prioritizedRecommendations
      .map((recommendation) => toRecommendationOpportunity(recommendation))
      .find((item): item is NormalizedGrowDashboardOpportunity => item !== null) ?? null;
  const structuredEvidence = hasStructuredGrowthEvidence({
    creatorScore,
    growthVelocityPercent,
    engagementRate,
    audienceValueScore,
    bestPostingWindow,
  });
  const hasQualitativeEvidence =
    diagnosisSummary !== null ||
    trendSummary !== null ||
    topOpportunity !== null ||
    fallbackActions.length > 0;

  if (!structuredEvidence && !hasQualitativeEvidence) {
    return null;
  }

  return {
    hasStructuredGrowthEvidence: structuredEvidence,
    creatorScore,
    growthVelocityPercent,
    engagementRate,
    audienceValueScore,
    diagnosisSummary,
    trendSummary,
    bestPostingWindow,
    topOpportunity,
    nextActions: fallbackActions,
    sourceUpdatedAt:
      input.latestReport?.updatedAt ??
      input.latestReport?.createdAt ??
      input.latestUpload?.updatedAt ??
      (input.growthReport?.growth_snapshot.latest_period
        ? `${input.growthReport.growth_snapshot.latest_period}-01`
        : null),
  };
}
