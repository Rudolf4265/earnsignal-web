import {
  createEmptyTruthMetadata,
  inferAvailabilityFromTruth,
  normalizeTruthConfidence,
  type ReportAvailability,
  type ReportConfidenceLevel,
  type ReportTruthMetadata,
} from "./truth";

export type ReportKpis = {
  netRevenue: number | null;
  subscribers: number | null;
  stabilityIndex: number | null;
  churnVelocity: number | null;
};

export type ReportSectionViewModel = {
  key: string | null;
  title: string | null;
  bullets: string[];
  paragraphs: string[];
  truth: ReportTruthMetadata;
};

export type ReportMetricSnapshot = {
  churnRisk: number | null;
  churnRiskRawScore: number | null;
  churnRiskConfidence: ReportConfidenceLevel | null;
  churnRiskAvailability: ReportAvailability | null;
  churnRiskReasonCodes: string[];
  activeSubscribersSource: string | null;
  churnRateSource: string | null;
  arpuSource: string | null;
  stabilityConfidence: number | null;
  analysisMode: string | null;
  dataQualityLevel: string | null;
};

export type ReportMetricProvenanceEntry = ReportTruthMetadata & {
  value: number | null;
  source: string | null;
  confidenceScore: number | null;
};

export type ReportSignalViewModel = ReportTruthMetadata & {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  severity: number | null;
  signalType: string | null;
  confidenceScore: number | null;
};

export type ReportRecommendationViewModel = ReportTruthMetadata & {
  id: string;
  title: string;
  description: string | null;
  expectedImpact: string | null;
  effort: string | null;
  confidenceScore: number | null;
  steps: string[];
  linkedSignals: string[];
};

export type ReportOutlookItemViewModel = ReportTruthMetadata & {
  id: string;
  title: string;
  body: string;
  level: string | null;
  score: number | null;
  scoreBeforeAdjustment: number | null;
  confidenceScore: number | null;
};

export type ReportOutlookViewModel = {
  summary: string[];
  items: ReportOutlookItemViewModel[];
};

export type ReportStabilityViewModel = ReportTruthMetadata & {
  score: number | null;
  band: string | null;
  explanation: string | null;
  confidenceScore: number | null;
  components: Record<string, number> | null;
};

export type ReportViewModel = {
  reportId: string | null;
  schemaVersion: string | null;
  createdAt: string | null;
  analysisMode: string | null;
  dataQualityLevel: string | null;
  executiveSummaryParagraphs: string[];
  kpis: ReportKpis;
  sections: ReportSectionViewModel[];
  metricSnapshot: ReportMetricSnapshot | null;
  metricProvenance: Record<string, ReportMetricProvenanceEntry>;
  signals: ReportSignalViewModel[];
  recommendations: ReportRecommendationViewModel[];
  outlook: ReportOutlookViewModel | null;
  stability: ReportStabilityViewModel | null;
};

export type NormalizeArtifactResult = {
  model: ReportViewModel;
  warnings: string[];
};

const SECTION_KEY_ORDER = [
  "executive_summary",
  "revenue_snapshot",
  "subscribers_retention",
  "tier_health",
  "platform_mix",
  "clustered_themes",
  "stability",
  "prioritized_insights",
  "ranked_recommendations",
  "outlook",
  "plan",
  "appendix",
] as const;

const SECTION_TITLE_BY_KEY: Partial<Record<(typeof SECTION_KEY_ORDER)[number], string>> = {
  executive_summary: "Executive Summary",
  revenue_snapshot: "Revenue Snapshot",
  subscribers_retention: "Subscribers Retention",
  tier_health: "Tier Health",
  platform_mix: "Platform Mix",
  clustered_themes: "Clustered Themes",
  stability: "Stability",
  prioritized_insights: "Key Signals",
  ranked_recommendations: "Recommended Actions",
  outlook: "Outlook",
  plan: "Plan",
  appendix: "Appendix",
};

const TREND_KEY_HINTS = ["series", "trend", "timeline", "history", "points", "data"];
const SERIES_LABEL_KEYS = ["period", "date", "month", "week", "day", "label", "name", "x"];
const SERIES_VALUE_KEYS = ["value", "net_revenue", "revenue", "amount", "metric", "y", "index"];
const TEXT_LIST_KEYS = ["text", "title", "label", "summary", "description", "headline", "explanation", "body", "name", "value"];

