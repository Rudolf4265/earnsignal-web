export type ReportSectionModel = {
  title: string;
  paragraphs: string[];
  bullets: string[];
};

export type ReportArtifactModel = {
  reportId?: string;
  schemaVersion?: string;
  createdAt?: string;
  executiveSummaryParagraphs: string[];
  insights: string[];
  narrative: string[];
  recommendations: string[];
  kpis: {
    netRevenue?: string;
    subscribers?: string;
    stabilityIndex?: string;
    churnVelocity?: string;
  };
  sections: ReportSectionModel[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function readString(record: Record<string, unknown> | null, keys: string[]): string | undefined {
  if (!record) return undefined;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function readStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function toDisplay(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return `${value}`;
  if (typeof value === "string" && value.trim()) return value.trim();
  return undefined;
}

function readKpiValue(kpis: Record<string, unknown> | null, key: string): string | undefined {
  return toDisplay(kpis?.[key]);
}

function normalizeSection(value: unknown, index: number): ReportSectionModel | null {
  const record = asRecord(value);
  if (!record) return null;

  const title = readString(record, ["title", "heading", "name"]) ?? `Section ${index + 1}`;
  const paragraphs = [
    ...readStringList(record.paragraphs),
    ...readStringList(record.content),
    ...readStringList(record.summary),
    ...readStringList(record.text),
  ];
  const bullets = [
    ...readStringList(record.bullets),
    ...readStringList(record.points),
    ...readStringList(record.items),
  ];

  if (paragraphs.length === 0 && bullets.length === 0) {
    const fallback = Object.entries(record)
      .filter(([, fieldValue]) => typeof fieldValue === "string" && fieldValue.trim().length > 0)
      .map(([, fieldValue]) => String(fieldValue).trim());

    if (fallback.length > 0) {
      return { title, paragraphs: fallback, bullets: [] };
    }
  }

  return { title, paragraphs, bullets };
}

export function normalizeArtifactToReportModel(artifact: Record<string, unknown>): ReportArtifactModel {
  const executiveSummary = asRecord(artifact.executive_summary);
  const topLevelKpis = asRecord(artifact.kpis);
  const executiveSummaryKpis = asRecord(executiveSummary?.kpis);

  const kpis = {
    netRevenue: readKpiValue(topLevelKpis, "net_revenue") ?? readKpiValue(executiveSummaryKpis, "net_revenue"),
    subscribers: readKpiValue(topLevelKpis, "subscribers") ?? readKpiValue(executiveSummaryKpis, "subscribers"),
    stabilityIndex: readKpiValue(topLevelKpis, "stability_index") ?? readKpiValue(executiveSummaryKpis, "stability_index"),
    churnVelocity: readKpiValue(topLevelKpis, "churn_velocity") ?? readKpiValue(executiveSummaryKpis, "churn_velocity"),
  };

  const executiveSummaryParagraphs = [
    ...readStringList(executiveSummary?.paragraphs),
    ...readStringList(executiveSummary?.summary),
    ...readStringList(executiveSummary?.narrative),
    ...readStringList(artifact.narrative),
    ...readStringList(artifact.insights),
  ];

  const sections = Array.isArray(artifact.sections)
    ? artifact.sections.map((section, index) => normalizeSection(section, index)).filter((section): section is ReportSectionModel => section !== null)
    : [];

  return {
    reportId: readString(artifact, ["report_id", "reportId", "id"]),
    schemaVersion: readString(artifact, ["schema_version", "schemaVersion"]),
    createdAt: readString(artifact, ["created_at", "createdAt"]),
    executiveSummaryParagraphs,
    insights: readStringList(artifact.insights),
    narrative: readStringList(artifact.narrative),
    recommendations: readStringList(artifact.recommendations),
    kpis,
    sections,
  };
}

export function hasKpiData(model: ReportArtifactModel): boolean {
  return Boolean(model.kpis.netRevenue || model.kpis.subscribers || model.kpis.stabilityIndex || model.kpis.churnVelocity);
}
