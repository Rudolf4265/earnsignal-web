import type { DashboardRevenueTrendPoint } from "../dashboard/artifact-hydration";
import type { ReportDetail } from "../api/reports";
import { prioritizeRecommendations } from "./recommendation-prioritization";
import {
  buildCanonicalReportTitle,
  buildReportDisplayLabels,
  buildReportSourceContributionLine,
  normalizePlatformsIncluded,
  resolveReportSourceCount,
} from "./source-labeling";
import {
  buildDiagnosisPresentation,
  buildPresentationTruthNotice as buildNotice,
  buildWhatChangedPresentation,
  formatDirectionLabel,
  formatPresentationLabel,
  type SharedPresentationComparisonItem as ReportDetailPresentationComparisonItem,
  type SharedPresentationMetric as ReportDetailPresentationMetric,
  type SharedPresentationNotice as ReportDetailPresentationNotice,
} from "./diagnosis-what-changed-presentation";
import {
  createEmptyTruthMetadata,
  getTruthStateDescription,
  getTruthStateLabel,
  getTruthStateTone,
  type ReportTruthMetadata,
  type ReportTruthTone,
} from "./truth";
import type {
  ReportMetricProvenanceEntry,
  ReportRecommendationViewModel,
  ReportSectionViewModel,
  ReportSignalViewModel,
  ReportViewModel,
} from "./normalize-artifact-to-report-model";

export type { ReportDetailPresentationNotice };

export type ReportDetailOutlookCard = {
  id: "base_case" | "upside" | "downside" | "outlook" | "churn_outlook" | "platform_risk_outlook" | "revenue_projection";
  title: string;
  body: string;
  stateLabel: string | null;
  stateTone: ReportTruthTone | null;
};

export type ReportDetailPresentationRecommendation = {
  id: string;
  label: string;
  body: string;
  detail: string | null;
  stateLabel: string | null;
  stateTone: ReportTruthTone | null;
};

export type ReportDetailPresentationAppendixSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets: string[];
};

export type ReportDetailAudienceGrowthSummaryTile = {
  id: "creator_score" | "source_coverage" | "audience_momentum" | "engagement_signal";
  label: string;
  value: string;
};

export type ReportDetailAudienceGrowthSourceChip = {
  id: string;
  label: string;
  latestPeriodLabel: string | null;
  dataType: string | null;
};

export type ReportDetailAudienceGrowthPlatformCard = {
  id: string;
  label: string;
  metrics: Array<{ id: string; label: string; value: string }>;
  insight: string | null;
};

export type ReportDetailAudienceGrowthPresentation = {
  title: string;
  subtitle: string | null;
  summaryTiles: ReportDetailAudienceGrowthSummaryTile[];
  includedSources: ReportDetailAudienceGrowthSourceChip[];
  platformCards: ReportDetailAudienceGrowthPlatformCard[];
  diagnosis: {
    strongestSignal: string | null;
    watchout: string | null;
    nextBestMove: string | null;
  } | null;
  trustNote: string | null;
};

export type ReportDetailDisplayContext = {
  /** Eyebrow label for the hero metrics grid — e.g. "Latest available snapshot" */
  snapshotLabel: string;
  /** Section eyebrow for trend/history sections — e.g. "Combined history" */
  historyLabel: string;
  /**
   * Compact line shown directly under the report title when the current-snapshot
   * sources are a proper subset of the full history sources.
   * e.g. "Current snapshot: Patreon · Combined history: Patreon, Substack, YouTube"
   * Null when there is no meaningful distinction to surface.
   */
  sourceContributionLine: string | null;
  /**
   * Plain-language business framing note for the coverage orientation block.
   * Set when there is uneven source coverage (snapshot is a proper subset of history).
   * Uses the backend-generated snapshotCoverageNote when available.
   * Null when coverage is uniform or no note is available.
   */
  businessFramingNote: string | null;
};

export type ReportDetailPresentationModel = {
  heroTitle: string;
  heroSubtitle: string | null;
  heroNotice: ReportDetailPresentationNotice | null;
  displayContext: ReportDetailDisplayContext;
  executiveSummary: string[];
  heroMetrics: ReportDetailPresentationMetric[];
  signals: ReportSignalViewModel[];
  keySignals: string[];
  revenueTrend: {
    points: DashboardRevenueTrendPoint[];
    narrative: string | null;
  };
  subscriberHealth: {
    notice: ReportDetailPresentationNotice | null;
    metrics: ReportDetailPresentationMetric[];
    highlights: string[];
  };
  platformMix: {
    notice: ReportDetailPresentationNotice | null;
    concentrationScore: number | null;
    platformsConnected: number | null;
    highlights: string[];
  };
  recommendations: ReportDetailPresentationRecommendation[];
  revenueOutlook: {
    notice: ReportDetailPresentationNotice | null;
    cards: ReportDetailOutlookCard[];
    highlights: string[];
  };
  diagnosis: {
    diagnosisTypeLabel: string | null;
    summary: string | null;
    notice: ReportDetailPresentationNotice | null;
    supportingMetrics: ReportDetailPresentationMetric[];
    primitives: Array<{ label: string; value: string }>;
    unavailableBody: string | null;
  };
  whatChanged: {
    comparisonAvailable: boolean;
    priorPeriodLabel: string | null;
    notice: ReportDetailPresentationNotice | null;
    improved: ReportDetailPresentationComparisonItem[];
    worsened: ReportDetailPresentationComparisonItem[];
    watchNext: ReportDetailPresentationComparisonItem[];
    unavailableBody: string | null;
  };
  audienceGrowth: ReportDetailAudienceGrowthPresentation | null;
  appendixSections: ReportDetailPresentationAppendixSection[];
};