const METADATA_KEYS = new Set([
  "analysis_mode",
  "availability",
  "confidence",
  "confidence_adjusted",
  "data_quality_level",
  "evidence_strength",
  "insufficient_reason",
  "reason_codes",
  "recommendation_mode",
  "score_0_100",
  "score_before_adjustment",
  "level",
  "source",
  "signal_type",
  "category",
  "severity",
  "expected_impact",
  "effort",
  "linked_signals",
  "steps_30d",
]);

type SectionInput = {
  key: string | null;
  contextLabel: string;
  fallbackTitle: string | null;
  allowScalarValue: boolean;
  value: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function toLabel(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
  }

  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
  }

  return null;
}

function readScalarString(value: unknown): string | null {
  const asString = readString(value);
  if (asString) {
    return asString;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return formatNumber(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return null;
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

function readPath(record: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!isRecord(current)) {
      return undefined;
    }

    return current[key];
  }, record);
}

function readStringFromRecord(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = readString(record[key]);
    if (value) {
      return value;
    }
  }

  return null;
}

function readStringFromRecords(records: Record<string, unknown>[], keys: string[]): string | null {
  for (const record of records) {
    const value = readStringFromRecord(record, keys);
    if (value) {
      return value;
    }
  }

  return null;
}

function readStringFromPaths(records: Record<string, unknown>[], paths: string[]): string | null {
  for (const record of records) {
    for (const path of paths) {
      const value = readString(readPath(record, path));
      if (value) {
        return value;
      }
    }
  }

  return null;
}

function readRecordFromPaths(records: Record<string, unknown>[], paths: string[]): Record<string, unknown> | null {
  for (const record of records) {
    for (const path of paths) {
      const value = readPath(record, path);
      if (isRecord(value)) {
        return value;
      }
    }
  }

  return null;
}

function readNumberFromRecords(records: Record<string, unknown>[], paths: string[]): number | null {
  for (const record of records) {
    for (const path of paths) {
      const candidate = readNumber(readPath(record, path));
      if (candidate !== null) {
        return candidate;
      }
    }
  }

  return null;
}

function readLatestSeriesMetricFromRecords(records: Record<string, unknown>[], paths: string[], valueKeys: string[]): number | null {
  for (const record of records) {
    for (const path of paths) {
      const seriesValue = readPath(record, path);
      if (!Array.isArray(seriesValue)) {
        continue;
      }

      for (let index = seriesValue.length - 1; index >= 0; index -= 1) {
        const entry = seriesValue[index];
        const scalar = readNumber(entry);
        if (scalar !== null) {
          return scalar;
        }

        if (!isRecord(entry)) {
          continue;
        }

        for (const valueKey of valueKeys) {
          const candidate = readNumber(entry[valueKey]);
          if (candidate !== null) {
            return candidate;
          }
        }
      }
    }
  }

  return null;
}

function uniqueStrings(values: string[]): string[] {
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

function collectReasonCodes(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return uniqueStrings(value.map((entry) => readString(entry)).filter((entry): entry is string => entry !== null));
}

function readEnumString<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  const normalized = readString(value)?.toLowerCase();
  if (!normalized) {
    return null;
  }

  return allowed.includes(normalized as T) ? (normalized as T) : null;
}

function buildTruthMetadata(value: unknown, defaults?: Partial<ReportTruthMetadata>): ReportTruthMetadata {
  const base = createEmptyTruthMetadata(defaults);
  if (!isRecord(value)) {
    return {
      ...base,
      availability: base.availability ?? inferAvailabilityFromTruth(base),
    };
  }

  const truth = createEmptyTruthMetadata({
    ...base,
    availability: readEnumString(value.availability, ["available", "limited", "unavailable"] as const) ?? base.availability,
    confidence: normalizeTruthConfidence(value.confidence) ?? base.confidence,
    confidenceAdjusted: readBoolean(value.confidence_adjusted) ?? base.confidenceAdjusted,
    evidenceStrength: readEnumString(value.evidence_strength, ["none", "weak", "moderate", "strong"] as const) ?? base.evidenceStrength,
    insufficientReason: readString(value.insufficient_reason) ?? base.insufficientReason,
    reasonCodes: [...base.reasonCodes, ...collectReasonCodes(value.reason_codes)],
    dataQualityLevel: readString(value.data_quality_level) ?? base.dataQualityLevel,
    analysisMode: readString(value.analysis_mode) ?? base.analysisMode,
    recommendationMode: readEnumString(value.recommendation_mode, ["action", "watch", "validate"] as const) ?? base.recommendationMode,
  });

  return {
    ...truth,
    availability: truth.availability ?? inferAvailabilityFromTruth(truth),
  };
}

