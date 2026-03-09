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

export type ReportArtifactContractValidationResult = {
  valid: boolean;
  schemaVersion: string | null;
  errors: string[];
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

function toTextList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (typeof entry === "string" && entry.trim()) {
        return entry.trim();
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
    const candidate = readString(record[key]);
    if (candidate) {
      return true;
    }

    return toTextList(record[key]).length > 0;
  });
}

function getRootArtifactRecord(artifact: Record<string, unknown>): { root: Record<string, unknown>; label: string } {
  if (isRecord(artifact.report)) {
    return { root: artifact.report, label: "report" };
  }

  return { root: artifact, label: "artifact" };
}

function validateRequiredSections(sections: Record<string, unknown>, errors: string[]): Partial<Record<RequiredSectionKey, Record<string, unknown>>> {
  const sectionRecords: Partial<Record<RequiredSectionKey, Record<string, unknown>>> = {};
  for (const key of REQUIRED_SECTION_KEYS) {
    const section = sections[key];
    if (!isRecord(section)) {
      errors.push(`Missing required report.sections.${key} object.`);
      continue;
    }

    sectionRecords[key] = section;
  }

  return sectionRecords;
}

function validateRequiredMetrics(sections: Partial<Record<RequiredSectionKey, Record<string, unknown>>>, errors: string[]): void {
  const revenueSnapshot = sections.revenue_snapshot;
  if (revenueSnapshot && !hasPositiveNumber(revenueSnapshot, ["net_revenue", "kpis.net_revenue", "metrics.net_revenue"])) {
    errors.push("report.sections.revenue_snapshot must include net_revenue.");
  }

  const stability = sections.stability;
  if (stability && !hasPositiveNumber(stability, ["stability_index", "kpis.stability_index", "metrics.stability_index"])) {
    errors.push("report.sections.stability must include stability_index.");
  }
}

function validateRequiredNarrative(sections: Partial<Record<RequiredSectionKey, Record<string, unknown>>>, errors: string[]): void {
  const prioritizedInsights = sections.prioritized_insights;
  if (prioritizedInsights && !sectionHasText(prioritizedInsights, ["items", "bullets", "insights", "signals"])) {
    errors.push("report.sections.prioritized_insights must include at least one signal item.");
  }

  const rankedRecommendations = sections.ranked_recommendations;
  if (rankedRecommendations && !sectionHasText(rankedRecommendations, ["items", "bullets", "actions", "recommendations"])) {
    errors.push("report.sections.ranked_recommendations must include at least one recommendation item.");
  }

  const outlook = sections.outlook;
  if (outlook && !sectionHasText(outlook, ["summary", "overview", "paragraphs", "bullets", "items"])) {
    errors.push("report.sections.outlook must include trend preview text.");
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
  const schemaVersion = readString(root.schema_version) ?? readString(root.schemaVersion);
  if (!schemaVersion) {
    errors.push(`Missing ${label}.schema_version.`);
  } else if (schemaVersion !== CURRENT_SCHEMA_VERSION) {
    errors.push(`Unsupported schema_version "${schemaVersion}". Expected "${CURRENT_SCHEMA_VERSION}".`);
  }

  if (!isRecord(root.sections)) {
    errors.push(`Missing ${label}.sections object.`);
  } else {
    const sections = validateRequiredSections(root.sections, errors);
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

