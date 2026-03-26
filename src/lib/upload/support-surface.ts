import type { SourceManifestResponse, UploadPlatform } from "@/src/lib/api/upload";
import {
  buildUploadPlatformCardsFromManifest,
  getStaticSourceManifest,
  getStaticVisibleUploadPlatformCards,
  type NormalizedSourceManifest,
  normalizeSourceManifestResponse,
  type UploadPlatformCardMetadata,
} from "./platform-metadata";
import { formatGuidanceLabelList } from "./guidance-labels";

export { getStaticVisibleUploadPlatformCards };

export function getStaticVisibleUploadPlatformLabels(): string[] {
  return getStaticVisibleUploadPlatformCards().map((card) => card.label);
}

function buildFormatGuidanceSegments(cards: UploadPlatformCardMetadata[]): string[] {
  const csvOnly = cards.filter((card) => card.acceptedExtensions.includes(".csv") && !card.acceptedExtensions.includes(".zip"));
  const csvAndZip = cards.filter((card) => card.acceptedExtensions.includes(".csv") && card.acceptedExtensions.includes(".zip"));
  const zipOnly = cards.filter((card) => !card.acceptedExtensions.includes(".csv") && card.acceptedExtensions.includes(".zip"));
  const segments: string[] = [];

  if (csvOnly.length > 0) {
    const labels = csvOnly.map((card) => card.label);
    segments.push(`${formatGuidanceLabelList(labels)} ${labels.length === 1 ? "uses" : "use"} supported CSV inputs.`);
  }

  if (csvAndZip.length > 0) {
    const labels = csvAndZip.map((card) => card.label);
    segments.push(`${formatGuidanceLabelList(labels)} ${labels.length === 1 ? "accepts" : "accept"} supported CSV or allowlisted ZIP inputs.`);
  }

  if (zipOnly.length > 0) {
    const labels = zipOnly.map((card) => card.label);
    segments.push(`${formatGuidanceLabelList(labels)} ${labels.length === 1 ? "accepts" : "accept"} allowlisted ZIP inputs only.`);
  }

  return segments;
}

export function buildVisibleUploadPlatformCardsFromSourceManifest(
  manifest: SourceManifestResponse | NormalizedSourceManifest | null | undefined,
): UploadPlatformCardMetadata[] | null {
  const normalized =
    manifest &&
    typeof manifest === "object" &&
    Array.isArray((manifest as NormalizedSourceManifest).platforms) &&
    typeof (manifest as NormalizedSourceManifest).eligibilityRule === "string"
      ? (manifest as NormalizedSourceManifest)
      : normalizeSourceManifestResponse(manifest as SourceManifestResponse | null | undefined);

  return normalized ? buildUploadPlatformCardsFromManifest(normalized) : null;
}

export function buildVisibleUploadPlatformIdsFromSourceManifest(
  manifest: SourceManifestResponse | NormalizedSourceManifest | null | undefined,
): UploadPlatform[] | null {
  const cards = buildVisibleUploadPlatformCardsFromSourceManifest(manifest);
  return cards ? cards.map((card) => card.id) : null;
}

export function getSupportedRevenueUploadSummaryFromCards(cards: UploadPlatformCardMetadata[]): string {
  const labels = cards.map((card) => card.label);
  return labels.length > 0 ? formatGuidanceLabelList(labels) : "supported uploads";
}

export function getSupportedRevenueUploadFormatGuidanceFromCards(cards: UploadPlatformCardMetadata[]): string {
  const segments = buildFormatGuidanceSegments(cards);
  const base = segments.length > 0 ? segments.join(" ") : "Upload a supported file for the platform you selected.";
  return `${base} Not every file from a platform will match the supported contract.`;
}

export function getStaticSourceManifestSnapshot(): NormalizedSourceManifest {
  return getStaticSourceManifest();
}
