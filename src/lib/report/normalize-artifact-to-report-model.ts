import {
  createEmptyTruthMetadata,
  inferAvailabilityFromTruth,
  normalizeTruthConfidence,
  type ReportAvailability,
  type ReportConfidenceLevel,
  type ReportEvidenceStrength,
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

export type ReportDiagnosisType =
  | "acquisition_pressure"
  | "churn_pressure"
  | "monetization_pressure"
  | "concentration_pressure"
  | "mixed_pressure"
  | "insufficient_evidence";

export type ReportDiagnosisDirection = "up" | "down" | "flat" | "mixed" | "unknown";
export type ReportPressureLevel = "low" | "medium" | "high" | "unknown";
export type ReportComparisonDirection = "up" | "down" | "flat" | "mixed" | "unknown";
export type ReportComparisonChangeType = "improved" | "worsened" | "watch";
export type ReportComparisonMateriality = "low" | "medium" | "high";

export type ReportDiagnosisPrimitivesViewModel = {
  revenueTrendDirection: ReportDiagnosisDirection;
  activeSubscribersDirection: ReportDiagnosisDirection;
  churnPressureLevel: ReportPressureLevel;
  concentrationPressureLevel: ReportPressureLevel;
  monetizationEfficiencyLevel: ReportPressureLevel;
  stabilityDirection: ReportDiagnosisDirection;
  evidenceStrength: ReportEvidenceStrength | null;
  dataQualityLevel: string | null;
  analysisMode: string | null;
};

export type ReportDiagnosisSupportingMetricViewModel = ReportTruthMetadata & {
  metric: string;
  currentValue: number | null;
  priorValue: number | null;
  direction: ReportDiagnosisDirection;
  source: string | null;
};

export type ReportDiagnosisViewModel = ReportTruthMetadata & {
  diagnosisType: ReportDiagnosisType | null;
  summaryText: string | null;
  supportingMetrics: ReportDiagnosisSupportingMetricViewModel[];
  primitives: ReportDiagnosisPrimitivesViewModel | null;
};

export type ReportComparisonDeltaViewModel = ReportTruthMetadata & {
  metric: string;
  currentValue: number | null;
  priorValue: number | null;
  absoluteDelta: number | null;
  percentDelta: number | null;
  direction: ReportComparisonDirection;
  comparable: boolean;
};

export type ReportComparisonItemViewModel = ReportTruthMetadata & {
  category: string | null;
  metric: string | null;
  changeType: ReportComparisonChangeType | null;
  direction: ReportComparisonDirection;
  materiality: ReportComparisonMateriality | null;
  summaryText: string;
};

export type ReportWhatChangedViewModel = ReportTruthMetadata & {
  comparisonAvailable: boolean;
  priorReportId: string | null;
  priorPeriodStart: string | null;
  priorPeriodEnd: string | null;
  comparableMetricCount: number;
  comparisonBasisMetrics: string[];
  deltas: Record<string, ReportComparisonDeltaViewModel>;
  whatImproved: ReportComparisonItemViewModel[];
  whatWorsened: ReportComparisonItemViewModel[];
  watchNext: ReportComparisonItemViewModel[];
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
  supportingContextReasonCodes: string[];
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

export type ReportAudienceGrowthSummaryViewModel = {
  creatorScore: number | null;
  sourceCoverage: number | null;
  audienceMomentum: number | null;
  engagementSignal: number | null;
};

export type ReportAudienceGrowthIncludedSourceViewModel = {
  platform: string | null;
  label: string;
  included: boolean;
  latestPeriodLabel: string | null;
  dataType: string | null;
};

export type ReportAudienceGrowthMetricViewModel = {
  id: string;
  label: string;
  value: string;
};

export type ReportAudienceGrowthPlatformCardViewModel = {
  platform: string | null;
  label: string;
  included: boolean;
  metrics: ReportAudienceGrowthMetricViewModel[];
  insight: string | null;
};

export type ReportAudienceGrowthDiagnosisViewModel = {
  strongestSignal: string | null;
  watchout: string | null;
  nextBestMove: string | null;
};

export type ReportAudienceGrowthSignalsViewModel = {
  title: string;
  subtitle: string | null;
  summary: ReportAudienceGrowthSummaryViewModel;
  includedSources: ReportAudienceGrowthIncludedSourceViewModel[];
  platformCards: ReportAudienceGrowthPlatformCardViewModel[];
  diagnosis: ReportAudienceGrowthDiagnosisViewModel | null;
  trustNote: string | null;
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
  diagnosis: ReportDiagnosisViewModel | null;
  whatChanged: ReportWhatChangedViewModel | null;
  metricSnapshot: ReportMetricSnapshot | null;
  metricProvenance: Record<string, ReportMetricProvenanceEntry>;
  signals: ReportSignalViewModel[];
  recommendations: ReportRecommendationViewModel[];
  outlook: ReportOutlookViewModel | null;
  stability: ReportStabilityViewModel | null;
  audienceGrowthSignals: ReportAudienceGrowthSignalsViewModel | null;
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

const EXCLUDED_TYPED_SECTION_KEYS = new Set(["diagnosis", "what_changed", "audience_growth_signals"]);

const TREND_KEY_HINTS = ["series", "trend", "timeline", "history", "points", "data"];
const SERIES_LABEL_KEYS = ["period", "date", "month", "week", "day", "label", "name", "x"];
const SERIES_VALUE_KEYS = ["value", "net_revenue", "revenue", "amount", "metric", "y", "index"];
const TEXT_LIST_KEYS = ["text", "title", "label", "summary", "description", "headline", "explanation", "body", "name", "value"];

const METADATA_KEYS = new Set([
  "absolute_delta",
  "analysis_mode",
  "availability",
  "category",
  "change_type",
  "comparable",
  "comparable_metric_count",
  "comparison_available",
  "comparison_basis_metrics",
  "comparison_reason_codes",
  "confidence",
  "confidence_adjusted",
  "current_value",
  "data_quality_level",
  "deltas",
  "diagnosis_type",
  "direction",
  "effort",
  "evidence_strength",
  "expected_impact",
  "insufficient_reason",
  "level",
  "linked_signals",
  "materiality",
  "metric",
  "percent_delta",
  "primitives",
  "prior_period_end",
  "prior_period_start",
  "prior_report_id",
  "prior_value",
  "reason_codes",
  "recommendation_mode",
  "score_0_100",
  "score_before_adjustment",
  "severity",
  "signal_type",
  "source",
  "steps_30d",
  "summary_text",
  "supporting_context_reason_codes",
  "supporting_metrics",
  "what_improved",
  "what_worsened",
  "watch_next",
]);

const DIAGNOSIS_TYPES = [
  "acquisition_pressure",
  "churn_pressure",
  "monetization_pressure",
  "concentration_pressure",
  "mixed_pressure",
  "insufficient_evidence",
] as const;

const DIAGNOSIS_DIRECTIONS = ["up", "down", "flat", "mixed", "unknown"] as const;
const PRESSURE_LEVELS = ["low", "medium", "high", "unknown"] as const;
const COMPARISON_DIRECTIONS = ["up", "down", "flat", "mixed", "unknown"] as const;
const COMPARISON_CHANGE_TYPES = ["improved", "worsened", "watch"] as const;
const COMPARISON_MATERIALITY = ["low", "medium", "high"] as const;

type SectionInput = {
  key: string | null;
  contextLabel: string;
  fallbackTitle: string | null;
  allowScalarValue: boolean;
  value: unknown;
};

type TruthMetadataOptions = {
  reasonCodeKeys?: string[];
  insufficientReasonKeys?: string[];
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
    if (!trimmed) {
      continue;
    }

    const normalized = trimmed.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
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

function collectReasonCodesFromKeys(record: Record<string, unknown>, keys: string[]): string[] {
  return uniqueStrings(keys.flatMap((key) => collectReasonCodes(record[key])));
}

function readEnumString<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  const normalized = readString(value)?.toLowerCase();
  if (!normalized) {
    return null;
  }

  return allowed.includes(normalized as T) ? (normalized as T) : null;
}

function buildTruthMetadata(
  value: unknown,
  defaults?: Partial<ReportTruthMetadata>,
  options?: TruthMetadataOptions,
): ReportTruthMetadata {
  const base = createEmptyTruthMetadata(defaults);
  if (!isRecord(value)) {
    return {
      ...base,
      availability: base.availability ?? inferAvailabilityFromTruth(base),
    };
  }

  const reasonCodeKeys = options?.reasonCodeKeys ?? ["reason_codes"];
  const insufficientReasonKeys = options?.insufficientReasonKeys ?? ["insufficient_reason"];
  const insufficientReason =
    insufficientReasonKeys.map((key) => readString(value[key])).find((entry) => entry !== null) ?? base.insufficientReason;

  const truth = createEmptyTruthMetadata({
    ...base,
    availability: readEnumString(value.availability, ["available", "limited", "unavailable"] as const) ?? base.availability,
    confidence: normalizeTruthConfidence(value.confidence) ?? base.confidence,
    confidenceAdjusted: readBoolean(value.confidence_adjusted) ?? base.confidenceAdjusted,
    evidenceStrength: readEnumString(value.evidence_strength, ["none", "weak", "moderate", "strong"] as const) ?? base.evidenceStrength,
    insufficientReason,
    reasonCodes: [...base.reasonCodes, ...collectReasonCodesFromKeys(value, reasonCodeKeys)],
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
    const rawKeys = Object.keys(raw).filter((key) => !EXCLUDED_TYPED_SECTION_KEYS.has(key));
    const orderedKeys = [
      ...SECTION_KEY_ORDER.filter((key) => rawKeys.includes(key)),
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
          supportingContextReasonCodes: [],
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
        supportingContextReasonCodes: collectReasonCodes(entry.supporting_context_reason_codes),
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

function readAudienceGrowthSignals(records: Record<string, unknown>[]): ReportAudienceGrowthSignalsViewModel | null {
  const raw = readRecordFromPaths(records, [
    "sections.audience_growth_signals",
    "audience_growth_signals",
    "report.sections.audience_growth_signals",
    "report.audience_growth_signals",
  ]);
  if (!raw) {
    return null;
  }

  const summaryRecord = isRecord(raw.summary) ? raw.summary : null;
  const includedSources = Array.isArray(raw.included_sources)
    ? raw.included_sources
        .map((entry) => {
          if (!isRecord(entry)) {
            return null;
          }

          const label = readStringFromRecord(entry, ["label", "title", "name"]);
          if (!label) {
            return null;
          }

          return {
            platform: readString(entry.platform),
            label,
            included: entry.included !== false,
            latestPeriodLabel: readString(entry.latest_period_label ?? entry.latestPeriodLabel),
            dataType: readString(entry.data_type ?? entry.dataType),
          };
        })
        .filter((entry): entry is ReportAudienceGrowthIncludedSourceViewModel => entry !== null)
    : [];

  const metricLabels: Record<string, string> = {
    followers_trend: "Followers Trend",
    reach_trend: "Reach Trend",
    interaction_trend: "Interaction Trend",
    video_views_trend: "Video Views Trend",
    engagement_trend: "Engagement Trend",
    subscribers_trend: "Subscribers Trend",
    views_or_watch_time_trend: "Views / Watch Time Trend",
    ctr_trend: "CTR Trend",
  };

  const platformCards = Array.isArray(raw.platform_cards)
    ? raw.platform_cards
        .map((entry) => {
          if (!isRecord(entry)) {
            return null;
          }

          const label = readStringFromRecord(entry, ["label", "title", "name"]);
          if (!label) {
            return null;
          }

          const metricsRecord = isRecord(entry.metrics) ? entry.metrics : null;
          const metrics = metricsRecord
            ? Object.entries(metricsRecord)
                .map(([id, value]) => {
                  const text = readString(value);
                  if (!text) {
                    return null;
                  }

                  return {
                    id,
                    label: metricLabels[id] ?? toLabel(id),
                    value: text,
                  };
                })
                .filter((metric): metric is ReportAudienceGrowthMetricViewModel => metric !== null)
                .slice(0, 3)
            : [];

          return {
            platform: readString(entry.platform),
            label,
            included: entry.included !== false,
            metrics,
            insight: readStringFromRecord(entry, ["insight", "summary", "description", "text"]),
          };
        })
        .filter((entry): entry is ReportAudienceGrowthPlatformCardViewModel => entry !== null)
    : [];

  const diagnosisRecord = isRecord(raw.diagnosis) ? raw.diagnosis : null;
  const diagnosis = diagnosisRecord
    ? {
        strongestSignal: readString(diagnosisRecord.strongest_signal ?? diagnosisRecord.strongestSignal),
        watchout: readString(diagnosisRecord.watchout),
        nextBestMove: readString(diagnosisRecord.next_best_move ?? diagnosisRecord.nextBestMove),
      }
    : null;

  const hasRenderableSummary =
    readNumber(summaryRecord?.creator_score ?? summaryRecord?.creatorScore) !== null ||
    readNumber(summaryRecord?.source_coverage ?? summaryRecord?.sourceCoverage) !== null ||
    readNumber(summaryRecord?.audience_momentum ?? summaryRecord?.audienceMomentum) !== null ||
    readNumber(summaryRecord?.engagement_signal ?? summaryRecord?.engagementSignal) !== null;
  const trustNote = readString(raw.trust_note ?? raw.trustNote);

  if (!hasRenderableSummary && includedSources.length === 0 && platformCards.length === 0 && !diagnosis && !trustNote) {
    return null;
  }

  return {
    title: readStringFromRecord(raw, ["title", "heading", "name"]) ?? "Audience & Growth Signals",
    subtitle: readStringFromRecord(raw, ["subtitle", "description", "overview"]),
    summary: {
      creatorScore: readNumber(summaryRecord?.creator_score ?? summaryRecord?.creatorScore),
      sourceCoverage: readNumber(summaryRecord?.source_coverage ?? summaryRecord?.sourceCoverage),
      audienceMomentum: readNumber(summaryRecord?.audience_momentum ?? summaryRecord?.audienceMomentum),
      engagementSignal: readNumber(summaryRecord?.engagement_signal ?? summaryRecord?.engagementSignal),
    },
    includedSources,
    platformCards,
    diagnosis:
      diagnosis && (diagnosis.strongestSignal || diagnosis.watchout || diagnosis.nextBestMove)
        ? diagnosis
        : null,
    trustNote,
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

function readDiagnosisPrimitives(value: unknown): ReportDiagnosisPrimitivesViewModel | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    revenueTrendDirection: readEnumString(value.revenue_trend_direction ?? value.revenueTrendDirection, DIAGNOSIS_DIRECTIONS) ?? "unknown",
    activeSubscribersDirection: readEnumString(value.active_subscribers_direction ?? value.activeSubscribersDirection, DIAGNOSIS_DIRECTIONS) ?? "unknown",
    churnPressureLevel: readEnumString(value.churn_pressure_level ?? value.churnPressureLevel, PRESSURE_LEVELS) ?? "unknown",
    concentrationPressureLevel: readEnumString(value.concentration_pressure_level ?? value.concentrationPressureLevel, PRESSURE_LEVELS) ?? "unknown",
    monetizationEfficiencyLevel: readEnumString(value.monetization_efficiency_level ?? value.monetizationEfficiencyLevel, PRESSURE_LEVELS) ?? "unknown",
    stabilityDirection: readEnumString(value.stability_direction ?? value.stabilityDirection, DIAGNOSIS_DIRECTIONS) ?? "unknown",
    evidenceStrength: readEnumString(value.evidence_strength ?? value.evidenceStrength, ["none", "weak", "moderate", "strong"] as const),
    dataQualityLevel: readString(value.data_quality_level ?? value.dataQualityLevel),
    analysisMode: readString(value.analysis_mode ?? value.analysisMode),
  };
}

function readDiagnosisSupportingMetrics(
  value: unknown,
  defaults: Partial<ReportTruthMetadata>,
): ReportDiagnosisSupportingMetricViewModel[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!isRecord(entry)) {
        return null;
      }

      const metric = readString(entry.metric);
      if (!metric) {
        return null;
      }

      return {
        ...buildTruthMetadata(entry, defaults),
        metric,
        currentValue: readNumber(entry.current_value ?? entry.currentValue),
        priorValue: readNumber(entry.prior_value ?? entry.priorValue),
        direction: readEnumString(entry.direction, DIAGNOSIS_DIRECTIONS) ?? "unknown",
        source: readString(entry.source),
      };
    })
    .filter((entry): entry is ReportDiagnosisSupportingMetricViewModel => entry !== null);
}

function buildDiagnosisFallbackRecord(records: Record<string, unknown>[]): Record<string, unknown> | null {
  const diagnosisType = readStringFromPaths(records, [
    "diagnosis_type",
    "diagnosisType",
    "primary_constraint_type",
    "primaryConstraintType",
    "report.diagnosis_type",
    "report.diagnosisType",
    "report.primary_constraint_type",
    "report.primaryConstraintType",
  ]);
  const summaryText = readStringFromPaths(records, [
    "diagnosis_summary",
    "diagnosisSummary",
    "primary_constraint_summary",
    "primaryConstraintSummary",
    "report.diagnosis_summary",
    "report.diagnosisSummary",
    "report.primary_constraint_summary",
    "report.primaryConstraintSummary",
  ]);

  if (!diagnosisType && !summaryText) {
    return null;
  }

  return {
    ...(diagnosisType ? { diagnosis_type: diagnosisType } : {}),
    ...(summaryText ? { summary_text: summaryText } : {}),
  };
}

function readDiagnosis(records: Record<string, unknown>[], defaults: Partial<ReportTruthMetadata>): ReportDiagnosisViewModel | null {
  const raw =
    readRecordFromPaths(records, [
      "diagnosis",
      "primary_constraint",
      "primaryConstraint",
      "report.diagnosis",
      "report.primary_constraint",
      "report.primaryConstraint",
      "sections.diagnosis",
      "sections.primary_constraint",
      "sections.primaryConstraint",
      "report.sections.diagnosis",
      "report.sections.primary_constraint",
      "report.sections.primaryConstraint",
    ]) ?? buildDiagnosisFallbackRecord(records);
  if (!raw) {
    return null;
  }

  const diagnosisType = readEnumString(
    raw.diagnosis_type ?? raw.diagnosisType ?? raw.primary_constraint_type ?? raw.primaryConstraintType,
    DIAGNOSIS_TYPES,
  );
  const summaryText = readStringFromRecord(raw, [
    "summary_text",
    "summaryText",
    "diagnosis_summary",
    "diagnosisSummary",
    "primary_constraint_summary",
    "primaryConstraintSummary",
    "summary",
    "description",
    "body",
  ]);
  const supportingMetrics = readDiagnosisSupportingMetrics(raw.supporting_metrics ?? raw.supportingMetrics, defaults);
  const primitives = readDiagnosisPrimitives(raw.primitives);
  if (!diagnosisType && !summaryText && supportingMetrics.length === 0 && !primitives) {
    return null;
  }

  return {
    ...buildTruthMetadata(raw, defaults),
    diagnosisType,
    summaryText,
    supportingMetrics,
    primitives,
  };
}

function readComparisonDelta(
  metric: string,
  value: unknown,
  defaults: Partial<ReportTruthMetadata>,
): ReportComparisonDeltaViewModel | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    ...buildTruthMetadata(value, defaults),
    metric: readString(value.metric) ?? metric,
    currentValue: readNumber(value.current_value ?? value.currentValue),
    priorValue: readNumber(value.prior_value ?? value.priorValue),
    absoluteDelta: readNumber(value.absolute_delta ?? value.absoluteDelta),
    percentDelta: readNumber(value.percent_delta ?? value.percentDelta),
    direction: readEnumString(value.direction, COMPARISON_DIRECTIONS) ?? "unknown",
    comparable: readBoolean(value.comparable) ?? false,
  };
}

function readComparisonItems(value: unknown, defaults: Partial<ReportTruthMetadata>): ReportComparisonItemViewModel[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!isRecord(entry)) {
        return null;
      }

      const summaryText = readString(entry.summary_text ?? entry.summaryText);
      if (!summaryText) {
        return null;
      }

      return {
        ...buildTruthMetadata(entry, defaults),
        category: readString(entry.category),
        metric: readString(entry.metric),
        changeType: readEnumString(entry.change_type ?? entry.changeType, COMPARISON_CHANGE_TYPES),
        direction: readEnumString(entry.direction, COMPARISON_DIRECTIONS) ?? "unknown",
        materiality: readEnumString(entry.materiality, COMPARISON_MATERIALITY),
        summaryText,
      };
    })
    .filter((entry): entry is ReportComparisonItemViewModel => entry !== null);
}

