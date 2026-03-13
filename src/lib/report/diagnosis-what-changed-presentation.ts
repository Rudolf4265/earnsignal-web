import type {
  ReportComparisonItemViewModel,
  ReportDiagnosisSupportingMetricViewModel,
  ReportDiagnosisType,
  ReportDiagnosisViewModel,
  ReportWhatChangedViewModel,
} from "./normalize-artifact-to-report-model";
import {
  getTruthStateDescription,
  getTruthStateLabel,
  getTruthStateTone,
  type ReportTruthMetadata,
  type ReportTruthTone,
} from "./truth";

export type SharedPresentationNotice = {
  label: string;
  body: string;
  tone: ReportTruthTone;
};

export type SharedPresentationMetric = {
  id: string;
  label: string;
  value: string;
  detail: string | null;
  stateLabel: string | null;
  stateTone: ReportTruthTone | null;
};

export type SharedPresentationComparisonItem = {
  id: string;
  body: string;
  detail: string | null;
  stateLabel: string | null;
  stateTone: ReportTruthTone | null;
};

export type SharedPresentationComparisonContext = {
  label: string;
  body: string;
  detail: string | null;
  stateLabel: string | null;
  stateTone: ReportTruthTone | null;
};

export type SharedDiagnosisPresentation = {
  diagnosisTypeLabel: string | null;
  summary: string | null;
  notice: SharedPresentationNotice | null;
  supportingMetrics: SharedPresentationMetric[];
  unavailableBody: string | null;
};

export type SharedWhatChangedPresentation = {
  comparisonAvailable: boolean;
  priorPeriodLabel: string | null;
  notice: SharedPresentationNotice | null;
  improved: SharedPresentationComparisonItem[];
  worsened: SharedPresentationComparisonItem[];
  watchNext: SharedPresentationComparisonItem[];
  unavailableBody: string | null;
};

type BuildPresentationTruthNoticeOptions = {
  source?: string | null;
  fallbackLabel?: string;
  fallbackBody?: string;
};

type BuildDiagnosisPresentationOptions = {
  metricIdPrefix?: string | null;
  supportingMetricLimit?: number;
  noticeFallbackBody?: string;
  missingDiagnosisBody: string;
  missingSummaryBody: string;
};

type BuildComparisonItemPresentationOptions = {
  idPrefix?: string | null;
  includeDirectionInDetail?: boolean;
  leadingDetail?: Array<string | null | undefined>;
};

type BuildWhatChangedPresentationOptions = {
  itemIdPrefix?: string | null;
  itemLimit?: number;
  includeDirectionInDetail?: boolean;
  noticeFallbackBody?: string;
  missingWhatChangedBody: string;
  unavailableComparisonBody: string;
};

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

