import type { UploadPlatform, UploadSupportMatrixFamily, UploadSupportMatrixResponse } from "@/src/lib/api/upload";
import { getUploadPlatformCardsByIds, type UploadPlatformCardMetadata } from "./platform-metadata";
import { formatGuidanceLabelList } from "./guidance-labels";

const REQUIRED_FAMILY_CLASS = "native_report_driving";
const SUPPORTED_NOW_STATUS = "supported_now";
const INTERNAL_ONLY_MARKERS = [
  "brandconnect",
  "sponsorship_rollup",
  "stripe",
] as const;

export const FALLBACK_VISIBLE_UPLOAD_PLATFORM_IDS: UploadPlatform[] = ["patreon", "substack", "youtube", "instagram", "tiktok"];

type NormalizedSupportFamily = {
  family: string;
  label: string;
  familyClass: string | null;
  isReportDriving: boolean;
  isUserVisibleSupported: boolean;
  supportStatus: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function readBoolean(record: Record<string, unknown>, snakeKey: string, camelKey: string): boolean {
  const value = record[snakeKey] ?? record[camelKey];
  return value === true;
}

function normalizeSupportFamily(raw: UploadSupportMatrixFamily | unknown): NormalizedSupportFamily | null {
  if (!isRecord(raw)) {
    return null;
  }

  return {
    family: normalizeString(raw.family) ?? "",
    label: normalizeString(raw.label) ?? "",
    familyClass: normalizeString(raw.family_class ?? raw.familyClass),
    isReportDriving: readBoolean(raw, "is_report_driving", "isReportDriving"),
    isUserVisibleSupported: readBoolean(raw, "is_user_visible_supported", "isUserVisibleSupported"),
    supportStatus: normalizeString(raw.support_status ?? raw.supportStatus),
  };
}

function isSupportedVisibleFamily(family: NormalizedSupportFamily): boolean {
  return (
    family.supportStatus === SUPPORTED_NOW_STATUS &&
    family.isUserVisibleSupported &&
    family.isReportDriving &&
    family.familyClass === REQUIRED_FAMILY_CLASS
  );
}

function matchesInternalOnlyMarker(value: string): boolean {
  return INTERNAL_ONLY_MARKERS.some((marker) => value.includes(marker));
}

function mapSupportFamilyToVisiblePlatform(family: NormalizedSupportFamily): UploadPlatform | null {
  const combined = `${family.family} ${family.label}`;
  if (matchesInternalOnlyMarker(combined)) {
    return null;
  }

  if (family.family === "patreon" || family.family.startsWith("patreon_") || family.label.includes("patreon")) {
    return "patreon";
  }

  if (family.family === "substack" || family.family.startsWith("substack_") || family.label.includes("substack")) {
    return "substack";
  }

  if (family.family === "youtube" || family.family.startsWith("youtube_") || family.label.includes("youtube")) {
    return "youtube";
  }

  if (combined.includes("instagram_performance") || family.label.includes("instagram performance")) {
    return "instagram";
  }

  if (combined.includes("tiktok_performance") || family.label.includes("tiktok performance")) {
    return "tiktok";
  }

  return null;
}

export function getFallbackVisibleUploadPlatformCards(): UploadPlatformCardMetadata[] {
  return getUploadPlatformCardsByIds(FALLBACK_VISIBLE_UPLOAD_PLATFORM_IDS);
}

export function getFallbackVisibleUploadPlatformLabels(): string[] {
  return getFallbackVisibleUploadPlatformCards().map((card) => card.label);
}

function getPlatformLabelsByImportMode(cards: UploadPlatformCardMetadata[], importMode: UploadPlatformCardMetadata["importMode"]): string[] {
  return cards.filter((card) => card.importMode === importMode).map((card) => card.label);
}

function formatVerbForLabels(labels: string[]): "use" | "uses" {
  return labels.length === 1 ? "uses" : "use";
}

function buildFormatGuidanceSegments(cards: UploadPlatformCardMetadata[]): string[] {
  const csvLabels = getPlatformLabelsByImportMode(cards, "direct_csv");
  const csvOrZipLabels = getPlatformLabelsByImportMode(cards, "csv_or_zip");
  const zipOnlyLabels = getPlatformLabelsByImportMode(cards, "allowlisted_zip");
  const segments: string[] = [];

  if (csvLabels.length > 0) {
    segments.push(`${formatGuidanceLabelList(csvLabels)} ${formatVerbForLabels(csvLabels)} native CSV exports.`);
  }

  if (csvOrZipLabels.length > 0) {
    segments.push(
      `${formatGuidanceLabelList(csvOrZipLabels)} ${formatVerbForLabels(csvOrZipLabels)} a native CSV or supported Takeout ZIP.`,
    );
  }

  if (zipOnlyLabels.length > 0) {
    segments.push(
      `${formatGuidanceLabelList(zipOnlyLabels)} ${formatVerbForLabels(zipOnlyLabels)} allowlisted ZIP exports only.`,
    );
  }

  return segments;
}

function mergeVisiblePlatformIdsWithFallback(ids: Iterable<UploadPlatform>): UploadPlatform[] {
  const visiblePlatformIds = new Set<UploadPlatform>(FALLBACK_VISIBLE_UPLOAD_PLATFORM_IDS);
  for (const platformId of ids) {
    visiblePlatformIds.add(platformId);
  }
  return FALLBACK_VISIBLE_UPLOAD_PLATFORM_IDS.filter((platformId) => visiblePlatformIds.has(platformId));
}

export function buildVisibleUploadPlatformIdsFromSupportMatrix(
  matrix: UploadSupportMatrixResponse | null | undefined,
): UploadPlatform[] | null {
  if (!matrix || !Array.isArray(matrix.families)) {
    return null;
  }

  const visiblePlatformIds = new Set<UploadPlatform>();

  for (const rawFamily of matrix.families) {
    const family = normalizeSupportFamily(rawFamily);
    if (!family || !isSupportedVisibleFamily(family)) {
      continue;
    }

    const platformId = mapSupportFamilyToVisiblePlatform(family);
    if (platformId) {
      visiblePlatformIds.add(platformId);
    }
  }

  return mergeVisiblePlatformIdsWithFallback(visiblePlatformIds);
}

export function buildVisibleUploadPlatformCardsFromSupportMatrix(
  matrix: UploadSupportMatrixResponse | null | undefined,
): UploadPlatformCardMetadata[] | null {
  const visiblePlatformIds = buildVisibleUploadPlatformIdsFromSupportMatrix(matrix);
  return visiblePlatformIds ? getUploadPlatformCardsByIds(visiblePlatformIds) : null;
}

export function getSupportedRevenueUploadSummaryFromCards(cards: UploadPlatformCardMetadata[]): string {
  const labels = cards.map((card) => card.label);
  return labels.length > 0 ? formatGuidanceLabelList(labels) : "supported uploads";
}

export function getSupportedRevenueUploadFormatGuidanceFromCards(cards: UploadPlatformCardMetadata[]): string {
  const segments = buildFormatGuidanceSegments(cards);
  const base = segments.length > 0 ? segments.join(" ") : "Upload a supported file for the platform you selected.";
  return `${base} Not every CSV or ZIP from a platform will work.`;
}