export type BuildReportDetailPresentationInput = {
  report: ReportDetail;
  artifactModel: ReportViewModel | null;
  artifactSignals?: {
    keySignals: string[];
    recommendedActions: string[];
    trendPreview: string | null;
    revenueTrend: DashboardRevenueTrendPoint[];
  } | null;
};

type IndexedSection = ReportSectionViewModel & { index: number };

function isSummaryPlaceholder(value: string): boolean {
  return value.trim().toLowerCase() === "no summary available.";
}

function normalizeTitle(value: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function toLabel(value: string): string {
  return value
    .split("_")
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function matchesSectionTitle(title: string | null, keywords: string[]): boolean {
  const normalized = normalizeTitle(title);
  if (!normalized) {
    return false;
  }

  return keywords.some((keyword) => normalized.includes(keyword));
}

function toIndexedSections(sections: ReportSectionViewModel[] | null | undefined): IndexedSection[] {
  if (!Array.isArray(sections)) {
    return [];
  }

  return sections.map((section, index) => ({ ...section, index }));
}

function dedupeText(values: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const trimmed = value.trim();
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

function collectSectionText(sections: ReportSectionViewModel[]): string[] {
  return dedupeText(sections.flatMap((section) => [...section.paragraphs, ...section.bullets]));
}

function selectSections(sections: IndexedSection[], keywords: string[]): IndexedSection[] {
  return sections.filter((section) => matchesSectionTitle(section.title, keywords));
}

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

function formatScore(value: number | null): string {
  if (value === null) {
    return "--";
  }

  const rounded = Math.max(0, Math.min(100, Math.round(value)));
  return `${rounded}/100`;
}

function formatPercent(value: number): string {
  const percent = value <= 1 ? value * 100 : value;
  const rounded = Math.round(percent * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}

function readPercentFromText(value: string): number | null {
  const match = value.match(/(-?\d+(?:\.\d+)?)\s*%/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function readCurrencyFromText(value: string): string | null {
  const match = value.match(/\$-?\d[\d,]*(?:\.\d+)?/);
  return match ? match[0] : null;
}

function normalizeScorePercent(value: number): number | null {
  if (!Number.isFinite(value)) {
    return null;
  }

  if (value >= 0 && value <= 1) {
    return value * 100;
  }

  if (value >= 0 && value <= 100) {
    return value;
  }

  return null;
}

function readConcentrationScore(lines: string[]): number | null {
  for (const line of lines) {
    if (!/(concentration|platform risk|dependency|mix)/i.test(line)) {
      continue;
    }

    const percent = readPercentFromText(line);
    if (percent !== null) {
      return Math.max(0, Math.min(100, percent));
    }

    const scoreMatch = line.match(/(?:score|index|risk|concentration)[^-\d]{0,12}(-?\d+(?:\.\d+)?)/i);
    if (scoreMatch) {
      const parsed = normalizeScorePercent(Number(scoreMatch[1]));
      if (parsed !== null) {
        return parsed;
      }
    }
  }

  return null;
}

const KNOWN_PLATFORM_TITLES = ["Patreon", "Substack", "YouTube", "Instagram", "TikTok"];

function hasConflictingPlatformMentions(rawTitle: string, platformsIncluded: string[]): boolean {
  const includedPlatforms = normalizePlatformsIncluded(platformsIncluded);
  if (includedPlatforms.length === 0) {
    return false;
  }

  const normalizedTitle = rawTitle.toLowerCase();
  const mentionedPlatforms = KNOWN_PLATFORM_TITLES.filter((platform) => normalizedTitle.includes(platform.toLowerCase()));
  if (mentionedPlatforms.length === 0) {
    return false;
  }

  if (mentionedPlatforms.length !== includedPlatforms.length) {
    return true;
  }

  const includedSet = new Set(includedPlatforms);
  return mentionedPlatforms.some((platform) => !includedSet.has(platform));
}

function readFriendlyReportTitle(report: ReportDetail): { title: string; subtitle: string | null } {
  const rawTitle = report.title.trim();
  const normalizedTitle = rawTitle.toLowerCase();
  const normalizedFallback = `report ${report.id}`.toLowerCase();
  const titleLooksGeneric =
    !rawTitle ||
    normalizedTitle === normalizedFallback ||
    /^report\s+[a-z0-9_-]{8,}$/i.test(rawTitle) ||
    hasConflictingPlatformMentions(rawTitle, report.platformsIncluded);

  return {
    title: titleLooksGeneric
      ? buildCanonicalReportTitle({
          createdAt: report.createdAt,
          platformsIncluded: report.platformsIncluded,
          sourceCount: report.sourceCount ?? report.metrics.platformsConnected,
          updatedAt: report.updatedAt,
        })
      : rawTitle,
    subtitle: null,
  };
}

function createMetric(input: {
  id: string;
  label: string;
  value: string;
  truth?: ReportTruthMetadata | null;
  source?: string | null;
  detail?: string | null;
}): ReportDetailPresentationMetric {
  const stateLabel = input.truth ? getTruthStateLabel(input.truth, { source: input.source ?? null }) : null;
  const stateTone = input.truth && stateLabel ? getTruthStateTone(input.truth, { source: input.source ?? null }) : null;
  const truthDetail = input.truth ? getTruthStateDescription(input.truth, { source: input.source ?? null }) : null;

  return {
    id: input.id,
    label: input.label,
    value: input.value,
    detail: truthDetail ?? input.detail ?? null,
    stateLabel,
    stateTone,
  };
}

function findFirstLineByKeywords(lines: string[], keywords: string[]): string | null {
  const loweredKeywords = keywords.map((keyword) => keyword.toLowerCase());
  for (const line of lines) {
    const normalized = line.toLowerCase();
    if (loweredKeywords.some((keyword) => normalized.includes(keyword))) {
      return line;
    }
  }

  return null;
}

function formatSignedPercent(value: number): string {
  const percent = value <= 1 && value >= -1 ? value * 100 : value;
  const rounded = Math.round(percent * 10) / 10;
  const normalized = Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
  return `${rounded > 0 ? "+" : ""}${normalized}%`;
}

function buildDiagnosisPrimitives(
  diagnosis: ReportViewModel["diagnosis"],
): Array<{ label: string; value: string }> {
  if (!diagnosis?.primitives) {
    return [];
  }

  return [
    { label: "Revenue trend", value: formatDirectionLabel(diagnosis.primitives.revenueTrendDirection, { unknownLabel: "Unknown" }) ?? "Unknown" },
    { label: "Subscriber trend", value: formatDirectionLabel(diagnosis.primitives.activeSubscribersDirection, { unknownLabel: "Unknown" }) ?? "Unknown" },
    { label: "Churn pressure", value: formatPresentationLabel(diagnosis.primitives.churnPressureLevel) },
    { label: "Concentration pressure", value: formatPresentationLabel(diagnosis.primitives.concentrationPressureLevel) },
    { label: "Monetization efficiency", value: formatPresentationLabel(diagnosis.primitives.monetizationEfficiencyLevel) },
    { label: "Stability trend", value: formatDirectionLabel(diagnosis.primitives.stabilityDirection, { unknownLabel: "Unknown" }) ?? "Unknown" },
  ].filter((entry) => entry.value !== "Unknown");
}

function buildExecutiveSummary(input: {
  reportSummary: string;
  reportSourceCount: number | null;
  netRevenue: number | null;
  stabilityIndex: number | null;
  artifactSummary: string[];
  keySignals: string[];
  diagnosisSummary?: string | null;
  comparisonHighlights?: string[];
}): string[] {
  const typedHighlights = dedupeText([input.diagnosisSummary ?? "", ...(input.comparisonHighlights ?? [])]);
  if (input.artifactSummary.length > 0) {
    return dedupeText([...input.artifactSummary, ...typedHighlights]).slice(0, 3);
  }

  if (input.reportSummary && !isSummaryPlaceholder(input.reportSummary)) {
    return dedupeText([input.reportSummary, ...typedHighlights]).slice(0, 3);
  }

  const fallback: string[] = [];
  fallback.push(...typedHighlights);
  if (input.netRevenue !== null) {
    fallback.push(`Net revenue in this report is ${formatCurrency(input.netRevenue)}.`);
  }
  if (input.stabilityIndex !== null) {
    fallback.push(`Creator stability is ${formatScore(input.stabilityIndex)} based on current report signals.`);
  }
  if (input.reportSourceCount !== null) {
    fallback.push(`This report includes data from ${formatNumber(input.reportSourceCount)} ${input.reportSourceCount === 1 ? "source" : "sources"}.`);
  }
  if (input.keySignals[0]) {
    fallback.push(input.keySignals[0]);
  }

  return fallback.length > 0 ? fallback.slice(0, 3) : ["Summary details are limited for this report."];
}

function buildReportTruthSummary(model: ReportViewModel | null): ReportDetailPresentationNotice | null {
  if (!model) {
    return null;
  }

  if (model.metricSnapshot?.churnRiskAvailability === "unavailable") {
    const churnTruth = createEmptyTruthMetadata({
      availability: "unavailable",
      confidence: model.metricSnapshot.churnRiskConfidence ?? null,
      confidenceAdjusted: true,
      reasonCodes: model.metricSnapshot.churnRiskReasonCodes,
      insufficientReason: model.metricSnapshot.churnRiskReasonCodes[0] ?? "missing_subscriber_evidence",
      analysisMode: model.metricSnapshot.analysisMode ?? model.analysisMode,
      dataQualityLevel: model.metricSnapshot.dataQualityLevel ?? model.dataQualityLevel,
    });
    return buildNotice(churnTruth, {
      fallbackLabel: "Unavailable",
      fallbackBody: "Subscriber-driven churn signals are unavailable for this report.",
    });
  }

  const stabilityNotice = buildNotice(model.stability, {
    fallbackBody: "Reduced confidence due to limited evidence in the latest report.",
  });
  if (stabilityNotice) {
    return stabilityNotice;
  }

  if (model.analysisMode === "reduced" || model.dataQualityLevel === "limited" || model.dataQualityLevel === "sparse") {
    return {
      label: "Limited evidence",
      body: "Heuristic signal based on available monthly data.",
      tone: "warn",
    };
  }

  return null;
}

function buildSubscriberMetrics(input: {
  subscribers: number | null;
  metricProvenance: Record<string, ReportMetricProvenanceEntry>;
  metricSnapshot: ReportViewModel["metricSnapshot"];
  lines: string[];
}): ReportDetailPresentationMetric[] {
  const metrics: ReportDetailPresentationMetric[] = [];
  const activeSubscribers = input.metricProvenance.active_subscribers;
  if (input.subscribers !== null) {
    metrics.push(
      createMetric({
        id: "subscribers",
        label: "Paid Subscribers",
        value: formatNumber(input.subscribers),
        truth: activeSubscribers ?? null,
        source: activeSubscribers?.source ?? input.metricSnapshot?.activeSubscribersSource ?? null,
      }),
    );
  }

  if (input.metricSnapshot?.churnRisk != null) {
    const churnTruth = createEmptyTruthMetadata({
      availability: input.metricSnapshot.churnRiskAvailability,
      confidence: input.metricSnapshot.churnRiskConfidence,
      confidenceAdjusted: input.metricSnapshot.churnRiskAvailability === "limited" || input.metricSnapshot.churnRiskAvailability === "unavailable",
      insufficientReason: input.metricSnapshot.churnRiskReasonCodes[0] ?? null,
      reasonCodes: input.metricSnapshot.churnRiskReasonCodes,
      analysisMode: input.metricSnapshot.analysisMode,
      dataQualityLevel: input.metricSnapshot.dataQualityLevel,
    });
    metrics.push(
      createMetric({
        id: "churn_risk",
        label: "Churn Risk",
        value: formatScore(input.metricSnapshot.churnRisk),
        truth: churnTruth,
      }),
    );
  }

  const churnRate = input.metricProvenance.churn_rate;
  if (churnRate?.value != null) {
    metrics.push(
      createMetric({
        id: "churn_rate",
        label: "Churn Rate",
        value: formatPercent(churnRate.value),
        truth: churnRate,
        source: churnRate.source,
      }),
    );
  }

  const arpu = input.metricProvenance.arpu;
  if (arpu?.value != null) {
    metrics.push(
      createMetric({
        id: "arpu",
        label: "ARPU",
        value: formatCurrency(arpu.value),
        truth: arpu,
        source: arpu.source,
      }),
    );
  }

  if (!activeSubscribers && !churnRate && !arpu) {
    const retentionLine = findFirstLineByKeywords(input.lines, ["retention", "renewal"]);
    if (retentionLine) {
      const retentionPercent = readPercentFromText(retentionLine);
      metrics.push({
        id: "retention",
        label: "Retention",
        value: retentionPercent !== null ? `${retentionPercent}%` : "Narrative signal",
        detail: retentionLine,
        stateLabel: null,
        stateTone: null,
      });
    }

    const arpuLine = findFirstLineByKeywords(input.lines, ["arpu", "average revenue per user"]);
    if (arpuLine) {
      metrics.push({
        id: "arpu",
        label: "ARPU",
        value: readCurrencyFromText(arpuLine) ?? "Narrative signal",
        detail: arpuLine,
        stateLabel: "Narrative only",
        stateTone: "neutral",
      });
    }
  }

  return metrics;
}

function buildTypedRecommendations(recommendations: ReportRecommendationViewModel[], fallback: string[]): ReportDetailPresentationRecommendation[] {
  if (recommendations.length > 0) {
    return recommendations.slice(0, 6).map((recommendation, index) => {
      const label =
        recommendation.recommendationMode === "validate"
          ? "Validate first"
          : recommendation.recommendationMode === "watch"
            ? "Watch next cycle"
            : "Recommended action";
      const stateLabel =
        recommendation.recommendationMode === "action"
          ? getTruthStateLabel(recommendation)
          : getTruthStateLabel(recommendation) && getTruthStateLabel(recommendation) !== label
            ? getTruthStateLabel(recommendation)
            : null;

      return {
        id: recommendation.id || `recommendation-${index + 1}`,
        label,
        body: recommendation.title,
        detail:
          getTruthStateDescription(recommendation) ??
          recommendation.description ??
          recommendation.steps[0] ??
          null,
        stateLabel,
        stateTone: stateLabel ? getTruthStateTone(recommendation) : null,
      };
    });
  }

  return dedupeText(fallback)
    .slice(0, 6)
    .map((recommendation, index) => ({
      id: `recommendation-fallback-${index + 1}`,
      label: `Recommendation ${index + 1}`,
      body: recommendation,
      detail: null,
      stateLabel: null,
      stateTone: null,
    }));
}

function buildFallbackOutlook(lines: string[]): { cards: ReportDetailOutlookCard[]; highlights: string[] } {
  const cards: ReportDetailOutlookCard[] = [];
  const usedLineIndexes = new Set<number>();

  const withMatch = (keywords: string[]): { line: string; index: number } | null => {
    for (let index = 0; index < lines.length; index += 1) {
      if (usedLineIndexes.has(index)) {
        continue;
      }

      const line = lines[index];
      const normalized = line.toLowerCase();
      if (keywords.some((keyword) => normalized.includes(keyword))) {
        usedLineIndexes.add(index);
        return { line, index };
      }
    }

    return null;
  };

  const baseCase = withMatch(["base case", "base", "expected"]);
  if (baseCase) {
    cards.push({ id: "base_case", title: "Base Case", body: baseCase.line, stateLabel: null, stateTone: null });
  }

  const upside = withMatch(["upside", "optimistic", "best case", "opportunity"]);
  if (upside) {
    cards.push({ id: "upside", title: "Upside", body: upside.line, stateLabel: null, stateTone: null });
  }

  const downside = withMatch(["downside", "risk", "conservative", "headwind", "bear"]);
  if (downside) {
    cards.push({ id: "downside", title: "Downside", body: downside.line, stateLabel: null, stateTone: null });
  }

  if (cards.length === 0 && lines[0]) {
    cards.push({
      id: "outlook",
      title: "Outlook",
      body: lines[0],
      stateLabel: null,
      stateTone: null,
    });
    usedLineIndexes.add(0);
  }

  return {
    cards,
    highlights: lines.filter((_, index) => !usedLineIndexes.has(index)).slice(0, 3),
  };
}

function buildTypedOutlook(outlook: ReportViewModel["outlook"], fallbackLines: string[]) {
  if (outlook?.items.length) {
    const cards = outlook.items.map((item) => ({
      id: item.id as ReportDetailOutlookCard["id"],
      title: item.title,
      body: item.body,
      stateLabel: getTruthStateLabel(item),
      stateTone: getTruthStateLabel(item) ? getTruthStateTone(item) : null,
    }));
    const highlights = dedupeText(outlook.summary.filter((line) => !cards.some((card) => card.body === line))).slice(0, 3);
    const notice = buildNotice(outlook.items.find((item) => getTruthStateLabel(item)) ?? null, {
      fallbackBody: "Outlook scenarios are confidence-adjusted in this report.",
    });
    return {
      notice,
      cards,
      highlights,
    };
  }

  return {
    notice: null,
    ...buildFallbackOutlook(fallbackLines),
  };
}

function readPlatformRiskSignalTone(lines: string[]): { tone: "Warning" | "Positive" | "Neutral"; body: string } | null {
  const platformLine = findFirstLineByKeywords(lines, ["platform", "channel", "concentration", "dependency"]);
  if (!platformLine) {
    return null;
  }

  const normalized = platformLine.toLowerCase();
  const warningHits = ["risk", "concentration", "dependency", "exposure", "decline", "downside"].filter((hint) => normalized.includes(hint)).length;
  const positiveHits = ["improving", "healthy", "diversified", "balanced", "resilient", "growth"].filter((hint) => normalized.includes(hint)).length;
  if (warningHits > positiveHits) {
    return { tone: "Warning", body: platformLine };
  }

  if (positiveHits > warningHits) {
    return { tone: "Positive", body: platformLine };
  }

  return { tone: "Neutral", body: platformLine };
}

function buildAudienceGrowthSection(
  audienceGrowth: ReportViewModel["audienceGrowthSignals"],
): ReportDetailPresentationModel["audienceGrowth"] {
  if (!audienceGrowth) {
    return null;
  }

  const rawSummaryTiles: Array<{
    id: ReportDetailAudienceGrowthSummaryTile["id"];
    label: string;
    rawValue: number | null;
  }> = [
    {
      id: "creator_score",
      label: "Creator Score",
      rawValue: audienceGrowth.summary.creatorScore,
    },
    {
      id: "source_coverage",
      label: "Source Coverage",
      rawValue: audienceGrowth.summary.sourceCoverage,
    },
    {
      id: "audience_momentum",
      label: "Audience Momentum",
      rawValue: audienceGrowth.summary.audienceMomentum,
    },
    {
      id: "engagement_signal",
      label: "Engagement Signal",
      rawValue: audienceGrowth.summary.engagementSignal,
    },
  ];

  const summaryTiles: ReportDetailAudienceGrowthSummaryTile[] = rawSummaryTiles
    .filter((tile) => tile.rawValue !== null)
    .map(({ id, label, rawValue }) => ({
      id,
      label,
      value: formatScore(rawValue),
    }));

  const includedSources = audienceGrowth.includedSources
    .filter((source) => source.included)
    .map((source, index) => ({
      id: source.platform ?? `${index}`,
      label: source.label,
      latestPeriodLabel: source.latestPeriodLabel,
      dataType: source.dataType ? toLabel(source.dataType) : null,
    }));

  const platformCards = audienceGrowth.platformCards
    .filter((card) => card.included)
    .map((card, index) => ({
      id: card.platform ?? `${index}`,
      label: card.label,
      metrics: card.metrics.slice(0, 3),
      insight: card.insight,
    }));

  const diagnosis =
    audienceGrowth.diagnosis &&
    (audienceGrowth.diagnosis.strongestSignal || audienceGrowth.diagnosis.watchout || audienceGrowth.diagnosis.nextBestMove)
      ? audienceGrowth.diagnosis
      : null;

  if (summaryTiles.length === 0 && includedSources.length === 0 && platformCards.length === 0 && !diagnosis && !audienceGrowth.trustNote) {
    return null;
  }

  return {
    title: audienceGrowth.title,
    subtitle: audienceGrowth.subtitle,
    summaryTiles,
    includedSources,
    platformCards,
    diagnosis,
    trustNote: audienceGrowth.trustNote,
  };
}

function buildDiagnosisSection(
  diagnosis: ReportViewModel["diagnosis"],
): ReportDetailPresentationModel["diagnosis"] {
  const presentation = buildDiagnosisPresentation(diagnosis, {
    metricIdPrefix: "diagnosis",
    supportingMetricLimit: 4,
    noticeFallbackBody: "Diagnosis is bounded by the available evidence in this report.",
    missingDiagnosisBody: "Diagnosis details are not available in this report.",
    missingSummaryBody: "Diagnosis details are limited for this report.",
  });

  return {
    diagnosisTypeLabel: presentation.diagnosisTypeLabel,
    summary: presentation.summary,
    notice: presentation.notice,
    supportingMetrics: presentation.supportingMetrics,
    primitives: buildDiagnosisPrimitives(diagnosis),
    unavailableBody: presentation.unavailableBody,
  };
}

function buildWhatChangedSection(
  whatChanged: ReportViewModel["whatChanged"],
): ReportDetailPresentationModel["whatChanged"] {
  return buildWhatChangedPresentation(whatChanged, {
    itemIdPrefix: null,
    itemLimit: 3,
    includeDirectionInDetail: true,
    noticeFallbackBody: "Comparison results are bounded by the comparable report evidence that was available.",
    missingWhatChangedBody: "Comparison details are not available in this report.",
    unavailableComparisonBody: "A prior comparable report is not available yet.",
  });
}

function buildReportDetailPresentationModel(input: BuildReportDetailPresentationInput): ReportDetailPresentationModel {
  const sectionEntries = toIndexedSections(input.artifactModel?.sections);
  const diagnosis = buildDiagnosisSection(input.artifactModel?.diagnosis ?? null);
  const whatChanged = buildWhatChangedSection(input.artifactModel?.whatChanged ?? null);
  const audienceGrowth = buildAudienceGrowthSection(input.artifactModel?.audienceGrowthSignals ?? null);

  const revenueSections = selectSections(sectionEntries, ["revenue snapshot", "revenue trend"]);
  const subscriberSections = selectSections(sectionEntries, ["subscribers retention", "subscriber", "retention", "tier health", "churn", "arpu"]);
  const platformSections = selectSections(sectionEntries, ["platform mix", "platform concentration", "channel mix", "platform"]);
  const keySignalSections = selectSections(sectionEntries, ["key signals", "prioritized insights", "clustered themes"]);
  const recommendationSections = selectSections(sectionEntries, ["recommended actions", "ranked recommendations", "plan", "next actions"]);
  const outlookSections = selectSections(sectionEntries, ["outlook", "projection", "forecast"]);
  const explicitAppendixSections = selectSections(sectionEntries, ["appendix"]);

  const usedSectionIndexes = new Set<number>();
  for (const section of [
    ...revenueSections,
    ...subscriberSections,
    ...platformSections,
    ...keySignalSections,
    ...recommendationSections,
    ...outlookSections,
    ...explicitAppendixSections,
  ]) {
    usedSectionIndexes.add(section.index);
  }

  const typedSignals = input.artifactModel?.signals ?? [];
  const rawKeySignals = dedupeText([
    ...typedSignals.map((signal) => signal.description ?? signal.title),
    ...(input.artifactSignals?.keySignals ?? []),
    ...input.report.keySignals,
    ...collectSectionText(keySignalSections),
  ]);

  const kpis = {
    netRevenue: input.artifactModel?.kpis.netRevenue ?? input.report.metrics.netRevenue ?? null,
    stabilityIndex: input.artifactModel?.kpis.stabilityIndex ?? input.report.metrics.stabilityIndex ?? null,
    subscribers: input.artifactModel?.kpis.subscribers ?? input.report.metrics.subscribers ?? null,
  };

  const summary = buildExecutiveSummary({
    reportSummary: input.report.summary,
    reportSourceCount: input.report.sourceCount ?? input.report.metrics.platformsConnected,
    netRevenue: kpis.netRevenue,
    stabilityIndex: kpis.stabilityIndex,
    artifactSummary: dedupeText(input.artifactModel?.executiveSummaryParagraphs ?? []),
    keySignals: rawKeySignals,
    diagnosisSummary: input.artifactModel?.diagnosis?.summaryText ?? null,
    comparisonHighlights: [
      input.artifactModel?.whatChanged?.whatImproved[0]?.summaryText ?? "",
      input.artifactModel?.whatChanged?.whatWorsened[0]?.summaryText ?? "",
      input.artifactModel?.whatChanged?.watchNext[0]?.summaryText ?? "",
    ],
  });

  const revenueLines = collectSectionText(revenueSections);
  const trendNarrative = input.artifactSignals?.trendPreview ?? revenueLines[0] ?? null;

  const subscriberLines = collectSectionText(subscriberSections);
  const subscriberMetrics = buildSubscriberMetrics({
    subscribers: kpis.subscribers,
    metricProvenance: input.artifactModel?.metricProvenance ?? {},
    metricSnapshot: input.artifactModel?.metricSnapshot ?? null,
    lines: subscriberLines,
  });

  const concentrationRisk = input.artifactModel?.metricProvenance?.concentration_risk ?? null;
  const platformLines = dedupeText([...collectSectionText(platformSections), ...rawKeySignals.filter((line) => /platform|channel|concentration/i.test(line))]);
  const typedConcentrationScore = concentrationRisk?.value != null ? normalizeScorePercent(concentrationRisk.value) : null;
  const platformMix = {
    notice:
      buildNotice(concentrationRisk, {
        source: concentrationRisk?.source ?? null,
        fallbackBody: "Platform risk is based on the available channel mix evidence.",
      }) ?? buildNotice(input.artifactModel?.outlook?.items.find((item) => item.id === "platform_risk_outlook") ?? null),
    concentrationScore: typedConcentrationScore ?? readConcentrationScore(platformLines),
    platformsConnected: input.report.metrics.platformsConnected ?? null,
    highlights: platformLines.slice(0, 3),
  };
  const platformRiskSignal = readPlatformRiskSignalTone(platformLines.length > 0 ? platformLines : rawKeySignals);

  const typedRecommendations = prioritizeRecommendations(input.artifactModel?.recommendations ?? [], {
    diagnosis: input.artifactModel?.diagnosis ?? null,
    whatChanged: input.artifactModel?.whatChanged ?? null,
  });
  const recommendationFallback = dedupeText([
    ...(input.artifactSignals?.recommendedActions ?? []),
    ...input.report.recommendedActions,
    ...collectSectionText(recommendationSections),
  ]);
  const recommendations = buildTypedRecommendations(typedRecommendations, recommendationFallback);

  const revenueOutlook = buildTypedOutlook(input.artifactModel?.outlook ?? null, collectSectionText(outlookSections));

  const appendixSections: ReportDetailPresentationAppendixSection[] = [
    ...explicitAppendixSections,
    ...sectionEntries.filter((section) => !usedSectionIndexes.has(section.index)),
  ].map((section) => ({
    id: `appendix-${section.index}`,
    title: section.title ?? `Section ${section.index + 1}`,
    paragraphs: section.paragraphs,
    bullets: section.bullets,
  }));

  // Build display context: snapshot vs. history labels + source contribution line.
  const reportSourceCount = resolveReportSourceCount({
    platformsIncluded: input.report.platformsIncluded,
    sourceCount: input.report.sourceCount ?? input.report.metrics.platformsConnected ?? null,
  });
  const displayLabels = buildReportDisplayLabels({ sourceCount: reportSourceCount });

  // Collect snapshot sources from the key metric provenance entries.
  const snapshotSourcesFromProvenance: string[] = [];
  for (const key of ["net_revenue", "subscribers", "active_subscribers", "churn_rate", "arpu"]) {
    const src = input.artifactModel?.metricProvenance?.[key]?.source ?? null;
    if (src && !snapshotSourcesFromProvenance.includes(src)) {
      snapshotSourcesFromProvenance.push(src);
    }
  }

  const sourceContributionLine = buildReportSourceContributionLine({
    platformsIncluded: input.report.platformsIncluded,
    snapshotSources: snapshotSourcesFromProvenance,
  });

  const displayContext: ReportDetailDisplayContext = {
    snapshotLabel: sourceContributionLine ? "Latest available — coverage varies by source" : displayLabels.snapshotLabel,
    historyLabel: displayLabels.historyLabel,
    sourceContributionLine,
    businessFramingNote: sourceContributionLine ? (input.report.snapshotCoverageNote ?? null) : null,
  };

  const heroTitle = readFriendlyReportTitle(input.report);

  const netRevenueTruth = input.artifactModel?.metricProvenance?.net_revenue ?? null;
  const stabilityTruth = input.artifactModel?.stability ?? null;
  const platformTruth = concentrationRisk ?? input.artifactModel?.outlook?.items.find((item) => item.id === "platform_risk_outlook") ?? null;

  const heroMetrics: ReportDetailPresentationMetric[] = [
    createMetric({
      id: "net_revenue",
      label: "Net Revenue",
      value: formatCurrency(kpis.netRevenue),
      truth: netRevenueTruth,
      source: netRevenueTruth?.source ?? null,
      detail: revenueLines[0] ?? null,
    }),
    createMetric({
      id: "creator_health",
      label: "Creator Health",
      value: formatScore(kpis.stabilityIndex),
      truth: stabilityTruth,
      detail: stabilityTruth?.explanation ?? null,
    }),
    createMetric({
      id: "platform_risk",
      label: "Platform Risk",
      value:
        platformMix.concentrationScore !== null
          ? `${platformMix.concentrationScore % 1 === 0 ? platformMix.concentrationScore.toFixed(0) : platformMix.concentrationScore.toFixed(1)}%`
          : platformRiskSignal?.tone ?? "--",
      truth: platformTruth,
      source: concentrationRisk?.source ?? null,
      detail: platformRiskSignal?.body ?? platformMix.highlights[0] ?? null,
    }),
  ];

  return {
    heroTitle: heroTitle.title,
    heroSubtitle: heroTitle.subtitle,
    heroNotice: buildReportTruthSummary(input.artifactModel),
    displayContext,
    executiveSummary: summary,
    heroMetrics,
    signals: typedSignals,
    keySignals: rawKeySignals,
    revenueTrend: {
      points: input.artifactSignals?.revenueTrend ?? [],
      narrative: trendNarrative,
    },
    subscriberHealth: {
      notice:
        buildNotice(
          input.artifactModel?.metricSnapshot
            ? createEmptyTruthMetadata({
                availability: input.artifactModel.metricSnapshot.churnRiskAvailability,
                confidence: input.artifactModel.metricSnapshot.churnRiskConfidence,
                confidenceAdjusted:
                  input.artifactModel.metricSnapshot.churnRiskAvailability === "limited" ||
                  input.artifactModel.metricSnapshot.churnRiskAvailability === "unavailable",
                insufficientReason: input.artifactModel.metricSnapshot.churnRiskReasonCodes[0] ?? null,
                reasonCodes: input.artifactModel.metricSnapshot.churnRiskReasonCodes,
                analysisMode: input.artifactModel.metricSnapshot.analysisMode,
                dataQualityLevel: input.artifactModel.metricSnapshot.dataQualityLevel,
              })
            : null,
          {
            fallbackBody: "Subscriber-driven risk signals are limited in this report.",
          },
        ) ??
        buildNotice(input.artifactModel?.metricProvenance?.active_subscribers ?? null, {
          source: input.artifactModel?.metricProvenance?.active_subscribers?.source ?? input.artifactModel?.metricSnapshot?.activeSubscribersSource ?? null,
          fallbackBody: "Subscriber metrics are based on the available evidence in this report.",
        }) ??
        buildNotice(input.artifactModel?.metricProvenance?.churn_rate ?? null, {
          source: input.artifactModel?.metricProvenance?.churn_rate?.source ?? input.artifactModel?.metricSnapshot?.churnRateSource ?? null,
        }),
      metrics: subscriberMetrics,
      highlights: subscriberLines.slice(0, 3),
    },
    platformMix,
    recommendations,
    revenueOutlook,
    diagnosis,
    whatChanged,
    audienceGrowth,
    appendixSections,
  };
}

export { buildReportDetailPresentationModel };