function formatSeriesEntry(entry: Record<string, unknown>): string | null {
  const label = readStringFromRecord(entry, SERIES_LABEL_KEYS);
  if (!label) {
    return null;
  }

  for (const valueKey of SERIES_VALUE_KEYS) {
    const numberValue = readNumber(entry[valueKey]);
    if (numberValue !== null) {
      return `${label}: ${formatNumber(numberValue)}`;
    }

    const stringValue = readString(entry[valueKey]);
    if (stringValue) {
      return `${label}: ${stringValue}`;
    }
  }

  return null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const asString = readScalarString(entry);
      if (asString) {
        return asString;
      }

      if (isRecord(entry)) {
        const asSeriesEntry = formatSeriesEntry(entry);
        if (asSeriesEntry) {
          return asSeriesEntry;
        }

        for (const key of TEXT_LIST_KEYS) {
          const candidate = readString(entry[key]);
          if (candidate) {
            return candidate;
          }
        }

        const rawValue = readScalarString(entry.value);
        if (rawValue) {
          return rawValue;
        }

        for (const [key, rawValue] of Object.entries(entry)) {
          if (METADATA_KEYS.has(key)) {
            continue;
          }

          const candidate = readScalarString(rawValue);
          if (candidate) {
            return `${toLabel(key)}: ${candidate}`;
          }
        }
      }

      return null;
    })
    .filter((entry): entry is string => entry !== null);
}

function extractTrendBullets(record: Record<string, unknown>): string[] {
  const bullets: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    const normalizedKey = key.toLowerCase();
    if (!TREND_KEY_HINTS.some((hint) => normalizedKey.includes(hint))) {
      continue;
    }

    const entries = toStringArray(value);
    if (entries.length > 0) {
      bullets.push(...entries);
    }
  }

  return uniqueStrings(bullets);
}

function extractNestedObjectBullets(key: string, value: Record<string, unknown>): string[] {
  const sectionLabel = toLabel(key);
  const bullets: string[] = [];
  const ignoredNestedKeys = new Set([
    "title",
    "heading",
    "name",
    "paragraphs",
    "bullets",
    "items",
    "summary",
    "description",
    "text",
    "headline",
    "overview",
    "insights",
    "recommendations",
    "actions",
    "signals",
    "series",
    "trend",
    "trends",
    "timeline",
    "history",
    "points",
    "data",
    "explanation",
    "narrative_text",
    ...METADATA_KEYS,
  ]);

  const summary = readStringFromRecord(value, ["summary", "description", "text", "headline", "overview", "explanation", "narrative_text"]);
  if (summary) {
    bullets.push(`${sectionLabel}: ${summary}`);
  }

  const listEntries = uniqueStrings([
    ...toStringArray(value.paragraphs),
    ...toStringArray(value.bullets),
    ...toStringArray(value.items),
    ...toStringArray(value.insights),
    ...toStringArray(value.recommendations),
    ...toStringArray(value.actions),
    ...toStringArray(value.signals),
    ...extractTrendBullets(value),
  ]);
  if (listEntries.length > 0) {
    bullets.push(...listEntries.map((entry) => `${sectionLabel}: ${entry}`));
  }

  for (const [nestedKey, nestedValue] of Object.entries(value)) {
    if (ignoredNestedKeys.has(nestedKey)) {
      continue;
    }

    const scalar = readScalarString(nestedValue);
    if (scalar) {
      bullets.push(`${sectionLabel} ${toLabel(nestedKey)}: ${scalar}`);
      continue;
    }

    if (Array.isArray(nestedValue)) {
      const entries = toStringArray(nestedValue);
      if (entries.length > 0) {
        bullets.push(...entries.map((entry) => `${sectionLabel} ${toLabel(nestedKey)}: ${entry}`));
      }
    }
  }

  return uniqueStrings(bullets);
}

