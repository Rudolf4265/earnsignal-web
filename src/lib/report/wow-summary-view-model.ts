import type { ReportDetailPresentationModel } from "./detail-presentation";
import type { ReportDetail } from "./normalize-report-detail";
import type { ReportDiagnosisType, ReportViewModel } from "./normalize-artifact-to-report-model";

// ── Types ─────────────────────────────────────────────────────────────────────

export type WowKpiCard = {
  id: string;
  label: string;
  value: string;
  detail: string | null;
};

export type WowOpportunityViewModel = {
  available: boolean;
  finding: string;
  upsideLabel: string | null;
  action: string;
};

export type WowPlatformMixViewModel = {
  concentrationScore: number | null;
  topPlatformLabel: string | null;
  interpretationText: string;
  highlights: string[];
  available: boolean;
};

export type WowTrendDirection = "up" | "down" | "flat" | "unknown";

export type WowMomentumViewModel = {
  revenueTrend: WowTrendDirection;
  subscriberTrend: WowTrendDirection;
  summaryText: string;
  hasPoints: boolean;
};

export type WowStrengthRiskItem = {
  id: string;
  text: string;
};

export type WowStrengthsRisksViewModel = {
  strengths: WowStrengthRiskItem[];
  risks: WowStrengthRiskItem[];
  available: boolean;
};

export type WowNextActionViewModel = {
  id: string;
  title: string;
  detail: string | null;
};

export type ReportWowSummaryViewModel = {
  kpiCards: [WowKpiCard, WowKpiCard, WowKpiCard, WowKpiCard];
  summarySentence: string | null;
  coverage: {
    snapshotCoverageNote: string | null;
    reportHasBusinessMetrics: boolean;
    sectionStrength: ReportDetail["sectionStrength"];
  };
  opportunity: WowOpportunityViewModel;
  platformMix: WowPlatformMixViewModel;
  momentum: WowMomentumViewModel;
  strengthsRisks: WowStrengthsRisksViewModel;
  nextActions: WowNextActionViewModel[];
};

