import type { DashboardActionCard, DashboardActionCardsMode, DashboardActionCardsViewModel } from "../dashboard/action-cards";
import type {
  DashboardDiagnosisContext,
  DashboardDiagnosisMetric,
  DashboardDiagnosisNotice,
  DashboardDiagnosisViewModel,
} from "../dashboard/diagnosis";
import { buildEarnDashboardModel } from "../dashboard/earn-model";
import { buildGrowDashboardModel } from "../dashboard/grow-model";
import type { DashboardInsightCard, DashboardInsightVariant } from "../dashboard/insights";
import { buildDashboardRevenueTrendViewModel } from "../dashboard/revenue-trend";
import type { ReportTruthTone } from "../report/truth";
import type { ReportStabilityViewModel } from "../report/normalize-artifact-to-report-model";
import type {
  DemoBadgeVariant,
  DemoLatestReportRow,
  DemoSampleReport,
  DemoWorkspaceUtilityModel,
} from "./demo-types";
import type { DashboardRevenueTrendPoint } from "../dashboard/artifact-hydration";

type EarnModelInput = {
  netRevenue: number | null;
  subscribers: number | null;
  stabilityIndex: number | null;
  revenueDeltaText?: string | null;
  subscriberDeltaText?: string | null;
  stability?: ReportStabilityViewModel | null;
};

type DiagnosisMetricInput = {
  id: string;
  label: string;
  value: string;
  detail?: string | null;
  stateLabel?: string | null;
  stateTone?: ReportTruthTone | null;
};

type DiagnosisContextInput = {
  label: string;
  body: string;
  detail?: string | null;
  stateLabel?: string | null;
  stateTone?: ReportTruthTone | null;
};

type DiagnosisInput = {
  heading: string;
  summary?: string | null;
  unavailableBody?: string | null;
  notice?: DashboardDiagnosisNotice | null;
  supportingMetrics?: DiagnosisMetricInput[];
  comparisonContext?: DiagnosisContextInput | null;
  hasTypedDiagnosis?: boolean;
};

type InsightCardInput = {
  id: string;
  variant: DashboardInsightVariant;
  title: string;
  body: string;
  implication: string;
  stateLabel?: string | null;
  stateTone?: ReportTruthTone | null;
  stateDetail?: string | null;
};

type ActionCardInput = {
  id: string;
  label: string;
  body: string;
  detail?: string | null;
  stateLabel?: string | null;
  stateTone?: ReportTruthTone | null;
};

type UtilityInput = {
  entitled: boolean;
  planTier: string;
  planStatusLabel: string;
  planStatusVariant: DemoBadgeVariant;
  workspaceReadiness: string;
  reportsCheckError?: string | null;
  platformsConnectedLabel: string;
  coverageLabel: string;
  lastUploadLabel: string;
  latestReportRow: DemoLatestReportRow | null;
  latestReportHref: string;
  latestReportStatusLabel: string;
  latestReportStatusVariant: DemoBadgeVariant;
};

type SampleReportInput = {
  anchorId: string;
  title: string;
  generatedAt: string;
  summary: string;
  highlights: string[];
  nextSteps: string[];
};

function uniqueNonEmpty(values: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }

    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

export function formatDemoDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

export function createLatestReportRow(id: string, createdAt: string, status = "ready"): DemoLatestReportRow {
  return {
    id,
    date: formatDemoDate(createdAt),
    status,
  };
}

export function createEarnModel(input: EarnModelInput) {
  return buildEarnDashboardModel({
    kpis: {
      netRevenue: input.netRevenue,
      subscribers: input.subscribers,
      stabilityIndex: input.stabilityIndex,
    },
    stability: input.stability ?? null,
    revenueDeltaText: input.revenueDeltaText ?? null,
    subscriberDeltaText: input.subscriberDeltaText ?? null,
  });
}