function readComparisonDeltas(
  value: unknown,
  defaults: Partial<ReportTruthMetadata>,
): Record<string, ReportComparisonDeltaViewModel> {
  if (!isRecord(value)) {
    return {};
  }

  const entries = Object.entries(value)
    .map(([metric, entry]) => {
      const normalized = readComparisonDelta(metric, entry, defaults);
      return normalized ? ([metric, normalized] as const) : null;
    })
    .filter((entry): entry is readonly [string, ReportComparisonDeltaViewModel] => entry !== null);

  return Object.fromEntries(entries);
}

function readWhatChanged(records: Record<string, unknown>[], defaults: Partial<ReportTruthMetadata>): ReportWhatChangedViewModel | null {
  const raw = readRecordFromPaths(records, [
    "what_changed",
    "whatChanged",
    "report.what_changed",
    "report.whatChanged",
    "sections.what_changed",
    "sections.whatChanged",
    "report.sections.what_changed",
    "report.sections.whatChanged",
  ]);
  if (!raw) {
    return null;
  }

  const comparisonAvailable = readBoolean(raw.comparison_available ?? raw.comparisonAvailable);
  const priorReportId = readString(raw.prior_report_id ?? raw.priorReportId);
  const whatImproved = readComparisonItems(raw.what_improved ?? raw.whatImproved, defaults);
  const whatWorsened = readComparisonItems(raw.what_worsened ?? raw.whatWorsened, defaults);
  const watchNext = readComparisonItems(raw.watch_next ?? raw.watchNext, defaults);
  const deltas = readComparisonDeltas(raw.deltas, defaults);
  if (
    comparisonAvailable === null &&
    !priorReportId &&
    Object.keys(deltas).length === 0 &&
    whatImproved.length === 0 &&
    whatWorsened.length === 0 &&
    watchNext.length === 0
  ) {
    return null;
  }

  return {
    ...buildTruthMetadata(raw, defaults, { reasonCodeKeys: ["comparison_reason_codes", "comparisonReasonCodes", "reason_codes", "reasonCodes"] }),
    comparisonAvailable: comparisonAvailable ?? false,
    priorReportId,
    priorPeriodStart: readString(raw.prior_period_start ?? raw.priorPeriodStart),
    priorPeriodEnd: readString(raw.prior_period_end ?? raw.priorPeriodEnd),
    comparableMetricCount: readNumber(raw.comparable_metric_count ?? raw.comparableMetricCount) ?? 0,
    comparisonBasisMetrics: uniqueStrings(toStringArray(raw.comparison_basis_metrics ?? raw.comparisonBasisMetrics)),
    deltas,
    whatImproved,
    whatWorsened,
    watchNext,
  };
}

function emptyModel(): ReportViewModel {
  return {
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
    diagnosis: null,
    whatChanged: null,
    metricSnapshot: null,
    metricProvenance: {},
    signals: [],
    recommendations: [],
    outlook: null,
    stability: null,
    audienceGrowthSignals: null,
  };
}

export function normalizeArtifactToReportModel(artifact: unknown): NormalizeArtifactResult {
  const warnings: string[] = [];
  const model = emptyModel();

  if (!isRecord(artifact)) {
    warnings.push("Artifact payload is not an object.");
    return { model, warnings };
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
      diagnosis: readDiagnosis(records, truthDefaults),
      whatChanged: readWhatChanged(records, truthDefaults),
      metricSnapshot: readMetricSnapshot(records),
      metricProvenance: readMetricProvenance(records, truthDefaults),
      signals: readSignals(namedSections?.prioritized_insights, truthDefaults),
      recommendations: readRecommendations(namedSections?.ranked_recommendations ?? namedSections?.recommendations, truthDefaults),
      outlook: readOutlook(namedSections?.outlook, truthDefaults),
      stability: readStability(namedSections?.stability, truthDefaults),
      audienceGrowthSignals: readAudienceGrowthSignals(records),
    },
    warnings,
  };
}