export type BuildReportWowSummaryOptions = {
  includeContinuitySignals?: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const KNOWN_PLATFORMS = ["Patreon", "Substack", "YouTube", "Instagram", "TikTok"];

function extractTopPlatformFromHighlights(highlights: string[]): string | null {
  for (const line of highlights) {
    for (const platform of KNOWN_PLATFORMS) {
      if (line.toLowerCase().includes(platform.toLowerCase())) {
        return platform;
      }
    }
  }
  return null;
}

function toWowDirection(raw: string | null | undefined): WowTrendDirection {
  if (!raw) return "unknown";
  const normalized = raw.toLowerCase();
  if (normalized === "up") return "up";
  if (normalized === "down") return "down";
  if (normalized === "flat") return "flat";
  return "unknown";
}

function buildMomentumSentence(revenue: WowTrendDirection, subs: WowTrendDirection): string {
  if (revenue === "up" && subs === "up") return "Revenue and subscriber growth are both trending up this period.";
  if (revenue === "up" && subs === "flat") return "Revenue is growing, but subscriber growth has flattened.";
  if (revenue === "up" && subs === "down") return "Revenue is growing despite a decline in active subscribers.";
  if (revenue === "up" && subs === "unknown") return "Revenue is trending up. Subscriber direction requires more data.";
  if (revenue === "down" && subs === "up") return "Subscriber growth is positive, but revenue has declined this period.";
  if (revenue === "down" && subs === "down") return "Both revenue and subscriber count declined this period.";
  if (revenue === "down" && subs === "flat") return "Revenue declined while subscribers held steady.";
  if (revenue === "down" && subs === "unknown") return "Revenue is declining. Additional data is needed to assess subscriber trends.";
  if (revenue === "flat" && subs === "up") return "Subscribers are growing but revenue has not yet followed.";
  if (revenue === "flat" && subs === "down") return "Revenue is stable but subscriber count is declining.";
  if (revenue === "flat" && subs === "flat") return "Revenue and subscribers are holding steady this period.";
  if (revenue === "unknown" && subs === "up") return "Subscriber growth is positive. Revenue trend data is limited.";
  if (revenue === "unknown" && subs === "down") return "Subscriber count is declining. Revenue trend data is limited.";
  return "Trend data is limited for this report period.";
}

function buildPlatformInterpretation(
  concentrationScore: number | null,
  topPlatform: string | null,
): string {
  if (concentrationScore === null) {
    return "Platform revenue distribution is not available for this report.";
  }
  const platformLabel = topPlatform ?? "one platform";
  if (concentrationScore >= 80) {
    return `${Math.round(concentrationScore)}% of revenue comes from ${platformLabel}. This creates significant concentration risk.`;
  }
  if (concentrationScore >= 60) {
    return `${Math.round(concentrationScore)}% of revenue is concentrated in ${platformLabel}. Platform dependency is worth monitoring.`;
  }
  if (concentrationScore >= 40) {
    return `Revenue is reasonably distributed. ${platformLabel} leads at ${Math.round(concentrationScore)}%.`;
  }
  return `Revenue is well-diversified across platforms at ${Math.round(concentrationScore)}% peak concentration.`;
}

function buildOpportunityFromDiagnosisType(
  diagnosisType: ReportDiagnosisType | null,
  concentrationScore: number | null,
  topPlatform: string | null,
): WowOpportunityViewModel {
  const platformLabel = topPlatform ?? "your top platform";
  if (diagnosisType === "concentration_pressure") {
    const scoreLabel = concentrationScore !== null ? ` (${Math.round(concentrationScore)}%)` : "";
    return {
      available: true,
      finding: `Revenue is over-concentrated in ${platformLabel}${scoreLabel}, creating fragility if that platform changes.`,
      upsideLabel: "Diversifying could reduce single-platform exposure and improve revenue resilience.",
      action: `Activate a second revenue channel to reduce ${platformLabel} dependency.`,
    };
  }
  if (diagnosisType === "churn_pressure") {
    return {
      available: true,
      finding: "Subscriber churn is outpacing new subscriber acquisition, slowly compressing revenue.",
      upsideLabel: "Reducing churn by 10% could meaningfully extend revenue runway.",
      action: "Identify the tier with the highest cancellation rate and test a targeted re-engagement offer.",
    };
  }
  if (diagnosisType === "monetization_pressure") {
    return {
      available: true,
      finding: "Audience size or reach is strong, but conversion to paid revenue is underperforming.",
      upsideLabel: "Improving paid conversion from existing audience could grow revenue without new followers.",
      action: "Launch a direct paid offer or upgrade prompt targeting your most engaged non-paying audience.",
    };
  }
  if (diagnosisType === "acquisition_pressure") {
    return {
      available: true,
      finding: "New subscriber acquisition has slowed, which will eventually compress revenue growth.",
      upsideLabel: "Improving top-of-funnel reach could restore sustainable subscriber growth.",
      action: "Increase content reach on your fastest-growing channel to widen the acquisition funnel.",
    };
  }
  return {
    available: false,
    finding: "No clear dominant opportunity was identified in this report.",
    upsideLabel: null,
    action: "Review the full report findings for specific next steps.",
  };
}

function formatSignedPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const normalized = Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
  return `${rounded > 0 ? "+" : ""}${normalized}%`;
}

// ── KPI Cards ─────────────────────────────────────────────────────────────────

function buildKpiCards(
  presentation: ReportDetailPresentationModel,
  artifactModel: ReportViewModel | null,
  options?: BuildReportWowSummaryOptions,
): [WowKpiCard, WowKpiCard, WowKpiCard, WowKpiCard] {
  // Card 1: Total Revenue
  const revenueMetric = presentation.heroMetrics.find((m) => m.id === "net_revenue");
  const revenueCard: WowKpiCard = {
    id: "total_revenue",
    label: "Total Revenue",
    value: revenueMetric?.value ?? "$--",
    detail: null,
  };

  // Card 2: Active Subscribers
  const subscriberMetric = presentation.subscriberHealth.metrics.find((m) => m.id === "subscribers");
  const subscribersCard: WowKpiCard = {
    id: "active_subscribers",
    label: "Paid Subscribers",
    value: subscriberMetric?.value ?? "--",
    detail: null,
  };

  // Card 3: Net Growth — try delta, fall back to direction label
  let growthValue = "--";
  let growthDetail: string | null = null;
  const includeContinuitySignals = options?.includeContinuitySignals ?? true;
  const subsDelta = includeContinuitySignals
    ? artifactModel?.whatChanged?.deltas?.["active_subscribers"] ?? artifactModel?.whatChanged?.deltas?.["subscribers"] ?? null
    : null;
  if (subsDelta?.percentDelta !== null && subsDelta?.percentDelta !== undefined) {
    growthValue = formatSignedPercent(subsDelta.percentDelta);
    growthDetail = subsDelta.direction === "up" ? "vs prior period" : subsDelta.direction === "down" ? "vs prior period" : null;
  } else {
    const primitives = presentation.diagnosis.primitives;
    const subsPrimitive = primitives.find((p) => p.label === "Subscriber trend");
    if (subsPrimitive) {
      growthValue = subsPrimitive.value;
      growthDetail = "subscriber trend";
    }
  }
  const growthCard: WowKpiCard = {
    id: "net_growth",
    label: "Net Growth",
    value: growthValue,
    detail: growthDetail,
  };

  // Card 4: Top Platform — parse highlights for known platform names
  const topPlatform = extractTopPlatformFromHighlights(presentation.platformMix.highlights);
  const concentrationScore = presentation.platformMix.concentrationScore;
  let topPlatformValue = "--";
  if (topPlatform) {
    topPlatformValue = concentrationScore !== null ? `${topPlatform} ${Math.round(concentrationScore)}%` : topPlatform;
  } else if (concentrationScore !== null) {
    topPlatformValue = `${Math.round(concentrationScore)}% concentration`;
  }
  const topPlatformCard: WowKpiCard = {
    id: "top_platform",
    label: "Top Platform",
    value: topPlatformValue,
    detail: concentrationScore !== null && concentrationScore >= 60 ? "concentration risk" : null,
  };

  return [revenueCard, subscribersCard, growthCard, topPlatformCard];
}

