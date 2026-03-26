import {
  getStaticVisibleUploadPlatformCards,
  getStaticVisibleUploadPlatformLabels,
  getSupportedRevenueUploadFormatGuidanceFromCards,
  getSupportedRevenueUploadSummaryFromCards,
} from "./support-surface";

export function getSupportedRevenueUploadLabels(): string[] {
  return getStaticVisibleUploadPlatformLabels();
}

export function getSupportedRevenueUploadSummary(): string {
  return getSupportedRevenueUploadSummaryFromCards(getStaticVisibleUploadPlatformCards());
}

export function getSupportedRevenueUploadFormatGuidance(): string {
  return getSupportedRevenueUploadFormatGuidanceFromCards(getStaticVisibleUploadPlatformCards());
}