function extractScalarBullets(record: Record<string, unknown>): string[] {
  const ignoredKeys = new Set([
    "title",
    "heading",
    "name",
    "paragraphs",
    "bullets",
    "items",
    "summary",
    "description",
    "text",
    "headline",
    "overview",
    "insights",
    "recommendations",
    "actions",
    "signals",
    "series",
    "trend",
    "trends",
    "timeline",
    "history",
    "points",
    "data",
    "explanation",
    "narrative_text",
    ...METADATA_KEYS,
  ]);

  const bullets: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (ignoredKeys.has(key)) {
      continue;
    }

    if (key === "kpis" || key === "metrics" || key === "components") {
      if (isRecord(value)) {
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          const candidate = readScalarString(nestedValue);
          if (candidate) {
            bullets.push(`${toLabel(nestedKey)}: ${candidate}`);
          }
        }
      }
      continue;
    }

    const scalarValue = readScalarString(value);
    if (scalarValue) {
      bullets.push(`${toLabel(key)}: ${scalarValue}`);
      continue;
    }

    if (Array.isArray(value)) {
      const values = toStringArray(value);
      if (values.length > 0) {
        bullets.push(...values.map((entry) => `${toLabel(key)}: ${entry}`));
      }
      continue;
    }

    if (isRecord(value)) {
      const nestedBullets = extractNestedObjectBullets(key, value);
      if (nestedBullets.length > 0) {
        bullets.push(...nestedBullets);
      }
    }
  }

  return uniqueStrings(bullets);
}

function toSection(input: SectionInput, warnings: string[], defaults: Partial<ReportTruthMetadata>): ReportSectionViewModel | null {
  const raw = input.value;
  if (!isRecord(raw)) {
    if (!input.allowScalarValue) {
      warnings.push(`${input.contextLabel} ignored because it is not an object.`);
      return null;
    }

    const scalar = readScalarString(raw);
    if (scalar) {
      return {
        key: input.key,
        title: input.fallbackTitle,
        bullets: [],
        paragraphs: [scalar],
        truth: createEmptyTruthMetadata(defaults),
      };
    }

    const bullets = toStringArray(raw);
    if (bullets.length > 0) {
      return {
        key: input.key,
        title: input.fallbackTitle,
        bullets,
        paragraphs: [],
        truth: createEmptyTruthMetadata(defaults),
      };
    }

    warnings.push(`${input.contextLabel} ignored because it has no renderable content.`);
    return null;
  }

  const title = readStringFromRecord(raw, ["title", "heading", "name"]);
  const structuredNarrative = isRecord(raw.narrative_structured) ? raw.narrative_structured : null;
  const paragraphs = uniqueStrings([
    ...toStringArray(raw.paragraphs),
    ...toStringArray(raw.narrative),
    ...toStringArray(raw.overview),
    ...toStringArray(structuredNarrative?.paragraphs),
    ...toStringArray(structuredNarrative?.key_takeaways),
  ]);
  const fallbackParagraph = readStringFromRecord(raw, [
    "summary",
    "description",
    "text",
    "headline",
    "overview",
    "explanation",
    "narrative_text",
  ]);
  if (fallbackParagraph) {
    paragraphs.push(fallbackParagraph);
  }

  const finalParagraphs = uniqueStrings(paragraphs);
  const bullets = uniqueStrings([
    ...toStringArray(raw.bullets),
    ...toStringArray(raw.items),
    ...toStringArray(raw.insights),
    ...toStringArray(raw.recommendations),
    ...toStringArray(raw.actions),
    ...toStringArray(raw.signals),
    ...extractTrendBullets(raw),
  ]);
  const finalBullets = bullets.length > 0 ? bullets : extractScalarBullets(raw);
  const finalTitle = title ?? input.fallbackTitle;

  if (finalTitle === null && finalParagraphs.length === 0 && finalBullets.length === 0) {
    warnings.push(`${input.contextLabel} ignored because it has no renderable title, bullets, or paragraphs.`);
    return null;
  }

  return {
    key: input.key,
    title: finalTitle,
    bullets: finalBullets,
    paragraphs: finalParagraphs,
    truth: buildTruthMetadata(raw, defaults),
  };
}