// ── Summary Sentence ──────────────────────────────────────────────────────────

function buildSummarySentence(
  presentation: ReportDetailPresentationModel,
  artifactModel: ReportViewModel | null,
): string | null {
  // Prefer the first executive summary paragraph if it looks substantive
  const firstParagraph = presentation.executiveSummary[0];
  if (firstParagraph && firstParagraph.length > 40 && !firstParagraph.toLowerCase().startsWith("summary details")) {
    return firstParagraph;
  }
  // Compose from diagnosis
  const diagType = artifactModel?.diagnosis?.diagnosisType;
  if (diagType && diagType !== "insufficient_evidence") {
    return presentation.diagnosis.summary ?? null;
  }
  return null;
}

// ── Opportunity ───────────────────────────────────────────────────────────────

function buildOpportunity(
  presentation: ReportDetailPresentationModel,
  artifactModel: ReportViewModel | null,
): WowOpportunityViewModel {
  // Priority 1: use the top recommendation if it has a meaningful body
  const topRec = presentation.recommendations[0];
  if (topRec && topRec.body.length > 20) {
    return {
      available: true,
      finding: topRec.body,
      upsideLabel: topRec.detail && topRec.detail.length > 10 ? topRec.detail : null,
      action: topRec.label && topRec.label.length > 10 ? topRec.label : topRec.body,
    };
  }

  // Priority 2: derive from diagnosis type with diagnosis context
  const diagnosisType = artifactModel?.diagnosis?.diagnosisType ?? null;
  const concentrationScore = presentation.platformMix.concentrationScore;
  const topPlatform = extractTopPlatformFromHighlights(presentation.platformMix.highlights);
  const fromDiagnosis = buildOpportunityFromDiagnosisType(diagnosisType, concentrationScore, topPlatform);
  if (fromDiagnosis.available) {
    return fromDiagnosis;
  }

  // Priority 3: use the highest-severity signal
  const sortedSignals = [...presentation.signals].sort((a, b) => (b.severity ?? 0) - (a.severity ?? 0));
  const topSignal = sortedSignals[0];
  if (topSignal && topSignal.title) {
    return {
      available: true,
      finding: topSignal.description ?? topSignal.title,
      upsideLabel: null,
      action: "Review the full report for specific action recommendations based on this signal.",
    };
  }

  return {
    available: false,
    finding: "Not enough signal data is available to identify a dominant opportunity yet.",
    upsideLabel: null,
    action: "Upload more data across additional platforms to improve report depth.",
  };
}

// ── Platform Mix ──────────────────────────────────────────────────────────────

function buildPlatformMix(presentation: ReportDetailPresentationModel): WowPlatformMixViewModel {
  const { concentrationScore, highlights, platformsConnected } = presentation.platformMix;
  const topPlatform = extractTopPlatformFromHighlights(highlights);
  const available = concentrationScore !== null || highlights.length > 0;
  return {
    concentrationScore,
    topPlatformLabel: topPlatform,
    interpretationText: buildPlatformInterpretation(concentrationScore, topPlatform),
    highlights: highlights.slice(0, 3),
    available,
  };
}

// ── Momentum ──────────────────────────────────────────────────────────────────

function buildMomentum(
  presentation: ReportDetailPresentationModel,
  artifactModel: ReportViewModel | null,
): WowMomentumViewModel {
  const primitives = artifactModel?.diagnosis?.primitives;
  const revenueTrend = toWowDirection(primitives?.revenueTrendDirection);
  const subscriberTrend = toWowDirection(primitives?.activeSubscribersDirection);
  return {
    revenueTrend,
    subscriberTrend,
    summaryText: buildMomentumSentence(revenueTrend, subscriberTrend),
    hasPoints: presentation.revenueTrend.points.length >= 3,
  };
}

