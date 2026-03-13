import type {
  ReportDiagnosisViewModel,
  ReportRecommendationViewModel,
  ReportWhatChangedViewModel,
} from "./normalize-artifact-to-report-model";

export type RecommendationPriorityContext = {
  diagnosis?: ReportDiagnosisViewModel | null;
  whatChanged?: ReportWhatChangedViewModel | null;
};

type RankedRecommendation = {
  recommendation: ReportRecommendationViewModel;
  originalIndex: number;
  modeRank: number;
  contextHits: number;
  evidenceRank: number;
  confidenceRank: number;
  numericConfidence: number;
};

function modeRank(mode: ReportRecommendationViewModel["recommendationMode"]): number {
  if (mode === "action") {
    return 3;
  }
  if (mode === "validate") {
    return 2;
  }
  if (mode === "watch") {
    return 1;
  }

  return 0;
}

function evidenceRank(evidenceStrength: ReportRecommendationViewModel["evidenceStrength"]): number {
  if (evidenceStrength === "strong") {
    return 3;
  }
  if (evidenceStrength === "moderate") {
    return 2;
  }
  if (evidenceStrength === "weak") {
    return 1;
  }

  return 0;
}

function confidenceRank(confidence: ReportRecommendationViewModel["confidence"]): number {
  if (confidence === "high") {
    return 3;
  }
  if (confidence === "medium") {
    return 2;
  }
  if (confidence === "low") {
    return 1;
  }

  return 0;
}

function uniqueCodes(values: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }

    const normalized = trimmed.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(trimmed);
  }

  return result;
}

function collectContextCodes(context: RecommendationPriorityContext): Set<string> {
  const diagnosisCodes = context.diagnosis?.reasonCodes ?? [];
  const comparisonCodes = context.whatChanged
    ? [
        ...context.whatChanged.reasonCodes,
        ...context.whatChanged.whatImproved.flatMap((item) => item.reasonCodes),
        ...context.whatChanged.whatWorsened.flatMap((item) => item.reasonCodes),
        ...context.whatChanged.watchNext.flatMap((item) => item.reasonCodes),
      ]
    : [];

  return new Set(uniqueCodes([...diagnosisCodes, ...comparisonCodes]).map((value) => value.toLowerCase()));
}

function countContextHits(recommendation: ReportRecommendationViewModel, contextCodes: Set<string>): number {
  const candidateCodes = uniqueCodes(
    recommendation.supportingContextReasonCodes.length > 0
      ? recommendation.supportingContextReasonCodes
      : recommendation.reasonCodes,
  );

  return candidateCodes.reduce((count, code) => count + (contextCodes.has(code.toLowerCase()) ? 1 : 0), 0);
}

export function prioritizeRecommendations(
  recommendations: ReportRecommendationViewModel[],
  context: RecommendationPriorityContext,
): ReportRecommendationViewModel[] {
  if (recommendations.length <= 1) {
    return recommendations;
  }

  const contextCodes = collectContextCodes(context);
  const ranked: RankedRecommendation[] = recommendations.map((recommendation, originalIndex) => ({
    recommendation,
    originalIndex,
    modeRank: modeRank(recommendation.recommendationMode),
    contextHits: countContextHits(recommendation, contextCodes),
    evidenceRank: evidenceRank(recommendation.evidenceStrength),
    confidenceRank: confidenceRank(recommendation.confidence),
    numericConfidence: recommendation.confidenceScore ?? -1,
  }));

  ranked.sort((left, right) => {
    if (right.modeRank !== left.modeRank) {
      return right.modeRank - left.modeRank;
    }
    if (right.contextHits !== left.contextHits) {
      return right.contextHits - left.contextHits;
    }
    if (right.evidenceRank !== left.evidenceRank) {
      return right.evidenceRank - left.evidenceRank;
    }
    if (right.confidenceRank !== left.confidenceRank) {
      return right.confidenceRank - left.confidenceRank;
    }
    if (right.numericConfidence !== left.numericConfidence) {
      return right.numericConfidence - left.numericConfidence;
    }

    return left.originalIndex - right.originalIndex;
  });

  return ranked.map((entry) => entry.recommendation);
}