function readKpis(records: Record<string, unknown>[]): ReportKpis {
  const basePaths = {
    netRevenue: [
      "kpis.net_revenue",
      "metrics.net_revenue",
      "executive_summary.kpis.net_revenue",
      "sections.executive_summary.kpis.net_revenue",
      "sections.executive_summary.net_revenue",
      "sections.revenue_snapshot.net_revenue",
      "sections.revenue_snapshot.kpis.net_revenue",
      "sections.revenue_snapshot.metrics.net_revenue",
      "metric_snapshot.latest_net_revenue",
    ],
    subscribers: [
      "kpis.subscribers",
      "metrics.subscribers",
      "executive_summary.kpis.subscribers",
      "sections.executive_summary.kpis.subscribers",
      "sections.executive_summary.subscribers",
      "sections.subscribers_retention.subscribers",
      "sections.revenue_snapshot.subscribers",
      "sections.revenue_snapshot.kpis.subscribers",
      "sections.revenue_snapshot.metrics.subscribers",
      "metric_snapshot.active_subscribers",
    ],
    stabilityIndex: [
      "kpis.stability_index",
      "metrics.stability_index",
      "executive_summary.kpis.stability_index",
      "sections.executive_summary.kpis.stability_index",
      "sections.executive_summary.stability_index",
      "sections.stability.stability_index",
      "sections.stability.kpis.stability_index",
      "sections.stability.metrics.stability_index",
      "sections.revenue_snapshot.stability_index",
      "sections.revenue_snapshot.kpis.stability_index",
      "sections.revenue_snapshot.metrics.stability_index",
      "metric_snapshot.stability_index",
    ],
    churnVelocity: [
      "kpis.churn_velocity",
      "metrics.churn_velocity",
      "executive_summary.kpis.churn_velocity",
      "sections.executive_summary.kpis.churn_velocity",
      "sections.executive_summary.churn_velocity",
      "sections.stability.churn_velocity",
      "sections.stability.kpis.churn_velocity",
      "sections.stability.metrics.churn_velocity",
    ],
  } as const;
  const withReportPrefix = (paths: readonly string[]): string[] => [...paths, ...paths.map((path) => `report.${path}`)];
  const resolvedNetRevenue =
    readNumberFromRecords(records, withReportPrefix(basePaths.netRevenue)) ??
    readLatestSeriesMetricFromRecords(
      records,
      withReportPrefix(["sections.revenue_snapshot.series", "revenue_snapshot.series"]),
      SERIES_VALUE_KEYS,
    );

  return {
    netRevenue: resolvedNetRevenue,
    subscribers: readNumberFromRecords(records, withReportPrefix(basePaths.subscribers)),
    stabilityIndex: readNumberFromRecords(records, withReportPrefix(basePaths.stabilityIndex)),
    churnVelocity: readNumberFromRecords(records, withReportPrefix(basePaths.churnVelocity)),
  };
}

function appendOptionalSections(record: Record<string, unknown>, sections: ReportSectionViewModel[], defaults: Partial<ReportTruthMetadata>): void {
  const insights = toStringArray(record.insights);
  if (insights.length > 0 && !sections.some((section) => section.title?.toLowerCase() === "key signals")) {
    sections.push({ key: null, title: "Key Signals", bullets: insights, paragraphs: [], truth: createEmptyTruthMetadata(defaults) });
  }

  const recommendations = toStringArray(record.recommendations);
  if (recommendations.length > 0 && !sections.some((section) => section.title?.toLowerCase() === "recommended actions")) {
    sections.push({
      key: null,
      title: "Recommended Actions",
      bullets: recommendations,
      paragraphs: [],
      truth: createEmptyTruthMetadata(defaults),
    });
  }

  if (isRecord(record.narrative)) {
    const title = readStringFromRecord(record.narrative, ["title"]) ?? "Narrative";
    const paragraphs = toStringArray(record.narrative.paragraphs);
    const bullets = toStringArray(record.narrative.bullets);
    const overview = readStringFromRecord(record.narrative, ["overview"]);
    const finalParagraphs = paragraphs.length > 0 ? paragraphs : overview ? [overview] : [];

    if (finalParagraphs.length > 0 || bullets.length > 0) {
      sections.push({
        key: null,
        title,
        bullets,
        paragraphs: finalParagraphs,
        truth: createEmptyTruthMetadata(defaults),
      });
    }
  }
}

