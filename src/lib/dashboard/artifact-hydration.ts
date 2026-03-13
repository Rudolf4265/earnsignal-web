import {
  normalizeArtifactToReportModel,
  type ReportComparisonDeltaViewModel,
  type ReportRecommendationViewModel,
  type ReportSignalViewModel,
  type ReportViewModel,
} from "../report/normalize-artifact-to-report-model";
import { validateReportArtifactContract } from "../report/artifact-contract";

export type DashboardRevenueTrendPoint = {
  label: string;
  value: number;
};

export type DashboardArtifactHydrationResult = {
  contractValid: boolean;
  contractErrors: string[];
  model: ReportViewModel | null;
  warnings: string[];
  kpis: {
    netRevenue: number | null;
    subscribers: number | null;
    stabilityIndex: number | null;
    churnVelocity: number | null;
  };
  keySignals: string[];
  recommendedActions: string[];
  revenueDeltaText: string | null;
  subscriberDeltaText: string | null;
  trendPreview: string | null;
  revenueTrend: DashboardRevenueTrendPoint[];
};

function dedupe(values: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

function readSectionText(section: { paragraphs: string[]; bullets: string[] } | null): string[] {
  if (!section) {
    return [];
  }

  return dedupe([...section.bullets, ...section.paragraphs]);
}

function normalizeSectionTitle(value: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function findSectionByTitles(
  sections: { title: string | null; bullets: string[]; paragraphs: string[] }[],
  titles: string[],
): { title: string | null; bullets: string[]; paragraphs: string[] } | null {
  const normalizedTargets = new Set(titles.map((title) => title.trim().toLowerCase()));
  for (const section of sections) {
    if (normalizedTargets.has(normalizeSectionTitle(section.title))) {
      return section;
    }
  }

  return null;
}

function pickTrendPreview(
  sections: { title: string | null; bullets: string[]; paragraphs: string[] }[],
  fallbackSummary: string | null,
): string | null {
  const outlookSection = findSectionByTitles(sections, ["Outlook"]);
  if (outlookSection) {
    const entries = readSectionText(outlookSection);
    if (entries.length > 0) {
      return entries[0];
    }
  }

  const trendSection = findSectionByTitles(sections, ["Revenue Snapshot"]);
  if (trendSection) {
    const entries = readSectionText(trendSection);
    if (entries.length > 0) {
      return entries[0];
    }
  }

  return fallbackSummary;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readPath(record: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!isRecord(current)) {
      return undefined;
    }

    return current[key];
  }, record);
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function formatSignedPercent(value: number): string {
  const percent = value <= 1 && value >= -1 ? value * 100 : value;
  const rounded = Math.round(percent * 10) / 10;
  const normalized = Math.abs(rounded);
  return `${rounded < 0 ? "Down" : rounded > 0 ? "Up" : "Flat"} ${
    Number.isInteger(normalized) ? normalized.toFixed(0) : normalized.toFixed(1)
  }%`;
}

function formatSignedCount(value: number): string {
  const rounded = Math.round(Math.abs(value));
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(rounded);
  return `${value < 0 ? "Down" : value > 0 ? "Up" : "Flat"} ${formatted}`;
}

function buildMetricDeltaText(
  whatChanged: ReportViewModel["whatChanged"],
  metricKey: string,
  valueFormatter: (value: number) => string,
  options?: { preferPercent?: boolean },
): string | null {
  if (!whatChanged?.comparisonAvailable) {
    return null;
  }

  const delta = whatChanged.deltas[metricKey] as ReportComparisonDeltaViewModel | undefined;
  if (!delta?.comparable) {
    return null;
  }

  const deltaValue = options?.preferPercent ? (delta.percentDelta ?? delta.absoluteDelta) : (delta.absoluteDelta ?? delta.percentDelta);
  if (deltaValue === null) {
    return null;
  }

  const caution = delta.confidenceAdjusted || delta.confidence === "low" || delta.evidenceStrength === "weak"
    ? " Limited-confidence comparison."
    : "";

  return `${valueFormatter(deltaValue)} vs prior comparable report.${caution}`;
}

function formatPeriodLabel(value: string): string {
  const ym = value.match(/^(\d{4})-(\d{2})$/);
  if (ym) {
    const month = Number(ym[2]);
    if (month >= 1 && month <= 12) {
      const date = new Date(Date.UTC(Number(ym[1]), month - 1, 1));
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
    }
  }

  return value;
}

function toTrendPoint(entry: unknown, index: number): DashboardRevenueTrendPoint | null {
  if (typeof entry === "number" && Number.isFinite(entry)) {
    return {
      label: `Point ${index + 1}`,
      value: entry,
    };
  }

  if (!isRecord(entry)) {
    return null;
  }

  let label: string | null = null;
  for (const key of ["period", "date", "month", "week", "day", "label", "name", "x"]) {
    const value = readString(entry[key]);
    if (value) {
      label = formatPeriodLabel(value);
      break;
    }
  }

  let value: number | null = null;
  for (const key of ["net_revenue", "revenue", "value", "amount", "metric", "y", "index"]) {
    const candidate = readNumber(entry[key]);
    if (candidate !== null) {
      value = candidate;
      break;
    }
  }

  if (value === null) {
    return null;
  }

  return {
    label: label ?? `Point ${index + 1}`,
    value,
  };
}

function toRevenueTrendPoints(value: unknown): DashboardRevenueTrendPoint[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const points = value
    .map((entry, index) => toTrendPoint(entry, index))
    .filter((point): point is DashboardRevenueTrendPoint => point !== null);

  if (points.length === 0) {
    return [];
  }

  return points.slice(-12);
}

function pickRevenueTrend(artifact: unknown): DashboardRevenueTrendPoint[] {
  if (!isRecord(artifact)) {
    return [];
  }

  const paths = [
    "report.sections.revenue_snapshot.series",
    "report.sections.revenue_snapshot.trend",
    "report.sections.revenue_snapshot.timeline",
    "report.sections.revenue_snapshot.history",
    "report.sections.revenue_snapshot.points",
    "report.sections.revenue_snapshot.data",
    "sections.revenue_snapshot.series",
    "sections.revenue_snapshot.trend",
    "sections.revenue_snapshot.timeline",
    "sections.revenue_snapshot.history",
    "sections.revenue_snapshot.points",
    "sections.revenue_snapshot.data",
    "report.revenue_snapshot.series",
    "report.revenue_snapshot.trend",
    "report.revenue_snapshot.timeline",
    "revenue_snapshot.series",
    "revenue_snapshot.trend",
    "revenue_snapshot.timeline",
  ];

  for (const path of paths) {
    const points = toRevenueTrendPoints(readPath(artifact, path));
    if (points.length > 0) {
      return points;
    }
  }

  return [];
}

export function hydrateDashboardFromArtifact(artifact: unknown): DashboardArtifactHydrationResult {
  const contract = validateReportArtifactContract(artifact);
  const normalized = normalizeArtifactToReportModel(artifact);
  const keySignalsSection = findSectionByTitles(normalized.model.sections, ["Key Signals"]);
  const recommendationsSection = findSectionByTitles(normalized.model.sections, ["Recommended Actions"]);
  const typedKeySignals = normalized.model.signals.map((signal: ReportSignalViewModel) => signal.description ?? signal.title).filter(Boolean);
  const typedRecommendations = normalized.model.recommendations
    .map((recommendation: ReportRecommendationViewModel) => recommendation.description ?? recommendation.title)
    .filter(Boolean);

  return {
    contractValid: contract.valid,
    contractErrors: contract.valid ? [] : contract.errors,
    model: normalized.model,
    warnings: contract.valid ? normalized.warnings : [...contract.errors, ...normalized.warnings],
    kpis: {
      netRevenue: normalized.model.kpis.netRevenue,
      subscribers: normalized.model.kpis.subscribers,
      stabilityIndex: normalized.model.kpis.stabilityIndex,
      churnVelocity: normalized.model.kpis.churnVelocity,
    },
    keySignals: typedKeySignals.length > 0 ? typedKeySignals : readSectionText(keySignalsSection),
    recommendedActions: typedRecommendations.length > 0 ? typedRecommendations : readSectionText(recommendationsSection),
    revenueDeltaText: buildMetricDeltaText(normalized.model.whatChanged, "latest_net_revenue", formatSignedPercent, { preferPercent: true }),
    subscriberDeltaText: buildMetricDeltaText(normalized.model.whatChanged, "active_subscribers", formatSignedCount),
    trendPreview: normalized.model.outlook?.summary[0] ?? pickTrendPreview(normalized.model.sections, normalized.model.executiveSummaryParagraphs[0] ?? null),
    revenueTrend: pickRevenueTrend(artifact),
  };
}