// ── Strengths vs Risks ────────────────────────────────────────────────────────

function buildStrengthsRisks(
  presentation: ReportDetailPresentationModel,
  artifactModel: ReportViewModel | null,
  options?: BuildReportWowSummaryOptions,
): WowStrengthsRisksViewModel {
  const comparisonAvailable = (options?.includeContinuitySignals ?? true) && presentation.whatChanged.comparisonAvailable;

  if (comparisonAvailable) {
    const strengths: WowStrengthRiskItem[] = presentation.whatChanged.improved
      .slice(0, 3)
      .map((item) => ({ id: item.id, text: item.body }));
    const risks: WowStrengthRiskItem[] = [
      ...presentation.whatChanged.worsened.slice(0, 2),
      ...presentation.whatChanged.watchNext.slice(0, 1),
    ].map((item) => ({ id: item.id, text: item.body }));
    return { strengths, risks, available: strengths.length > 0 || risks.length > 0 };
  }

  // Derive from signals and diagnosis pressure levels when no comparison available
  const strengths: WowStrengthRiskItem[] = [];
  const risks: WowStrengthRiskItem[] = [];

  const primitives = artifactModel?.diagnosis?.primitives;
  if (primitives) {
    if (primitives.revenueTrendDirection === "up") {
      strengths.push({ id: "revenue_up", text: "Revenue is trending upward this period." });
    }
    if (primitives.activeSubscribersDirection === "up") {
      strengths.push({ id: "subs_growing", text: "Active subscriber count is growing." });
    }
    if (primitives.churnPressureLevel === "low") {
      strengths.push({ id: "churn_low", text: "Churn pressure is currently low." });
    }
    if (primitives.churnPressureLevel === "high") {
      risks.push({ id: "churn_high", text: "Churn pressure is elevated — retention needs attention." });
    }
    if (primitives.concentrationPressureLevel === "high") {
      risks.push({ id: "concentration_high", text: "Revenue concentration in one platform creates fragility." });
    }
    if (primitives.monetizationEfficiencyLevel === "high") {
      risks.push({ id: "monetization_weak", text: "Monetization efficiency is low relative to audience size." });
    }
    if (primitives.revenueTrendDirection === "down") {
      risks.push({ id: "revenue_down", text: "Revenue is declining this period." });
    }
  }

  // Supplement with high-severity signals
  const highSeveritySignals = presentation.signals.filter((s) => (s.severity ?? 0) >= 4).slice(0, 2);
  for (const signal of highSeveritySignals) {
    if (!risks.some((r) => r.id === signal.id)) {
      risks.push({ id: signal.id, text: signal.title });
    }
  }

  const available = strengths.length > 0 || risks.length > 0;
  return { strengths: strengths.slice(0, 3), risks: risks.slice(0, 3), available };
}

// ── Next Actions ──────────────────────────────────────────────────────────────

function buildNextActions(presentation: ReportDetailPresentationModel): WowNextActionViewModel[] {
  if (presentation.recommendations.length > 0) {
    return presentation.recommendations.slice(0, 3).map((rec) => ({
      id: rec.id,
      title: rec.body,
      detail: rec.detail && rec.detail.length > 10 ? rec.detail : null,
    }));
  }
  return [];
}

// ── Main Builder ──────────────────────────────────────────────────────────────

export function buildReportWowSummaryViewModel(
  presentation: ReportDetailPresentationModel,
  artifactModel: ReportViewModel | null,
  reportDetail?: Pick<ReportDetail, "snapshotCoverageNote" | "reportHasBusinessMetrics" | "sectionStrength"> | null,
  options?: BuildReportWowSummaryOptions,
): ReportWowSummaryViewModel {
  return {
    kpiCards: buildKpiCards(presentation, artifactModel, options),
    summarySentence: buildSummarySentence(presentation, artifactModel),
    coverage: {
      snapshotCoverageNote: reportDetail?.snapshotCoverageNote ?? null,
      reportHasBusinessMetrics: reportDetail?.reportHasBusinessMetrics ?? true,
      sectionStrength: reportDetail?.sectionStrength ?? [],
    },
    opportunity: buildOpportunity(presentation, artifactModel),
    platformMix: buildPlatformMix(presentation),
    momentum: buildMomentum(presentation, artifactModel),
    strengthsRisks: buildStrengthsRisks(presentation, artifactModel, options),
    nextActions: buildNextActions(presentation),
  };
}