function sectionTitleFromKey(key: string): string {
  return SECTION_TITLE_BY_KEY[key as keyof typeof SECTION_TITLE_BY_KEY] ?? toLabel(key);
}

function collectSectionInputs(raw: unknown, sourceLabel: string, warnings: string[]): SectionInput[] | null {
  if (raw === undefined) {
    return null;
  }

  if (Array.isArray(raw)) {
    return raw.map((value, index) => ({
      key: null,
      contextLabel: `${sourceLabel}[${index}]`,
      fallbackTitle: null,
      allowScalarValue: false,
      value,
    }));
  }

  if (isRecord(raw)) {
    const rawKeys = Object.keys(raw);
    const orderedKeys = [
      ...SECTION_KEY_ORDER.filter((key) => Object.prototype.hasOwnProperty.call(raw, key)),
      ...rawKeys.filter((key) => !SECTION_KEY_ORDER.includes(key as (typeof SECTION_KEY_ORDER)[number])),
    ];

    return orderedKeys.map((key) => ({
      key,
      contextLabel: `${sourceLabel}.${key}`,
      fallbackTitle: sectionTitleFromKey(key),
      allowScalarValue: true,
      value: raw[key],
    }));
  }

  warnings.push(`${sourceLabel} ignored because it is neither an array nor object.`);
  return [];
}

function readExecutiveSummaryParagraphs(value: unknown, warnings: string[], contextLabel: string): string[] {
  if (value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return uniqueStrings(toStringArray(value));
  }

  if (isRecord(value)) {
    const structuredNarrative = isRecord(value.narrative_structured) ? value.narrative_structured : null;
    const paragraphs = uniqueStrings([
      ...toStringArray(value.paragraphs),
      ...toStringArray(value.points),
      ...toStringArray(value.items),
      ...toStringArray(structuredNarrative?.paragraphs),
      ...toStringArray(structuredNarrative?.key_takeaways),
    ]);
    const fallback = readStringFromRecord(value, [
      "summary",
      "headline",
      "overview",
      "text",
      "description",
      "narrative_text",
      "explanation",
    ]);
    if (fallback) {
      paragraphs.push(fallback);
    }
    return uniqueStrings(paragraphs);
  }

  warnings.push(`${contextLabel} ignored because it is not renderable.`);
  return [];
}

function readMetricProvenance(records: Record<string, unknown>[], defaults: Partial<ReportTruthMetadata>) {
  const result: Record<string, ReportMetricProvenanceEntry> = {};
  const raw = readRecordFromPaths(records, ["metric_provenance", "report.metric_provenance"]);
  if (!raw) {
    return result;
  }

  for (const [key, value] of Object.entries(raw)) {
    if (!isRecord(value)) {
      continue;
    }

    result[key] = {
      ...buildTruthMetadata(value, defaults),
      value: readNumber(value.value),
      source: readString(value.source),
      confidenceScore: null,
    };
  }

  return result;
}

function readMetricSnapshot(records: Record<string, unknown>[]): ReportMetricSnapshot | null {
  const raw = readRecordFromPaths(records, ["metric_snapshot", "report.metric_snapshot"]);
  if (!raw) {
    return null;
  }

  return {
    churnRisk: readNumber(raw.churn_risk),
    churnRiskRawScore: readNumber(raw.churn_risk_raw_score),
    churnRiskConfidence: normalizeTruthConfidence(raw.churn_risk_confidence),
    churnRiskAvailability: readEnumString(raw.churn_risk_availability, ["available", "limited", "unavailable"] as const),
    churnRiskReasonCodes: collectReasonCodes(raw.churn_risk_reason_codes),
    activeSubscribersSource: readString(raw.active_subscribers_source),
    churnRateSource: readString(raw.churn_rate_source),
    arpuSource: readString(raw.arpu_source),
    stabilityConfidence: readNumber(raw.stability_confidence),
    analysisMode: readString(raw.analysis_mode),
    dataQualityLevel: readString(raw.data_quality_level),
  };
}

