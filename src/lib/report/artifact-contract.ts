const CURRENT_SCHEMA_VERSION = "v1";

const REQUIRED_SECTION_KEYS = [
  "executive_summary",
  "revenue_snapshot",
  "stability",
  "prioritized_insights",
  "ranked_recommendations",
  "outlook",
] as const;

type RequiredSectionKey = (typeof REQUIRED_SECTION_KEYS)[number];
type SectionShape = "object" | "object_or_array";

const REQUIRED_SECTION_SHAPES: Record<RequiredSectionKey, SectionShape> = {
  executive_summary: "object",
  revenue_snapshot: "object",
  stability: "object",
  prioritized_insights: "object_or_array",
  ranked_recommendations: "object_or_array",
  outlook: "object",
};

export type ReportArtifactContractValidationResult = {
  valid: boolean;
  schemaVersion: string | null;
  errors: string[];
};

export { isRecord, readString, readNumber };

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

function readPath(record: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!isRecord(current)) {
      return undefined;
    }

    return current[key];
  }, record);
}

function hasPositiveNumber(record: Record<string, unknown>, paths: string[]): boolean {
  return paths.some((path) => readNumber(readPath(record, path)) !== null);
}

function hasRenderableScalar(value: unknown): boolean {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value === "boolean") {
    return true;
  }

  return false;
}

function hasRenderableValue(value: unknown, depth = 0): boolean {
  if (depth > 3) {
    return false;
  }

  if (hasRenderableScalar(value)) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some((entry) => hasRenderableValue(entry, depth + 1));
  }

  if (isRecord(value)) {
    return Object.values(value).some((entry) => hasRenderableValue(entry, depth + 1));
  }

  return false;
}

function toTextList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (typeof entry === "string" && entry.trim()) {
        return entry.trim();
      }

      if (typeof entry === "number" && Number.isFinite(entry)) {
        return String(entry);
      }

      if (!isRecord(entry)) {
        return null;
      }

      for (const key of ["text", "summary", "description", "label", "title", "headline", "value"]) {
        const candidate = readString(entry[key]);
        if (candidate) {
          return candidate;
        }
      }

      return null;
    })
    .filter((entry): entry is string => entry !== null);
}

function sectionHasText(record: Record<string, unknown>, keys: string[]): boolean {
  return keys.some((key) => {
    const value = record[key];
    if (hasRenderableScalar(value)) {
      return true;
    }

    if (toTextList(value).length > 0) {
      return true;
    }

    return hasRenderableValue(value);
  });
}

function getRootArtifactRecord(artifact: Record<string, unknown>): { root: Record<string, unknown>; label: string } {
  if (isRecord(artifact.report)) {
    return { root: artifact.report, label: "report" };
  }

  return { root: artifact, label: "artifact" };
}

function validateRequiredSections(
  sections: Record<string, unknown>,
  errors: string[],
  label: string,
): Partial<Record<RequiredSectionKey, unknown>> {
  const sectionValues: Partial<Record<RequiredSectionKey, unknown>> = {};
  for (const key of REQUIRED_SECTION_KEYS) {
    const sectionValue = sections[key];
    if (typeof sectionValue === "undefined" || sectionValue === null) {
      errors.push(`Missing required ${label}.sections.${key} object.`);
      continue;
    }

    const expectedShape = REQUIRED_SECTION_SHAPES[key];
    if (expectedShape === "object" && !isRecord(sectionValue)) {
      errors.push(`${label}.sections.${key} must be an object.`);
      continue;
    }

    if (expectedShape === "object_or_array" && !isRecord(sectionValue) && !Array.isArray(sectionValue)) {
      errors.push(`${label}.sections.${key} must be an object or array.`);
      continue;
    }

    sectionValues[key] = sectionValue;
  }

  return sectionValues;
}

function hasSeriesTrendData(section: unknown): boolean {
  if (!isRecord(section)) {
    return false;
  }

  for (const key of ["series", "trend", "timeline", "history", "points", "data"]) {
    const candidate = section[key];
    if (Array.isArray(candidate) && candidate.some((entry) => hasRenderableValue(entry))) {
      return true;
    }
  }

  return false;
}

function sectionHasNarrativeList(section: unknown): boolean {
  if (Array.isArray(section)) {
    return section.some((entry) => hasRenderableValue(entry));
  }

  if (!isRecord(section)) {
    return false;
  }

  return sectionHasText(section, [
    "items",
    "bullets",
    "insights",
    "signals",
    "actions",
    "recommendations",
    "paragraphs",
    "summary",
    "overview",
    "description",
    "text",
  ]);
}

