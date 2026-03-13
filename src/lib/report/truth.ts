export type ReportAvailability = "available" | "limited" | "unavailable";
export type ReportConfidenceLevel = "high" | "medium" | "low";
export type ReportEvidenceStrength = "none" | "weak" | "moderate" | "strong";
export type ReportRecommendationMode = "action" | "watch" | "validate";
export type ReportTruthTone = "good" | "warn" | "neutral";

export type ReportTruthMetadata = {
  availability: ReportAvailability | null;
  confidence: ReportConfidenceLevel | null;
  confidenceAdjusted: boolean;
  evidenceStrength: ReportEvidenceStrength | null;
  insufficientReason: string | null;
  reasonCodes: string[];
  dataQualityLevel: string | null;
  analysisMode: string | null;
  recommendationMode: ReportRecommendationMode | null;
};

const REASON_LABELS: Record<string, string> = {
  active_subscribers_unavailable: "active subscriber evidence is unavailable",
  churn_evidence_unavailable: "churn evidence is unavailable",
  data_quality_needs_attention: "data quality needs attention",
  limited_evidence: "evidence is limited",
  limited_monthly_history: "monthly history is limited",
  missing_monthly_history: "monthly history is missing",
  missing_platform_mix: "platform mix data is missing",
  missing_subscriber_evidence: "subscriber evidence is missing",
  missing_subscriber_snapshot: "subscriber snapshots are missing",
  platform_risk_confidence_limited: "platform risk is based on limited history",
  platform_risk_evidence_unavailable: "platform risk evidence is unavailable",
};

function humanizeToken(value: string): string {
  const normalized = value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
  return normalized.length > 0 ? normalized : "limited evidence";
}

export function createEmptyTruthMetadata(overrides?: Partial<ReportTruthMetadata>): ReportTruthMetadata {
  const base: ReportTruthMetadata = {
    availability: null,
    confidence: null,
    confidenceAdjusted: false,
    evidenceStrength: null,
    insufficientReason: null,
    reasonCodes: [],
    dataQualityLevel: null,
    analysisMode: null,
    recommendationMode: null,
    ...overrides,
  };

  return {
    ...base,
    reasonCodes: Array.isArray(overrides?.reasonCodes) ? Array.from(new Set(overrides.reasonCodes.filter(Boolean))) : [],
  };
}

export function normalizeTruthConfidence(value: unknown): ReportConfidenceLevel | null {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "high" || normalized === "medium" || normalized === "low") {
      return normalized;
    }
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    if (value >= 0.75) {
      return "high";
    }
    if (value >= 0.55) {
      return "medium";
    }
    return "low";
  }

  return null;
}

export function inferAvailabilityFromTruth(
  value: Pick<ReportTruthMetadata, "availability" | "evidenceStrength" | "confidenceAdjusted">,
): ReportAvailability | null {
  if (value.availability) {
    return value.availability;
  }

  if (value.evidenceStrength === "none") {
    return "unavailable";
  }
  if (value.evidenceStrength === "weak" || value.evidenceStrength === "moderate" || value.confidenceAdjusted) {
    return "limited";
  }
  if (value.evidenceStrength === "strong") {
    return "available";
  }

  return null;
}

export function describeInsufficientReason(reason: string | null | undefined): string | null {
  if (typeof reason !== "string") {
    return null;
  }

  const trimmed = reason.trim();
  if (!trimmed) {
    return null;
  }

  return REASON_LABELS[trimmed] ?? humanizeToken(trimmed);
}

type TruthDescriptorOptions = {
  source?: string | null;
};

export function getTruthStateLabel(truth: ReportTruthMetadata, options?: TruthDescriptorOptions): string | null {
  const availability = inferAvailabilityFromTruth(truth);
  const source = options?.source?.trim().toLowerCase() ?? null;

  if (truth.recommendationMode === "validate") {
    return "Validate first";
  }
  if (truth.recommendationMode === "watch") {
    return "Watch next cycle";
  }
  if (availability === "unavailable") {
    return "Unavailable";
  }
  if (source && (source === "derived" || source === "computed") && truth.confidence !== "high") {
    return "Heuristic signal";
  }
  if (truth.confidenceAdjusted) {
    return "Reduced confidence";
  }
  if (availability === "limited") {
    return "Limited evidence";
  }
  if (truth.confidence === "low") {
    return "Low confidence";
  }

  return null;
}

export function getTruthStateTone(truth: ReportTruthMetadata, options?: TruthDescriptorOptions): ReportTruthTone {
  const availability = inferAvailabilityFromTruth(truth);
  const source = options?.source?.trim().toLowerCase() ?? null;

  if (truth.recommendationMode === "validate" || availability === "unavailable") {
    return "warn";
  }
  if (truth.recommendationMode === "watch") {
    return "neutral";
  }
  if (truth.confidenceAdjusted || availability === "limited" || truth.confidence === "low") {
    return "warn";
  }
  if (source && (source === "derived" || source === "computed") && truth.confidence !== "high") {
    return "neutral";
  }

  return "good";
}

export function getTruthStateDescription(truth: ReportTruthMetadata, options?: TruthDescriptorOptions): string | null {
  const availability = inferAvailabilityFromTruth(truth);
  const reason = describeInsufficientReason(truth.insufficientReason);
  const source = options?.source?.trim().toLowerCase() ?? null;

  if (truth.recommendationMode === "validate") {
    return reason ? `Validate before acting because ${reason}.` : "Validate before acting because the evidence is still limited.";
  }
  if (truth.recommendationMode === "watch") {
    return reason ? `Watch this signal next cycle because ${reason}.` : "Watch this signal next cycle before taking a larger action.";
  }
  if (availability === "unavailable") {
    return reason ? `Unavailable for this report because ${reason}.` : "Unavailable for this report.";
  }
  if (source && (source === "derived" || source === "computed") && truth.confidence !== "high") {
    return "Heuristic signal based on the available monthly data.";
  }
  if (truth.confidenceAdjusted) {
    return reason ? `Reduced confidence because ${reason}.` : "Reduced confidence because evidence is limited.";
  }
  if (availability === "limited") {
    return reason ? `Limited evidence because ${reason}.` : "Limited evidence in this report.";
  }
  if (truth.confidence === "low") {
    return "Low-confidence signal.";
  }

  return null;
}