export function formatPresentationLabel(value: string): string {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatDiagnosisTypeLabel(value: ReportDiagnosisType | null): string | null {
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

export function formatDirectionLabel(
  value: string,
  options?: { unknownLabel?: string | null },
): string | null {
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

  return options?.unknownLabel ?? null;
}

export function formatSupportingMetricValue(metric: string, value: number | null): string {
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

export function formatPresentationDateLabel(value: string | null): string | null {
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

export function formatComparisonPeriodLabel(
  whatChanged: Pick<ReportWhatChangedViewModel, "priorPeriodStart" | "priorPeriodEnd" | "priorReportId"> | null | undefined,
): string | null {
  if (!whatChanged) {
    return null;
  }

  const start = formatPresentationDateLabel(whatChanged.priorPeriodStart);
  const end = formatPresentationDateLabel(whatChanged.priorPeriodEnd);
  if (start && end) {
    return `Compared with ${start} to ${end}`;
  }
  if (whatChanged.priorReportId) {
    return `Compared with prior report ${whatChanged.priorReportId}`;
  }

  return null;
}

export function buildPresentationTruthNotice(
  truth: ReportTruthMetadata | null | undefined,
  options?: BuildPresentationTruthNoticeOptions,
): SharedPresentationNotice | null {
  if (!truth) {
    return null;
  }

  const label = getTruthStateLabel(truth, { source: options?.source ?? null }) ?? options?.fallbackLabel ?? null;
  if (!label) {
    return null;
  }

  return {
    label,
    body: getTruthStateDescription(truth, { source: options?.source ?? null }) ?? options?.fallbackBody ?? "Limited evidence in this report.",
    tone: getTruthStateTone(truth, { source: options?.source ?? null }),
  };
}

export function buildDiagnosisSupportingMetricPresentation(
  metric: ReportDiagnosisSupportingMetricViewModel,
  options?: { idPrefix?: string | null },
): SharedPresentationMetric {
  const stateLabel = getTruthStateLabel(metric, { source: metric.source ?? null });
  const stateTone = stateLabel ? getTruthStateTone(metric, { source: metric.source ?? null }) : null;
  const directionLabel = formatDirectionLabel(metric.direction);
  const detailParts = [
    metric.priorValue !== null ? `Prior ${formatSupportingMetricValue(metric.metric, metric.priorValue)}` : null,
    directionLabel ? `${directionLabel} trend` : null,
    getTruthStateDescription(metric, { source: metric.source ?? null }),
  ].filter((value): value is string => Boolean(value));
  const baseId = `${metric.metric}`;

  return {
    id: options?.idPrefix ? `${options.idPrefix}-${baseId}` : baseId,
    label: formatPresentationLabel(metric.metric),
    value: formatSupportingMetricValue(metric.metric, metric.currentValue),
    detail: detailParts.join(". ") || null,
    stateLabel,
    stateTone,
  };
}

export function buildDiagnosisPresentation(
  diagnosis: ReportDiagnosisViewModel | null | undefined,
  options: BuildDiagnosisPresentationOptions,
): SharedDiagnosisPresentation {
  if (!diagnosis) {
    return {
      diagnosisTypeLabel: null,
      summary: null,
      notice: null,
      supportingMetrics: [],
      unavailableBody: options.missingDiagnosisBody,
    };
  }

  return {
    diagnosisTypeLabel: formatDiagnosisTypeLabel(diagnosis.diagnosisType),
    summary: diagnosis.summaryText,
    notice: buildPresentationTruthNotice(diagnosis, {
      fallbackBody: options.noticeFallbackBody ?? "Diagnosis is bounded by the available evidence in this report.",
    }),
    supportingMetrics: diagnosis.supportingMetrics
      .slice(0, options.supportingMetricLimit ?? diagnosis.supportingMetrics.length)
      .map((metric) => buildDiagnosisSupportingMetricPresentation(metric, { idPrefix: options.metricIdPrefix ?? null })),
    unavailableBody: diagnosis.summaryText ? null : getTruthStateDescription(diagnosis) ?? options.missingSummaryBody,
  };
}

export function buildComparisonItemPresentation(
  item: ReportComparisonItemViewModel,
  index: number,
  options?: BuildComparisonItemPresentationOptions,
): SharedPresentationComparisonItem {
  const stateLabel = getTruthStateLabel(item);
  const directionLabel = formatDirectionLabel(item.direction);
  const detailParts = [
    ...(options?.leadingDetail ?? []),
    item.materiality ? `${formatPresentationLabel(item.materiality)} materiality` : null,
    options?.includeDirectionInDetail && directionLabel ? `${directionLabel} direction` : null,
    getTruthStateDescription(item),
  ].filter((value): value is string => Boolean(value));
  const baseId = `${item.metric ?? item.category ?? "comparison"}-${index + 1}`;

  return {
    id: options?.idPrefix ? `${options.idPrefix}-${baseId}` : baseId,
    body: item.summaryText,
    detail: detailParts.join(". ") || null,
    stateLabel,
    stateTone: stateLabel ? getTruthStateTone(item) : null,
  };
}

export function buildWhatChangedPresentation(
  whatChanged: ReportWhatChangedViewModel | null | undefined,
  options: BuildWhatChangedPresentationOptions,
): SharedWhatChangedPresentation {
  if (!whatChanged) {
    return {
      comparisonAvailable: false,
      priorPeriodLabel: null,
      notice: null,
      improved: [],
      worsened: [],
      watchNext: [],
      unavailableBody: options.missingWhatChangedBody,
    };
  }

  const itemLimit = options.itemLimit ?? 3;

  return {
    comparisonAvailable: whatChanged.comparisonAvailable,
    priorPeriodLabel: formatComparisonPeriodLabel(whatChanged),
    notice: buildPresentationTruthNotice(whatChanged, {
      fallbackBody: options.noticeFallbackBody ?? "Comparison results are bounded by the comparable report evidence that was available.",
    }),
    improved: whatChanged.whatImproved
      .slice(0, itemLimit)
      .map((item, index) =>
        buildComparisonItemPresentation(item, index, {
          idPrefix: options.itemIdPrefix ?? null,
          includeDirectionInDetail: options.includeDirectionInDetail ?? true,
        }),
      ),
    worsened: whatChanged.whatWorsened
      .slice(0, itemLimit)
      .map((item, index) =>
        buildComparisonItemPresentation(item, index, {
          idPrefix: options.itemIdPrefix ?? null,
          includeDirectionInDetail: options.includeDirectionInDetail ?? true,
        }),
      ),
    watchNext: whatChanged.watchNext
      .slice(0, itemLimit)
      .map((item, index) =>
        buildComparisonItemPresentation(item, index, {
          idPrefix: options.itemIdPrefix ?? null,
          includeDirectionInDetail: options.includeDirectionInDetail ?? true,
        }),
      ),
    unavailableBody:
      !whatChanged.comparisonAvailable
        ? getTruthStateDescription(whatChanged) ?? options.unavailableComparisonBody
        : null,
  };
}

export function buildComparisonContextPresentation(
  whatChanged: ReportWhatChangedViewModel | null | undefined,
): SharedPresentationComparisonContext | null {
  if (!whatChanged?.comparisonAvailable) {
    return null;
  }

  const watchNext = whatChanged.watchNext[0] ?? null;
  const changedSinceLast = whatChanged.whatWorsened[0] ?? whatChanged.whatImproved[0] ?? null;
  const item = watchNext ?? changedSinceLast;
  if (!item) {
    return null;
  }

  const presentation = buildComparisonItemPresentation(item, 0, {
    idPrefix: "dashboard-comparison",
    includeDirectionInDetail: false,
    leadingDetail: [formatComparisonPeriodLabel(whatChanged)],
  });

  return {
    label: watchNext ? "Watch next" : "Changed since last report",
    body: presentation.body,
    detail: presentation.detail,
    stateLabel: presentation.stateLabel,
    stateTone: presentation.stateTone,
  };
}