function readSignals(value: unknown, defaults: Partial<ReportTruthMetadata>): ReportSignalViewModel[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry, index) => {
      if (typeof entry === "string") {
        const title = readString(entry);
        if (!title) {
          return null;
        }

        return {
          ...createEmptyTruthMetadata(defaults),
          id: `signal-${index + 1}`,
          title,
          description: null,
          category: null,
          severity: null,
          signalType: null,
          confidenceScore: null,
        };
      }

      if (!isRecord(entry)) {
        return null;
      }

      return {
        ...buildTruthMetadata(entry, defaults),
        id: readString(entry.id) ?? readString(entry.signal_type) ?? `signal-${index + 1}`,
        title: readStringFromRecord(entry, ["title", "headline", "label", "text", "description", "summary"]) ?? `Signal ${index + 1}`,
        description: readStringFromRecord(entry, ["description", "summary", "text", "explanation"]),
        category: readString(entry.category),
        severity: readNumber(entry.severity),
        signalType: readString(entry.signal_type),
        confidenceScore: readNumber(entry.confidence),
      };
    })
    .filter((entry): entry is ReportSignalViewModel => entry !== null);
}

function readRecommendations(value: unknown, defaults: Partial<ReportTruthMetadata>): ReportRecommendationViewModel[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry, index) => {
      if (typeof entry === "string") {
        const title = readString(entry);
        if (!title) {
          return null;
        }

        return {
          ...createEmptyTruthMetadata(defaults),
          id: `recommendation-${index + 1}`,
          title,
          description: null,
          expectedImpact: null,
          effort: null,
          confidenceScore: null,
          steps: [],
          linkedSignals: [],
        };
      }

      if (!isRecord(entry)) {
        return null;
      }

      return {
        ...buildTruthMetadata(entry, defaults),
        id: readString(entry.id) ?? readString(entry.rank) ?? `recommendation-${index + 1}`,
        title: readStringFromRecord(entry, ["title", "headline", "label", "text", "description", "summary"]) ?? `Recommendation ${index + 1}`,
        description: readStringFromRecord(entry, ["description", "summary", "text"]),
        expectedImpact: readString(entry.expected_impact),
        effort: readString(entry.effort),
        confidenceScore: readNumber(entry.confidence),
        steps: toStringArray(entry.steps_30d),
        linkedSignals: toStringArray(entry.linked_signals),
      };
    })
    .filter((entry): entry is ReportRecommendationViewModel => entry !== null);
}

function readOutlook(value: unknown, defaults: Partial<ReportTruthMetadata>): ReportOutlookViewModel | null {
  if (!isRecord(value)) {
    return null;
  }

  const items: ReportOutlookItemViewModel[] = [];
  for (const [key, title] of [
    ["churn_outlook", "Churn Outlook"],
    ["platform_risk_outlook", "Platform Risk Outlook"],
    ["revenue_projection", "Revenue Projection"],
  ] as const) {
    const entry = value[key];
    if (!isRecord(entry)) {
      continue;
    }

    const body = readStringFromRecord(entry, ["explanation", "summary", "description", "text", "headline"]) ?? readString(entry.level) ?? null;
    if (!body) {
      continue;
    }

    items.push({
      ...buildTruthMetadata(entry, defaults),
      id: key,
      title,
      body,
      level: readString(entry.level),
      score: readNumber(entry.score_0_100),
      scoreBeforeAdjustment: readNumber(entry.score_before_adjustment),
      confidenceScore: readNumber(entry.confidence),
    });
  }

  const summary = uniqueStrings([
    ...toStringArray(value.paragraphs),
    ...toStringArray(value.items),
    ...toStringArray(value.bullets),
    ...(readStringFromRecord(value, ["summary", "description", "text", "headline"]) ? [readStringFromRecord(value, ["summary", "description", "text", "headline"]) as string] : []),
    ...extractScalarBullets(value),
  ]);

  if (items.length === 0 && summary.length === 0) {
    return null;
  }

  return {
    summary,
    items,
  };
}

function toComponentNumbers(value: unknown): Record<string, number> | null {
  if (!isRecord(value)) {
    return null;
  }

  const entries = Object.entries(value)
    .map(([key, raw]) => {
      const parsed = readNumber(raw);
      return parsed === null ? null : [key, parsed] as const;
    })
    .filter((entry): entry is readonly [string, number] => entry !== null);

  if (entries.length === 0) {
    return null;
  }

  return Object.fromEntries(entries);
}

