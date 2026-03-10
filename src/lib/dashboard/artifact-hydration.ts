import { normalizeArtifactToReportModel } from "../report/normalize-artifact-to-report-model";
import { validateReportArtifactContract } from "../report/artifact-contract";

export type DashboardRevenueTrendPoint = {
  label: string;
  value: number;
};

export type DashboardArtifactHydrationResult = {
  contractValid: boolean;
  contractErrors: string[];
  warnings: string[];
  kpis: {
    netRevenue: number | null;
    subscribers: number | null;
    stabilityIndex: number | null;
    churnVelocity: number | null;
  };
  keySignals: string[];
  recommendedActions: string[];
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
  if (!contract.valid) {
    return {
      contractValid: false,
      contractErrors: contract.errors,
      warnings: [],
      kpis: {
        netRevenue: null,
        subscribers: null,
        stabilityIndex: null,
        churnVelocity: null,
      },
      keySignals: [],
      recommendedActions: [],
      trendPreview: null,
      revenueTrend: [],
    };
  }

  const normalized = normalizeArtifactToReportModel(artifact);
  const keySignalsSection = findSectionByTitles(normalized.model.sections, ["Key Signals"]);
  const recommendationsSection = findSectionByTitles(normalized.model.sections, ["Recommended Actions"]);

  return {
    contractValid: true,
    contractErrors: [],
    warnings: normalized.warnings,
    kpis: {
      netRevenue: normalized.model.kpis.netRevenue,
      subscribers: normalized.model.kpis.subscribers,
      stabilityIndex: normalized.model.kpis.stabilityIndex,
      churnVelocity: normalized.model.kpis.churnVelocity,
    },
    keySignals: readSectionText(keySignalsSection),
    recommendedActions: readSectionText(recommendationsSection),
    trendPreview: pickTrendPreview(normalized.model.sections, normalized.model.executiveSummaryParagraphs[0] ?? null),
    revenueTrend: pickRevenueTrend(artifact),
  };
}
