import type {
  ReportComparisonItemViewModel,
  ReportDiagnosisSupportingMetricViewModel,
  ReportDiagnosisViewModel,
  ReportWhatChangedViewModel,
} from "../report/normalize-artifact-to-report-model";
import {
  getTruthStateDescription,
  getTruthStateLabel,
  getTruthStateTone,
  type ReportTruthMetadata,
  type ReportTruthTone,
} from "../report/truth";

export type DashboardDiagnosisNotice = {
  label: string;
  body: string;
  tone: ReportTruthTone;
};

export type DashboardDiagnosisMetric = {
  id: string;
  label: string;
  value: string;
  detail: string | null;
  stateLabel: string | null;
  stateTone: ReportTruthTone | null;
};

export type DashboardDiagnosisContext = {
  label: string;
  body: string;
  detail: string | null;
  stateLabel: string | null;
  stateTone: ReportTruthTone | null;
};

export type DashboardDiagnosisViewModel = {
  hasTypedDiagnosis: boolean;
  diagnosisTypeLabel: string | null;
  summary: string | null;
  notice: DashboardDiagnosisNotice | null;
  supportingMetrics: DashboardDiagnosisMetric[];
  comparisonContext: DashboardDiagnosisContext | null;
  unavailableBody: string | null;
};

export type BuildDashboardDiagnosisViewModelInput = {
  diagnosis?: ReportDiagnosisViewModel | null;
  whatChanged?: ReportWhatChangedViewModel | null;
  hasReport?: boolean | null;
};

function buildNotice(
  truth: ReportTruthMetadata | null | undefined,
  fallbackBody: string,
): DashboardDiagnosisNotice | null {
  if (!truth) {
    return null;
  }

  const label = getTruthStateLabel(truth);
  if (!label) {
    return null;
  }

  return {
    label,
    body: getTruthStateDescription(truth) ?? fallbackBody,
    tone: getTruthStateTone(truth),
  };
}

function toTitleCase(value: string): string {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDiagnosisTypeLabel(value: ReportDiagnosisViewModel["diagnosisType"]): string | null {
  if (!value) {
    return null;
  }

  switch (value) {
    case "acquisition_pressure":
      return "Acquisition pressure";
    case "churn_pressure":
      return "Churn pressure";
    case "monetization_pressure":
      return "Monetization pressure";
    case "concentration_pressure":
      return "Concentration pressure";
    case "mixed_pressure":
      return "Mixed pressure";
    case "insufficient_evidence":
      return "Insufficient evidence";
    default:
      return null;
  }
}

function formatDirectionLabel(value: string): string | null {
  if (value === "up") {
    return "Up";
  }
  if (value === "down") {
    return "Down";
  }
  if (value === "flat") {
    return "Flat";
  }
  if (value === "mixed") {
    return "Mixed";
  }

  return null;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number): string {
  const percent = value <= 1 ? value * 100 : value;
  const rounded = Math.round(percent * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}

function formatScore(value: number): string {
  const rounded = Math.max(0, Math.min(100, Math.round(value)));
  return `${rounded}/100`;
}

function formatSupportingMetricValue(metric: string, value: number | null): string {
  if (value === null) {
    return "--";
  }

  if (/revenue|arpu/i.test(metric)) {
    return formatCurrency(value);
  }

  if (/rate|share|pct|percent/i.test(metric)) {
    return formatPercent(value);
  }

  if (/risk|stability|score/i.test(metric)) {
    return formatScore(value);
  }

  return formatNumber(value);
}

function buildSupportingMetric(metric: ReportDiagnosisSupportingMetricViewModel): DashboardDiagnosisMetric {
  const stateLabel = getTruthStateLabel(metric, { source: metric.source ?? null });
  const stateTone = stateLabel ? getTruthStateTone(metric, { source: metric.source ?? null }) : null;
  const detailParts = [
    metric.priorValue !== null ? `Prior ${formatSupportingMetricValue(metric.metric, metric.priorValue)}` : null,
    formatDirectionLabel(metric.direction) ? `${formatDirectionLabel(metric.direction)} trend` : null,
    getTruthStateDescription(metric, { source: metric.source ?? null }),
  ].filter((value): value is string => Boolean(value));

  return {
    id: `dashboard-diagnosis-${metric.metric}`,
    label: toTitleCase(metric.metric),
    value: formatSupportingMetricValue(metric.metric, metric.currentValue),
    detail: detailParts.join(". ") || null,
    stateLabel,
    stateTone,
  };
}

function formatDateLabel(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnly
    ? new Date(Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])))
    : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function buildComparisonPeriodLabel(whatChanged: ReportWhatChangedViewModel): string | null {
  const start = formatDateLabel(whatChanged.priorPeriodStart);
  const end = formatDateLabel(whatChanged.priorPeriodEnd);
  if (start && end) {
    return `Compared with ${start} to ${end}`;
  }
  if (whatChanged.priorReportId) {
    return `Compared with prior report ${whatChanged.priorReportId}`;
  }

  return null;
}

function buildComparisonContextItem(
  whatChanged: ReportWhatChangedViewModel,
  item: ReportComparisonItemViewModel,
  label: string,
): DashboardDiagnosisContext {
  const stateLabel = getTruthStateLabel(item);
  const stateTone = stateLabel ? getTruthStateTone(item) : null;
  const detailParts = [
    buildComparisonPeriodLabel(whatChanged),
    item.materiality ? `${toTitleCase(item.materiality)} materiality` : null,
    getTruthStateDescription(item),
  ].filter((value): value is string => Boolean(value));

  return {
    label,
    body: item.summaryText,
    detail: detailParts.join(". ") || null,
    stateLabel,
    stateTone,
  };
}

function buildComparisonContext(whatChanged: ReportWhatChangedViewModel | null): DashboardDiagnosisContext | null {
  if (!whatChanged?.comparisonAvailable) {
    return null;
  }

  const watchNext = whatChanged.watchNext[0] ?? null;
  if (watchNext) {
    return buildComparisonContextItem(whatChanged, watchNext, "Watch next");
  }

  const changedSinceLast = whatChanged.whatWorsened[0] ?? whatChanged.whatImproved[0] ?? null;
  if (!changedSinceLast) {
    return null;
  }

  return buildComparisonContextItem(whatChanged, changedSinceLast, "Changed since last report");
}

export function buildDashboardDiagnosisViewModel(input: BuildDashboardDiagnosisViewModelInput): DashboardDiagnosisViewModel {
  const diagnosis = input.diagnosis ?? null;

  if (!diagnosis) {
    return {
      hasTypedDiagnosis: false,
      diagnosisTypeLabel: null,
      summary: null,
      notice: null,
      supportingMetrics: [],
      comparisonContext: null,
      unavailableBody: input.hasReport ? "Diagnosis unavailable for this dashboard snapshot." : "Diagnosis will appear after your next completed report.",
    };
  }

  return {
    hasTypedDiagnosis: true,
    diagnosisTypeLabel: formatDiagnosisTypeLabel(diagnosis.diagnosisType),
    summary: diagnosis.summaryText,
    notice: buildNotice(diagnosis, "Diagnosis is bounded by the available evidence in this report."),
    supportingMetrics: diagnosis.supportingMetrics.slice(0, 3).map((metric) => buildSupportingMetric(metric)),
    comparisonContext: buildComparisonContext(input.whatChanged ?? null),
    unavailableBody: diagnosis.summaryText ? null : getTruthStateDescription(diagnosis) ?? "Diagnosis details are limited for this dashboard snapshot.",
  };
}