function readStability(value: unknown, defaults: Partial<ReportTruthMetadata>): ReportStabilityViewModel | null {
  if (!isRecord(value)) {
    return null;
  }

  const truth = buildTruthMetadata(value, defaults);
  const confidenceScore = readNumber(value.confidence);
  if (readNumber(value.stability_index) === null && !readString(value.band) && !readStringFromRecord(value, ["explanation", "summary", "text"])) {
    return null;
  }

  return {
    ...truth,
    confidence: truth.confidence ?? normalizeTruthConfidence(confidenceScore),
    score: readNumber(value.stability_index),
    band: readString(value.band),
    explanation: readStringFromRecord(value, ["explanation", "summary", "text"]),
    confidenceScore,
    components: toComponentNumbers(value.components),
  };
}

export function normalizeArtifactToReportModel(artifact: unknown): NormalizeArtifactResult {
  const warnings: string[] = [];
  const emptyModel: ReportViewModel = {
    reportId: null,
    schemaVersion: null,
    createdAt: null,
    analysisMode: null,
    dataQualityLevel: null,
    executiveSummaryParagraphs: [],
    kpis: {
      netRevenue: null,
      subscribers: null,
      stabilityIndex: null,
      churnVelocity: null,
    },
    sections: [],
    metricSnapshot: null,
    metricProvenance: {},
    signals: [],
    recommendations: [],
    outlook: null,
    stability: null,
  };

  if (!isRecord(artifact)) {
    warnings.push("Artifact payload is not an object.");
    return { model: emptyModel, warnings };
  }

  const reportRecord = isRecord(artifact.report) ? artifact.report : null;
  const primaryRecord = reportRecord ?? artifact;
  const records = primaryRecord === artifact ? [artifact] : [primaryRecord, artifact];
  const analysisMode = readStringFromPaths(records, ["analysis_mode", "report.analysis_mode"]);
  const dataQualityLevel = readStringFromPaths(records, ["data_quality_level", "report.data_quality_level"]);
  const truthDefaults = createEmptyTruthMetadata({
    analysisMode,
    dataQualityLevel,
  });

  let executiveSummaryParagraphs = readExecutiveSummaryParagraphs(
    primaryRecord.executive_summary,
    warnings,
    primaryRecord === artifact ? "executive_summary" : "report.executive_summary",
  );
  if (executiveSummaryParagraphs.length === 0 && primaryRecord !== artifact) {
    executiveSummaryParagraphs = readExecutiveSummaryParagraphs(artifact.executive_summary, warnings, "executive_summary");
  }

  const sections: ReportSectionViewModel[] = [];
  const reportSectionInputs = reportRecord ? collectSectionInputs(reportRecord.sections, "report.sections", warnings) : null;
  const topLevelSectionInputs = collectSectionInputs(artifact.sections, "sections", warnings);
  const sectionInputs = reportSectionInputs ?? topLevelSectionInputs ?? [];
  for (const sectionInput of sectionInputs) {
    const normalized = toSection(sectionInput, warnings, truthDefaults);
    if (!normalized) {
      continue;
    }

    if (sectionInput.key === "executive_summary") {
      if (executiveSummaryParagraphs.length === 0) {
        executiveSummaryParagraphs = normalized.paragraphs.length > 0 ? normalized.paragraphs : normalized.bullets;
      }
      continue;
    }

    sections.push(normalized);
  }

  appendOptionalSections(primaryRecord, sections, truthDefaults);

  const namedSections = reportRecord && isRecord(reportRecord.sections) ? reportRecord.sections : isRecord(artifact.sections) ? artifact.sections : null;

  return {
    model: {
      reportId: readStringFromRecords(records, ["report_id", "reportId", "id"]),
      schemaVersion: readStringFromRecords(records, ["schema_version", "schemaVersion"]),
      createdAt: readStringFromRecords(records, ["created_at", "createdAt"]),
      analysisMode,
      dataQualityLevel,
      executiveSummaryParagraphs,
      kpis: readKpis(records),
      sections,
      metricSnapshot: readMetricSnapshot(records),
      metricProvenance: readMetricProvenance(records, truthDefaults),
      signals: readSignals(namedSections?.prioritized_insights, truthDefaults),
      recommendations: readRecommendations(namedSections?.ranked_recommendations ?? namedSections?.recommendations, truthDefaults),
      outlook: readOutlook(namedSections?.outlook, truthDefaults),
      stability: readStability(namedSections?.stability, truthDefaults),
    },
    warnings,
  };
}