function toDiagnosisMetric(input: DiagnosisMetricInput): DashboardDiagnosisMetric {
  return {
    id: input.id,
    label: input.label,
    value: input.value,
    detail: input.detail ?? null,
    stateLabel: input.stateLabel ?? null,
    stateTone: input.stateTone ?? null,
  };
}

function toDiagnosisContext(input: DiagnosisContextInput): DashboardDiagnosisContext {
  return {
    label: input.label,
    body: input.body,
    detail: input.detail ?? null,
    stateLabel: input.stateLabel ?? null,
    stateTone: input.stateTone ?? null,
  };
}

export function createDiagnosisModel(input: DiagnosisInput): DashboardDiagnosisViewModel {
  return {
    heading: input.heading,
    hasTypedDiagnosis: input.hasTypedDiagnosis ?? true,
    diagnosisTypeLabel: input.hasTypedDiagnosis === false ? null : input.heading,
    summary: input.summary ?? null,
    notice: input.notice ?? null,
    supportingMetrics: (input.supportingMetrics ?? []).map(toDiagnosisMetric),
    comparisonContext: input.comparisonContext ? toDiagnosisContext(input.comparisonContext) : null,
    unavailableBody: input.unavailableBody ?? null,
  };
}

function toActionCard(input: ActionCardInput): DashboardActionCard {
  return {
    id: input.id,
    label: input.label,
    body: input.body,
    detail: input.detail ?? null,
    stateLabel: input.stateLabel ?? null,
    stateTone: input.stateTone ?? null,
  };
}

export function createActionCards(mode: DashboardActionCardsMode, cards: ActionCardInput[] = []): DashboardActionCardsViewModel {
  return {
    mode,
    cards: cards.map(toActionCard),
  };
}

export function createInsightCard(input: InsightCardInput): DashboardInsightCard {
  return {
    id: input.id,
    variant: input.variant,
    title: input.title,
    body: input.body,
    implication: input.implication,
    stateLabel: input.stateLabel ?? null,
    stateTone: input.stateTone ?? null,
    stateDetail: input.stateDetail ?? null,
  };
}

export function createRevenueTrend(points: DashboardRevenueTrendPoint[]) {
  return buildDashboardRevenueTrendViewModel({ points });
}

export function createGrowModel(input: Parameters<typeof buildGrowDashboardModel>[0]) {
  return buildGrowDashboardModel(input);
}

export function createUtilityModel(input: UtilityInput): DemoWorkspaceUtilityModel {
  return {
    entitled: input.entitled,
    planTier: input.planTier,
    planStatusLabel: input.planStatusLabel,
    planStatusVariant: input.planStatusVariant,
    workspaceReadiness: input.workspaceReadiness,
    reportsCheckError: input.reportsCheckError ?? null,
    platformsConnectedLabel: input.platformsConnectedLabel,
    coverageLabel: input.coverageLabel,
    lastUploadLabel: input.lastUploadLabel,
    latestReportRow: input.latestReportRow,
    latestReportHref: input.latestReportHref,
    latestReportStatusLabel: input.latestReportStatusLabel,
    latestReportStatusVariant: input.latestReportStatusVariant,
  };
}

export function createSampleReport(input: SampleReportInput): DemoSampleReport {
  return {
    anchorId: input.anchorId,
    title: input.title,
    generatedAtLabel: formatDemoDate(input.generatedAt),
    summary: input.summary,
    highlights: uniqueNonEmpty(input.highlights),
    nextSteps: uniqueNonEmpty(input.nextSteps),
  };
}

export function createProvisionalStability(score: number, explanation: string): ReportStabilityViewModel {
  return {
    score,
    band: score >= 55 ? "medium" : "low",
    explanation,
    confidenceScore: 0.53,
    components: null,
    availability: "limited",
    confidence: "low",
    confidenceAdjusted: true,
    evidenceStrength: "weak",
    insufficientReason: "limited_monthly_history",
    reasonCodes: ["limited_monthly_history"],
    dataQualityLevel: "limited",
    analysisMode: "reduced",
    recommendationMode: null,
  };
}
