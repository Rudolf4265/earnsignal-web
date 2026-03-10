import type { DashboardRevenueTrendPoint } from "../dashboard/artifact-hydration";
import type { ReportDetail } from "../api/reports";
import type { ReportSectionViewModel, ReportViewModel } from "./normalize-artifact-to-report-model";

export type ReportDetailPresentationMetric = {
  id: string;
  label: string;
  value: string;
  detail: string | null;
};

export type ReportDetailOutlookCard = {
  id: "base_case" | "upside" | "downside" | "outlook";
  title: string;
  body: string;
};

export type ReportDetailPresentationAppendixSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets: string[];
};

export type ReportDetailPresentationModel = {
  heroTitle: string;
  heroSubtitle: string | null;
  executiveSummary: string[];
  heroMetrics: ReportDetailPresentationMetric[];
  keySignals: string[];
  revenueTrend: {
    points: DashboardRevenueTrendPoint[];
    narrative: string | null;
  };
  subscriberHealth: {
    metrics: ReportDetailPresentationMetric[];
    highlights: string[];
  };
  platformMix: {
    concentrationScore: number | null;
    platformsConnected: number | null;
    highlights: string[];
  };
  recommendations: string[];
  revenueOutlook: {
    cards: ReportDetailOutlookCard[];
    highlights: string[];
  };
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

function readFriendlyReportTitle(report: ReportDetail): { title: string; subtitle: string | null } {
  const rawTitle = report.title.trim();
  const normalizedTitle = rawTitle.toLowerCase();
  const normalizedFallback = `report ${report.id}`.toLowerCase();
  const titleLooksGeneric = normalizedTitle === normalizedFallback || /^report\s+[a-z0-9_-]{8,}$/i.test(rawTitle);
  if (titleLooksGeneric) {
    return {
      title: "Creator Earnings Report",
      subtitle: null,
    };
  }

  return {
    title: rawTitle,
    subtitle: null,
  };
}

function buildExecutiveSummary(input: {
  reportSummary: string;
  reportPlatformsConnected: number | null;
  netRevenue: number | null;
  stabilityIndex: number | null;
  artifactSummary: string[];
  keySignals: string[];
}): string[] {
  if (input.artifactSummary.length > 0) {
    return input.artifactSummary.slice(0, 3);
  }

  if (input.reportSummary && !isSummaryPlaceholder(input.reportSummary)) {
    return [input.reportSummary];
  }

  const fallback: string[] = [];
  if (input.netRevenue !== null) {
    fallback.push(`Net revenue in this report is ${formatCurrency(input.netRevenue)}.`);
  }
  if (input.stabilityIndex !== null) {
    fallback.push(`Creator stability is ${formatScore(input.stabilityIndex)} based on current report signals.`);
  }
  if (input.reportPlatformsConnected !== null) {
    const suffix = input.reportPlatformsConnected === 1 ? "" : "s";
    fallback.push(`${formatNumber(input.reportPlatformsConnected)} platform${suffix} contributed data to this report.`);
  }
  if (input.keySignals[0]) {
    fallback.push(input.keySignals[0]);
  }

  return fallback.length > 0 ? fallback.slice(0, 3) : ["Summary details are limited for this report artifact."];
}

function buildSubscriberMetrics(input: {
  subscribers: number | null;
  churnVelocity: number | null;
  lines: string[];
}): ReportDetailPresentationMetric[] {
  const metrics: ReportDetailPresentationMetric[] = [];

  if (input.subscribers !== null) {
    metrics.push({
      id: "subscribers",
      label: "Subscribers",
      value: formatNumber(input.subscribers),
      detail: null,
    });
  }

  if (input.churnVelocity !== null) {
    metrics.push({
      id: "churn_velocity",
      label: "Churn Velocity",
      value: formatNumber(input.churnVelocity),
      detail: "From report KPI signals.",
    });
  }

  const retentionLine = findFirstLineByKeywords(input.lines, ["retention", "renewal"]);
  if (retentionLine) {
    const retentionPercent = readPercentFromText(retentionLine);
    metrics.push({
      id: "retention",
      label: "Retention",
      value: retentionPercent !== null ? `${retentionPercent}%` : "Narrative signal",
      detail: retentionLine,
    });
  }

  const arpuLine = findFirstLineByKeywords(input.lines, ["arpu", "average revenue per user"]);
  if (arpuLine) {
    metrics.push({
      id: "arpu",
      label: "ARPU",
      value: readCurrencyFromText(arpuLine) ?? "Narrative signal",
      detail: arpuLine,
    });
  }

  const deduped: ReportDetailPresentationMetric[] = [];
  const seen = new Set<string>();
  for (const metric of metrics) {
    if (seen.has(metric.id)) {
      continue;
    }

    seen.add(metric.id);
    deduped.push(metric);
  }

  return deduped;
}

function buildOutlook(lines: string[]): { cards: ReportDetailOutlookCard[]; highlights: string[] } {
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
    cards.push({ id: "base_case", title: "Base Case", body: baseCase.line });
  }

  const upside = withMatch(["upside", "optimistic", "best case", "opportunity"]);
  if (upside) {
    cards.push({ id: "upside", title: "Upside", body: upside.line });
  }

  const downside = withMatch(["downside", "risk", "conservative", "headwind", "bear"]);
  if (downside) {
    cards.push({ id: "downside", title: "Downside", body: downside.line });
  }

  if (cards.length === 0 && lines[0]) {
    cards.push({
      id: "outlook",
      title: "Outlook",
      body: lines[0],
    });
    usedLineIndexes.add(0);
  }

  const highlights = lines.filter((_, index) => !usedLineIndexes.has(index)).slice(0, 3);
  return { cards, highlights };
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

function buildPlatformRiskMetric(input: {
  concentrationScore: number | null;
  platformsConnected: number | null;
  highlights: string[];
  platformRiskSignal: { tone: "Warning" | "Positive" | "Neutral"; body: string } | null;
}): ReportDetailPresentationMetric {
  if (input.concentrationScore !== null) {
    const rounded = input.concentrationScore % 1 === 0 ? input.concentrationScore.toFixed(0) : input.concentrationScore.toFixed(1);
    return {
      id: "platform_risk",
      label: "Platform Risk",
      value: `${rounded}%`,
      detail: input.highlights[0] ?? "Concentration signal sourced from platform mix data.",
    };
  }

  if (input.platformRiskSignal) {
    return {
      id: "platform_risk",
      label: "Platform Risk",
      value: input.platformRiskSignal.tone,
      detail: input.platformRiskSignal.body,
    };
  }

  if (input.platformsConnected !== null) {
    const suffix = input.platformsConnected === 1 ? "" : "s";
    return {
      id: "platform_risk",
      label: "Platform Risk",
      value: `${formatNumber(input.platformsConnected)} channel${suffix}`,
      detail: "Connected channel count from report metadata.",
    };
  }

  return {
    id: "platform_risk",
    label: "Platform Risk",
    value: "--",
    detail: input.highlights[0] ?? null,
  };
}

export function buildReportDetailPresentationModel(input: BuildReportDetailPresentationInput): ReportDetailPresentationModel {
  const sectionEntries = toIndexedSections(input.artifactModel?.sections);

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

  const rawKeySignals = dedupeText([
    ...(input.artifactSignals?.keySignals ?? []),
    ...input.report.keySignals,
    ...collectSectionText(keySignalSections),
  ]);

  const kpis = {
    netRevenue: input.artifactModel?.kpis.netRevenue ?? input.report.metrics.netRevenue ?? null,
    stabilityIndex: input.artifactModel?.kpis.stabilityIndex ?? input.report.metrics.stabilityIndex ?? null,
    subscribers: input.artifactModel?.kpis.subscribers ?? input.report.metrics.subscribers ?? null,
    churnVelocity: input.artifactModel?.kpis.churnVelocity ?? input.report.metrics.churnVelocity ?? null,
  };

  const summary = buildExecutiveSummary({
    reportSummary: input.report.summary,
    reportPlatformsConnected: input.report.metrics.platformsConnected,
    netRevenue: kpis.netRevenue,
    stabilityIndex: kpis.stabilityIndex,
    artifactSummary: dedupeText(input.artifactModel?.executiveSummaryParagraphs ?? []),
    keySignals: rawKeySignals,
  });

  const revenueLines = collectSectionText(revenueSections);
  const trendNarrative = input.artifactSignals?.trendPreview ?? revenueLines[0] ?? null;

  const subscriberLines = collectSectionText(subscriberSections);
  const subscriberMetrics = buildSubscriberMetrics({
    subscribers: kpis.subscribers,
    churnVelocity: kpis.churnVelocity,
    lines: subscriberLines,
  });

  const platformLines = dedupeText([...collectSectionText(platformSections), ...rawKeySignals.filter((line) => /platform|channel|concentration/i.test(line))]);
  const platformMix = {
    concentrationScore: readConcentrationScore(platformLines),
    platformsConnected: input.report.metrics.platformsConnected ?? null,
    highlights: platformLines.slice(0, 3),
  };
  const platformRiskSignal = readPlatformRiskSignalTone(platformLines.length > 0 ? platformLines : rawKeySignals);

  const recommendations = dedupeText([
    ...(input.artifactSignals?.recommendedActions ?? []),
    ...input.report.recommendedActions,
    ...collectSectionText(recommendationSections),
  ]).slice(0, 6);

  const revenueOutlook = buildOutlook(collectSectionText(outlookSections));

  const appendixSections: ReportDetailPresentationAppendixSection[] = [
    ...explicitAppendixSections,
    ...sectionEntries.filter((section) => !usedSectionIndexes.has(section.index)),
  ].map((section) => ({
    id: `appendix-${section.index}`,
    title: section.title ?? `Section ${section.index + 1}`,
    paragraphs: section.paragraphs,
    bullets: section.bullets,
  }));

  const heroTitle = readFriendlyReportTitle(input.report);

  const heroMetrics: ReportDetailPresentationMetric[] = [
    {
      id: "net_revenue",
      label: "Net Revenue",
      value: formatCurrency(kpis.netRevenue),
      detail: revenueLines[0] ?? null,
    },
    {
      id: "creator_health",
      label: "Creator Health",
      value: formatScore(kpis.stabilityIndex),
      detail: kpis.churnVelocity !== null ? `Churn velocity: ${formatNumber(kpis.churnVelocity)}.` : null,
    },
    buildPlatformRiskMetric({
      concentrationScore: platformMix.concentrationScore,
      platformsConnected: platformMix.platformsConnected,
      highlights: platformMix.highlights,
      platformRiskSignal,
    }),
  ];

  return {
    heroTitle: heroTitle.title,
    heroSubtitle: heroTitle.subtitle,
    executiveSummary: summary,
    heroMetrics,
    keySignals: rawKeySignals,
    revenueTrend: {
      points: input.artifactSignals?.revenueTrend ?? [],
      narrative: trendNarrative,
    },
    subscriberHealth: {
      metrics: subscriberMetrics,
      highlights: subscriberLines.slice(0, 3),
    },
    platformMix,
    recommendations,
    revenueOutlook,
    appendixSections,
  };
}
