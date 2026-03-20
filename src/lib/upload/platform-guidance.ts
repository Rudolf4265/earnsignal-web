import {
  getFallbackVisibleUploadPlatformCards,
  getFallbackVisibleUploadPlatformLabels,
  getSupportedRevenueUploadFormatGuidanceFromCards,
  getSupportedRevenueUploadSummaryFromCards,
} from "./support-surface";

export function getSupportedRevenueUploadLabels(): string[] {
  return getFallbackVisibleUploadPlatformLabels();
}

export function getSupportedRevenueUploadSummary(): string {
  return getSupportedRevenueUploadSummaryFromCards(getFallbackVisibleUploadPlatformCards());
}

export function getSupportedRevenueUploadFormatGuidance(): string {
  return getSupportedRevenueUploadFormatGuidanceFromCards(getFallbackVisibleUploadPlatformCards());
}
