import type {
  ReportDiagnosisViewModel,
  ReportWhatChangedViewModel,
} from "../report/normalize-artifact-to-report-model";
import {
  buildComparisonContextPresentation,
  buildDiagnosisPresentation,
  type SharedPresentationComparisonContext,
  type SharedPresentationMetric,
  type SharedPresentationNotice,
} from "../report/diagnosis-what-changed-presentation";

export type DashboardDiagnosisNotice = SharedPresentationNotice;
export type DashboardDiagnosisMetric = SharedPresentationMetric;
export type DashboardDiagnosisContext = SharedPresentationComparisonContext;

export type DashboardDiagnosisViewModel = {
  heading: string;
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

export function buildDashboardDiagnosisViewModel(input: BuildDashboardDiagnosisViewModelInput): DashboardDiagnosisViewModel {
  const diagnosis = input.diagnosis ?? null;
  const hasReport = input.hasReport ?? false;
  const presentation = buildDiagnosisPresentation(diagnosis, {
    metricIdPrefix: "dashboard-diagnosis",
    supportingMetricLimit: 3,
    noticeFallbackBody: "Diagnosis is bounded by the available evidence in this report.",
    missingDiagnosisBody: hasReport
      ? "This snapshot does not contain enough structured evidence to identify a primary growth constraint yet."
      : "Diagnosis will appear after your next completed report.",
    missingSummaryBody: "Diagnosis details are limited for this dashboard snapshot.",
  });

  return {
    heading: presentation.diagnosisTypeLabel ?? (diagnosis ? "Diagnosis" : hasReport ? "No primary constraint identified yet" : "Diagnosis unavailable"),
    hasTypedDiagnosis: Boolean(diagnosis),
    diagnosisTypeLabel: presentation.diagnosisTypeLabel,
    summary: presentation.summary,
    notice: presentation.notice,
    supportingMetrics: presentation.supportingMetrics,
    comparisonContext: diagnosis ? buildComparisonContextPresentation(input.whatChanged ?? null) : null,
    unavailableBody: presentation.unavailableBody,
  };
}
