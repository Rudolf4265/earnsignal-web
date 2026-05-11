import { normalizePlatformsIncluded } from "./source-labeling";

const LEGACY_SNAPSHOT_COVERAGE_NOTE_RE =
  /^Current snapshot reflects the most recent month where all (included )?sources have data(?: \([^)]+\))?\.?$/i;

const REVENUE_SOURCE_LABELS = new Set(["Patreon", "Substack"]);
const AUDIENCE_DISCOVERY_SOURCE_LABELS = new Set(["YouTube", "Instagram", "TikTok"]);

export function rewriteReportSnapshotCoverageNote(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (LEGACY_SNAPSHOT_COVERAGE_NOTE_RE.test(trimmed)) {
    return "Current snapshot reflects the latest available business month. Audience and discovery sources may cover different recent months depending on the uploaded export.";
  }

  return trimmed;
}

export function buildReportSourceRoleLine(platformsIncluded: string[] | null | undefined): string | null {
  const normalizedPlatforms = normalizePlatformsIncluded(platformsIncluded);
  const revenueSources = normalizedPlatforms.filter((platform) => REVENUE_SOURCE_LABELS.has(platform));
  const audienceDiscoverySources = normalizedPlatforms.filter((platform) => AUDIENCE_DISCOVERY_SOURCE_LABELS.has(platform));

  if (revenueSources.length === 0 || audienceDiscoverySources.length === 0) {
    return null;
  }

  return `Revenue sources: ${revenueSources.join(", ")}. Audience and discovery sources: ${audienceDiscoverySources.join(", ")}.`;
}
