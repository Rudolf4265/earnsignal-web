export type ReportKpis = {
  netRevenue: number | null;
  subscribers: number | null;
  stabilityIndex: number | null;
  churnVelocity: number | null;
};

export type ReportSectionViewModel = {
  title: string | null;
  bullets: string[];
  paragraphs: string[];
};

export type ReportViewModel = {
  reportId: string | null;
  schemaVersion: string | null;
  createdAt: string | null;
  executiveSummaryParagraphs: string[];
  kpis: ReportKpis;
  sections: ReportSectionViewModel[];
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

        for (const key of ["text", "title", "label", "summary", "description", "headline"]) {
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
  ]);

  const bullets: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (ignoredKeys.has(key)) {
      continue;
    }

    if (key === "kpis" || key === "metrics") {
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
    }
  }

  return uniqueStrings(bullets);
}

function toSection(input: SectionInput, warnings: string[]): ReportSectionViewModel | null {
  const raw = input.value;
  if (!isRecord(raw)) {
    if (!input.allowScalarValue) {
      warnings.push(`${input.contextLabel} ignored because it is not an object.`);
      return null;
    }

    const scalar = readScalarString(raw);
    if (scalar) {
      return {
        title: input.fallbackTitle,
        bullets: [],
        paragraphs: [scalar],
      };
    }

    const bullets = toStringArray(raw);
    if (bullets.length > 0) {
      return {
        title: input.fallbackTitle,
        bullets,
        paragraphs: [],
      };
    }

    warnings.push(`${input.contextLabel} ignored because it has no renderable content.`);
    return null;
  }

  const title = readStringFromRecord(raw, ["title", "heading", "name"]);
  const paragraphs = uniqueStrings([...toStringArray(raw.paragraphs), ...toStringArray(raw.narrative), ...toStringArray(raw.overview)]);
  const fallbackParagraph = readStringFromRecord(raw, ["summary", "description", "text", "headline", "overview"]);
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
    title: finalTitle,
    bullets: finalBullets,
    paragraphs: finalParagraphs,
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

  return {
    netRevenue: readNumberFromRecords(records, withReportPrefix(basePaths.netRevenue)),
    subscribers: readNumberFromRecords(records, withReportPrefix(basePaths.subscribers)),
    stabilityIndex: readNumberFromRecords(records, withReportPrefix(basePaths.stabilityIndex)),
    churnVelocity: readNumberFromRecords(records, withReportPrefix(basePaths.churnVelocity)),
  };
}

function appendOptionalSections(record: Record<string, unknown>, sections: ReportSectionViewModel[]): void {
  const insights = toStringArray(record.insights);
  if (insights.length > 0 && !sections.some((section) => section.title?.toLowerCase() === "key signals")) {
    sections.push({ title: "Key Signals", bullets: insights, paragraphs: [] });
  }

  const recommendations = toStringArray(record.recommendations);
  if (recommendations.length > 0 && !sections.some((section) => section.title?.toLowerCase() === "recommended actions")) {
    sections.push({ title: "Recommended Actions", bullets: recommendations, paragraphs: [] });
  }

  if (isRecord(record.narrative)) {
    const title = readStringFromRecord(record.narrative, ["title"]) ?? "Narrative";
    const paragraphs = toStringArray(record.narrative.paragraphs);
    const bullets = toStringArray(record.narrative.bullets);
    const overview = readStringFromRecord(record.narrative, ["overview"]);
    const finalParagraphs = paragraphs.length > 0 ? paragraphs : overview ? [overview] : [];

    if (finalParagraphs.length > 0 || bullets.length > 0) {
      sections.push({
        title,
        bullets,
        paragraphs: finalParagraphs,
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
    const paragraphs = uniqueStrings([...toStringArray(value.paragraphs), ...toStringArray(value.points), ...toStringArray(value.items)]);
    const fallback = readStringFromRecord(value, ["summary", "headline", "overview", "text", "description"]);
    if (fallback) {
      paragraphs.push(fallback);
    }
    return uniqueStrings(paragraphs);
  }

  warnings.push(`${contextLabel} ignored because it is not renderable.`);
  return [];
}

export function normalizeArtifactToReportModel(artifact: unknown): NormalizeArtifactResult {
  const warnings: string[] = [];
  const emptyModel: ReportViewModel = {
    reportId: null,
    schemaVersion: null,
    createdAt: null,
    executiveSummaryParagraphs: [],
    kpis: {
      netRevenue: null,
      subscribers: null,
      stabilityIndex: null,
      churnVelocity: null,
    },
    sections: [],
  };

  if (!isRecord(artifact)) {
    warnings.push("Artifact payload is not an object.");
    return { model: emptyModel, warnings };
  }

  const reportRecord = isRecord(artifact.report) ? artifact.report : null;
  const primaryRecord = reportRecord ?? artifact;
  const records = primaryRecord === artifact ? [artifact] : [primaryRecord, artifact];

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
    const normalized = toSection(sectionInput, warnings);
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

  appendOptionalSections(primaryRecord, sections);

  return {
    model: {
      reportId: readStringFromRecords(records, ["report_id", "reportId", "id"]),
      schemaVersion: readStringFromRecords(records, ["schema_version", "schemaVersion"]),
      createdAt: readStringFromRecords(records, ["created_at", "createdAt"]),
      executiveSummaryParagraphs,
      kpis: readKpis(records),
      sections,
    },
    warnings,
  };
}
