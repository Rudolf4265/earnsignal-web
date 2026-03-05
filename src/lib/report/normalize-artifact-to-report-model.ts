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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
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

function readStringFromRecord(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = readString(record[key]);
    if (value) {
      return value;
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
      const asString = readString(entry);
      if (asString) {
        return asString;
      }

      if (isRecord(entry)) {
        for (const key of ["text", "value", "title", "label", "summary", "description"]) {
          const candidate = readString(entry[key]);
          if (candidate) {
            return candidate;
          }
        }
      }

      return null;
    })
    .filter((entry): entry is string => entry !== null);
}

function toSection(raw: unknown, index: number, warnings: string[]): ReportSectionViewModel | null {
  if (!isRecord(raw)) {
    warnings.push(`sections[${index}] ignored because it is not an object.`);
    return null;
  }

  const title = readStringFromRecord(raw, ["title", "heading", "name"]);
  const paragraphs = toStringArray(raw.paragraphs);
  const bulletsFromBullets = toStringArray(raw.bullets);
  const bullets = bulletsFromBullets.length > 0 ? bulletsFromBullets : toStringArray(raw.items);
  const fallbackParagraph = readStringFromRecord(raw, ["summary", "description", "text"]);

  const finalParagraphs = paragraphs.length > 0 ? paragraphs : fallbackParagraph ? [fallbackParagraph] : [];

  if (title === null && finalParagraphs.length === 0 && bullets.length === 0) {
    warnings.push(`sections[${index}] ignored because it has no renderable title, bullets, or paragraphs.`);
    return null;
  }

  return {
    title,
    bullets,
    paragraphs: finalParagraphs,
  };
}

function readKpis(record: Record<string, unknown>, warnings: string[]): ReportKpis {
  const nestedExecutiveSummary = isRecord(record.executive_summary) ? record.executive_summary : null;
  if (record.executive_summary !== undefined && nestedExecutiveSummary === null) {
    warnings.push("executive_summary ignored because it is not an object.");
  }

  const topLevelKpis = isRecord(record.kpis) ? record.kpis : null;
  const nestedKpis = nestedExecutiveSummary && isRecord(nestedExecutiveSummary.kpis) ? nestedExecutiveSummary.kpis : null;
  const source = topLevelKpis ?? nestedKpis;

  if (!source && (record.kpis !== undefined || nestedExecutiveSummary?.kpis !== undefined)) {
    warnings.push("kpis ignored because payload is not an object.");
  }

  return {
    netRevenue: source ? readNumber(source.net_revenue) : null,
    subscribers: source ? readNumber(source.subscribers) : null,
    stabilityIndex: source ? readNumber(source.stability_index) : null,
    churnVelocity: source ? readNumber(source.churn_velocity) : null,
  };
}

function appendOptionalSections(record: Record<string, unknown>, sections: ReportSectionViewModel[]): void {
  const insights = toStringArray(record.insights);
  if (insights.length > 0) {
    sections.push({ title: "Insights", bullets: insights, paragraphs: [] });
  }

  const recommendations = toStringArray(record.recommendations);
  if (recommendations.length > 0) {
    sections.push({ title: "Recommendations", bullets: recommendations, paragraphs: [] });
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

  const executiveSummary = isRecord(artifact.executive_summary) ? artifact.executive_summary : null;
  if (artifact.executive_summary !== undefined && executiveSummary === null) {
    warnings.push("executive_summary ignored because it is not an object.");
  }

  const sections: ReportSectionViewModel[] = [];
  if (artifact.sections !== undefined && !Array.isArray(artifact.sections)) {
    warnings.push("sections ignored because it is not an array.");
  } else if (Array.isArray(artifact.sections)) {
    artifact.sections.forEach((entry, index) => {
      const normalized = toSection(entry, index, warnings);
      if (normalized) {
        sections.push(normalized);
      }
    });
  }

  appendOptionalSections(artifact, sections);

  return {
    model: {
      reportId: readStringFromRecord(artifact, ["report_id", "reportId", "id"]),
      schemaVersion: readStringFromRecord(artifact, ["schema_version", "schemaVersion"]),
      createdAt: readStringFromRecord(artifact, ["created_at", "createdAt"]),
      executiveSummaryParagraphs: executiveSummary ? toStringArray(executiveSummary.paragraphs) : [],
      kpis: readKpis(artifact, warnings),
      sections,
    },
    warnings,
  };
}
