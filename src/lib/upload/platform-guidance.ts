import { formatGuidanceLabelList } from "./guidance-labels";
import { getFallbackVisibleUploadPlatformLabels } from "./support-surface";

export function getSupportedRevenueUploadLabels(): string[] {
  return getFallbackVisibleUploadPlatformLabels();
}

export function getSupportedRevenueUploadSummary(): string {
  const labels = getSupportedRevenueUploadLabels();
  return labels.length > 0 ? `${formatGuidanceLabelList(labels)} CSV exports` : "supported CSV exports";
}
