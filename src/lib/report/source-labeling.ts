export type ReportKind = "combined" | "single-source" | "unknown";

type CanonicalPlatformName = "Patreon" | "Substack" | "YouTube" | "Instagram" | "TikTok";

const CANONICAL_PLATFORM_ORDER: CanonicalPlatformName[] = ["Patreon", "Substack", "YouTube", "Instagram", "TikTok"];

const PLATFORM_ALIASES: Record<string, CanonicalPlatformName | string> = {
  instagram: "Instagram",
  "instagram reels": "Instagram",
  "instagram stories": "Instagram",
  patreon: "Patreon",
  substack: "Substack",
  "tik tok": "TikTok",
  tiktok: "TikTok",
  youtube: "YouTube",
  yt: "YouTube",
};

const reportPeriodFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeLookupKey(value: string): string {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");
}

function toTitleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeExplicitSourceCount(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  const normalized = Math.trunc(value);
  return normalized > 0 ? normalized : null;
}

function canonicalPlatformRank(value: string): number {
  const index = CANONICAL_PLATFORM_ORDER.indexOf(value as CanonicalPlatformName);
  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}

export function normalizePlatformLabel(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = normalizeWhitespace(value);
  if (!trimmed) {
    return null;
  }

  const normalizedKey = normalizeLookupKey(trimmed);
  if (!normalizedKey) {
    return null;
  }

  const aliased = PLATFORM_ALIASES[normalizedKey];
  if (typeof aliased === "string" && aliased.trim()) {
    return aliased;
  }

  return toTitleCase(normalizedKey);
}

export function normalizePlatformsIncluded(values: string[] | null | undefined): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const deduped = new Map<string, string>();
  for (const value of values) {
    const normalized = normalizePlatformLabel(value);
    if (!normalized) {
      continue;
    }

    const lookupKey = normalizeLookupKey(normalized);
    if (!deduped.has(lookupKey)) {
      deduped.set(lookupKey, normalized);
    }
  }

  return [...deduped.values()].sort((left, right) => {
    const leftRank = canonicalPlatformRank(left);
    const rightRank = canonicalPlatformRank(right);
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return left.localeCompare(right, "en-US");
  });
}

export function resolveReportSourceCount(input: { platformsIncluded?: string[] | null; sourceCount?: number | null }): number | null {
  const platformsIncluded = normalizePlatformsIncluded(input.platformsIncluded);
  const explicitSourceCount = normalizeExplicitSourceCount(input.sourceCount);
  if (platformsIncluded.length > 0 && explicitSourceCount !== null) {
    return Math.max(platformsIncluded.length, explicitSourceCount);
  }

  if (platformsIncluded.length > 0) {
    return platformsIncluded.length;
  }

  return explicitSourceCount;
}

export function resolveReportKind(input: { platformsIncluded?: string[] | null; sourceCount?: number | null }): ReportKind {
  const sourceCount = resolveReportSourceCount(input);
  if (sourceCount === 1) {
    return "single-source";
  }

  if (sourceCount !== null && sourceCount >= 2) {
    return "combined";
  }

  return "unknown";
}

export function formatReportPeriodLabel(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    if (!value) {
      continue;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      continue;
    }

    return reportPeriodFormatter.format(date);
  }

  return null;
}

export function buildCanonicalReportTitle(input: {
  createdAt?: string | null;
  coverageEnd?: string | null;
  coverageStart?: string | null;
  platformsIncluded?: string[] | null;
  sourceCount?: number | null;
  updatedAt?: string | null;
}): string {
  const platformsIncluded = normalizePlatformsIncluded(input.platformsIncluded);
  const sourceCount = resolveReportSourceCount({
    platformsIncluded,
    sourceCount: input.sourceCount,
  });
  const periodLabel = formatReportPeriodLabel(input.coverageEnd, input.coverageStart, input.createdAt, input.updatedAt);

  if (platformsIncluded.length === 1) {
    return periodLabel ? `${platformsIncluded[0]} Report — ${periodLabel}` : `${platformsIncluded[0]} Report`;
  }

  if (platformsIncluded.length >= 2 && platformsIncluded.length <= 3) {
    if (sourceCount === null || sourceCount === platformsIncluded.length) {
      return `Combined Report — ${platformsIncluded.join(" + ")}`;
    }
  }

  if (sourceCount !== null && sourceCount >= 2) {
    return `Combined Report — ${sourceCount} ${sourceCount === 1 ? "Source" : "Sources"}`;
  }

  if (sourceCount === 1) {
    return periodLabel ? `Single-Source Report — ${periodLabel}` : "Single-Source Report";
  }

  return periodLabel ? `Creator Report — ${periodLabel}` : "Creator Report";
}

export function formatIncludedSourceCountLabel(sourceCount: number | null): string | null {
  if (sourceCount === null) {
    return null;
  }

  return `${sourceCount} ${sourceCount === 1 ? "source" : "sources"} included`;
}

export function formatPlatformsSummaryLabel(platformsIncluded: string[] | null | undefined): string | null {
  const normalizedPlatforms = normalizePlatformsIncluded(platformsIncluded);
  if (normalizedPlatforms.length === 0) {
    return null;
  }

  return normalizedPlatforms.join(" / ");
}

export function buildReportFraming(input: { platformsIncluded?: string[] | null; sourceCount?: number | null }): {
  badgeLabel: string;
  helperText: string | null;
} {
  const kind = resolveReportKind(input);
  if (kind === "single-source") {
    return {
      badgeLabel: "Single-Source Report",
      helperText: "Add another source to deepen your analysis.",
    };
  }

  if (kind === "combined") {
    return {
      badgeLabel: "Combined Report",
      helperText: "Built from multiple creator data sources.",
    };
  }

  return {
    badgeLabel: "Creator Report",
    helperText: null,
  };
}