function sectionHasOutlookContent(section: unknown): boolean {
  if (Array.isArray(section)) {
    return section.some((entry) => hasRenderableValue(entry));
  }

  if (!isRecord(section)) {
    return false;
  }

  if (sectionHasText(section, ["summary", "overview", "paragraphs", "bullets", "items"])) {
    return true;
  }

  for (const [key, value] of Object.entries(section)) {
    const normalizedKey = key.toLowerCase();
    if (
      normalizedKey.includes("outlook") ||
      normalizedKey.includes("projection") ||
      normalizedKey.includes("forecast") ||
      normalizedKey.includes("risk")
    ) {
      if (hasRenderableValue(value)) {
        return true;
      }
    }
  }

  return false;
}

function validateRequiredMetrics(sections: Partial<Record<RequiredSectionKey, unknown>>, errors: string[]): void {
  const revenueSnapshot = sections.revenue_snapshot;
  if (
    revenueSnapshot &&
    (!isRecord(revenueSnapshot) ||
      (!hasPositiveNumber(revenueSnapshot, ["net_revenue", "kpis.net_revenue", "metrics.net_revenue"]) &&
        !hasSeriesTrendData(revenueSnapshot)))
  ) {
    errors.push("report.sections.revenue_snapshot must include net_revenue or a non-empty revenue series/trend array.");
  }

  const stability = sections.stability;
  if (
    stability &&
    (!isRecord(stability) || !hasPositiveNumber(stability, ["stability_index", "kpis.stability_index", "metrics.stability_index"]))
  ) {
    errors.push("report.sections.stability must include stability_index.");
  }
}

function validateRequiredNarrative(sections: Partial<Record<RequiredSectionKey, unknown>>, errors: string[]): void {
  const prioritizedInsights = sections.prioritized_insights;
  if (prioritizedInsights && !sectionHasNarrativeList(prioritizedInsights)) {
    errors.push("report.sections.prioritized_insights must include at least one signal item.");
  }

  const rankedRecommendations = sections.ranked_recommendations;
  if (rankedRecommendations && !sectionHasNarrativeList(rankedRecommendations)) {
    errors.push("report.sections.ranked_recommendations must include at least one recommendation item.");
  }

  const outlook = sections.outlook;
  if (outlook && !sectionHasOutlookContent(outlook)) {
    errors.push("report.sections.outlook must include narrative content or nested outlook/projection/risk data.");
  }
}

export function validateReportArtifactContract(artifact: unknown): ReportArtifactContractValidationResult {
  const errors: string[] = [];

  if (!isRecord(artifact)) {
    return {
      valid: false,
      schemaVersion: null,
      errors: ["Artifact JSON payload must be an object."],
    };
  }

  const { root, label } = getRootArtifactRecord(artifact);
  const rootSchemaVersion = readString(root.schema_version) ?? readString(root.schemaVersion);
  const topLevelSchemaVersion = readString(artifact.schema_version) ?? readString(artifact.schemaVersion);

  if (root !== artifact && rootSchemaVersion && topLevelSchemaVersion && rootSchemaVersion !== topLevelSchemaVersion) {
    errors.push(
      `Schema version mismatch between report.schema_version ("${rootSchemaVersion}") and top-level schema_version ("${topLevelSchemaVersion}").`,
    );
  }

  const schemaVersion = rootSchemaVersion ?? topLevelSchemaVersion;
  if (!schemaVersion) {
    errors.push(`Missing ${label}.schema_version (or top-level schema_version).`);
  } else if (schemaVersion !== CURRENT_SCHEMA_VERSION) {
    errors.push(`Unsupported schema_version "${schemaVersion}". Expected "${CURRENT_SCHEMA_VERSION}".`);
  }

  if (!isRecord(root.sections)) {
    errors.push(`Missing ${label}.sections object.`);
  } else {
    const sections = validateRequiredSections(root.sections, errors, label);
    validateRequiredMetrics(sections, errors);
    validateRequiredNarrative(sections, errors);
  }

  return {
    valid: errors.length === 0,
    schemaVersion,
    errors,
  };
}

export function formatReportArtifactContractErrors(errors: string[]): string {
  const unique = Array.from(new Set(errors.map((error) => error.trim()).filter((error) => error.length > 0)));
  if (unique.length === 0) {
    return "Artifact JSON failed schema validation.";
  }

  return `Artifact JSON failed schema validation: ${unique.join(" ")}`;
}
