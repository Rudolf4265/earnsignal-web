import { UPLOAD_PLATFORM_CARDS } from "./platform-metadata";

export function getSupportedRevenueUploadLabels(): string[] {
  return UPLOAD_PLATFORM_CARDS.filter((card) => card.category === "supported" && card.available).map((card) => card.label);
}

export function formatGuidanceLabelList(labels: string[]): string {
  if (labels.length === 0) {
    return "supported platforms";
  }

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

export function getSupportedRevenueUploadSummary(): string {
  const labels = getSupportedRevenueUploadLabels();
  return labels.length > 0 ? `${formatGuidanceLabelList(labels)} CSV exports` : "supported CSV exports";
}
