import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const sharedModuleUrl = pathToFileURL(path.resolve("src/lib/report/diagnosis-what-changed-presentation.ts")).href;
const dashboardModuleUrl = pathToFileURL(path.resolve("src/lib/dashboard/diagnosis.ts")).href;
const detailModuleUrl = pathToFileURL(path.resolve("src/lib/report/detail-presentation.ts")).href;

async function loadModules(seed = Date.now()) {
  const suffix = `?t=${seed}`;
  return Promise.all([
    import(`${sharedModuleUrl}${suffix}`),
    import(`${dashboardModuleUrl}${suffix}`),
    import(`${detailModuleUrl}${suffix}`),
  ]);
}

function makeReport(overrides = {}) {
  return {
    id: "rep_shared_surface",
    title: "Creator Earnings Snapshot",
    status: "ready",
    summary: "No summary available.",
    createdAt: "2026-03-01T10:00:00Z",
    updatedAt: "2026-03-01T10:00:00Z",
    artifactUrl: "/v1/reports/rep_shared_surface/artifact",
    pdfUrl: "/v1/reports/rep_shared_surface/artifact",
    artifactJsonUrl: "/v1/reports/rep_shared_surface/artifact.json",
    keySignals: [],
    recommendedActions: [],
    metrics: {
      netRevenue: null,
      subscribers: null,
      stabilityIndex: null,
      churnVelocity: null,
      coverageMonths: null,
      platformsConnected: null,
    },
    ...overrides,
  };
}

function makeSupportingMetric(overrides = {}) {
  return {
    metric: "churn_rate",
    currentValue: 0.12,
    priorValue: 0.08,
    direction: "up",
    source: "observed",
    availability: "available",
    confidence: "medium",
    confidenceAdjusted: false,
    evidenceStrength: "moderate",
    insufficientReason: null,
    reasonCodes: ["churn_rate_worsened"],
    dataQualityLevel: "good",
    analysisMode: "full",
    recommendationMode: null,
    ...overrides,
  };
}

function makeDiagnosis(overrides = {}) {
  return {
    diagnosisType: "churn_pressure",
    summaryText: "Current profile looks more churn-limited based on the latest typed report evidence.",
    supportingMetrics: [],
    primitives: null,
    availability: "available",
    confidence: "high",
    confidenceAdjusted: false,
    evidenceStrength: "strong",
    insufficientReason: null,
    reasonCodes: ["churn_pressure_primary"],
    dataQualityLevel: "good",
    analysisMode: "full",
    recommendationMode: null,
    ...overrides,
  };
}

function makeComparisonItem(overrides = {}) {
  return {
    category: "revenue",
    metric: "latest_net_revenue",
    changeType: "watch",
    direction: "down",
    materiality: "medium",
    summaryText: "Revenue softened and should be watched next cycle.",
    availability: "limited",
    confidence: "low",
    confidenceAdjusted: true,
    evidenceStrength: "weak",
    insufficientReason: "limited_monthly_history",
    reasonCodes: ["limited_monthly_history"],
    dataQualityLevel: "limited",
    analysisMode: "reduced",
    recommendationMode: null,
    ...overrides,
  };
}

function makeWhatChanged(overrides = {}) {
  return {
    comparisonAvailable: true,
    priorReportId: "rep_prev_001",
    priorPeriodStart: "2026-01-01",
    priorPeriodEnd: "2026-01-31",
    comparableMetricCount: 2,
    comparisonBasisMetrics: ["latest_net_revenue", "active_subscribers"],
    deltas: {},
    whatImproved: [],
    whatWorsened: [],
    watchNext: [],
    availability: "available",
    confidence: "medium",
    confidenceAdjusted: false,
    evidenceStrength: "moderate",
    insufficientReason: null,
    reasonCodes: ["comparison_basis_available"],
    dataQualityLevel: "good",
    analysisMode: "full",
    recommendationMode: null,
    ...overrides,
  };
}

function makeArtifactModel(overrides = {}) {
  return {
    reportId: "rep_shared_surface",
    schemaVersion: "v1",
    createdAt: "2026-03-01T10:00:00Z",
    analysisMode: "full",
    dataQualityLevel: "good",
    executiveSummaryParagraphs: [],
    kpis: {
      netRevenue: null,
      subscribers: null,
      stabilityIndex: null,
      churnVelocity: null,
    },
    sections: [],
    diagnosis: null,
    whatChanged: null,
    metricSnapshot: null,
    metricProvenance: {},
    signals: [],
    recommendations: [],
    outlook: null,
    stability: null,
    ...overrides,
  };
}

test("shared diagnosis presentation keeps dashboard and report detail labels and notices aligned", async () => {
  const [sharedModule, dashboardModule, detailModule] = await loadModules(Date.now() + 1);
  const diagnosis = makeDiagnosis({
    diagnosisType: "mixed_pressure",
    summaryText: "Current profile shows mixed pressure and the evidence does not support a single dominant constraint.",
    supportingMetrics: [makeSupportingMetric()],
    availability: "limited",
    confidence: "low",
    confidenceAdjusted: true,
    evidenceStrength: "weak",
    reasonCodes: ["mixed_constraint_signals"],
    dataQualityLevel: "limited",
    analysisMode: "reduced",
  });

  const shared = sharedModule.buildDiagnosisPresentation(diagnosis, {
    metricIdPrefix: "shared",
    supportingMetricLimit: 4,
    noticeFallbackBody: "Diagnosis is bounded by the available evidence in this report.",
    missingDiagnosisBody: "Typed diagnosis is unavailable for this report artifact.",
    missingSummaryBody: "Diagnosis details are limited for this report.",
  });
  const dashboard = dashboardModule.buildDashboardDiagnosisViewModel({
    diagnosis,
    whatChanged: null,
    hasReport: true,
  });
  const report = detailModule.buildReportDetailPresentationModel({
    report: makeReport(),
    artifactModel: makeArtifactModel({ diagnosis }),
    artifactSignals: null,
  });

  assert.equal(shared.diagnosisTypeLabel, "Mixed pressure");
  assert.equal(dashboard.diagnosisTypeLabel, shared.diagnosisTypeLabel);
  assert.equal(report.diagnosis.diagnosisTypeLabel, shared.diagnosisTypeLabel);
  assert.equal(dashboard.notice?.label, shared.notice?.label);
  assert.equal(report.diagnosis.notice?.label, shared.notice?.label);
  assert.equal(dashboard.notice?.body, shared.notice?.body);
  assert.equal(report.diagnosis.notice?.body, shared.notice?.body);
  assert.equal(dashboard.supportingMetrics[0]?.label, shared.supportingMetrics[0]?.label);
  assert.equal(report.diagnosis.supportingMetrics[0]?.label, shared.supportingMetrics[0]?.label);
  assert.equal(dashboard.supportingMetrics[0]?.value, shared.supportingMetrics[0]?.value);
  assert.equal(report.diagnosis.supportingMetrics[0]?.detail, shared.supportingMetrics[0]?.detail);
});

test("shared what-changed presentation centralizes comparison window formatting for date-only ranges", async () => {
  const [sharedModule, dashboardModule, detailModule] = await loadModules(Date.now() + 2);
  const diagnosis = makeDiagnosis();
  const whatChanged = makeWhatChanged({
    watchNext: [makeComparisonItem()],
  });

  const shared = sharedModule.buildWhatChangedPresentation(whatChanged, {
    itemIdPrefix: null,
    itemLimit: 3,
    includeDirectionInDetail: true,
    noticeFallbackBody: "Comparison results are bounded by the comparable report evidence that was available.",
    missingWhatChangedBody: "Typed report-over-report comparison is unavailable for this report artifact.",
    unavailableComparisonBody: "A prior comparable report is not available yet.",
  });
  const sharedContext = sharedModule.buildComparisonContextPresentation(whatChanged);
  const dashboard = dashboardModule.buildDashboardDiagnosisViewModel({
    diagnosis,
    whatChanged,
    hasReport: true,
  });
  const report = detailModule.buildReportDetailPresentationModel({
    report: makeReport(),
    artifactModel: makeArtifactModel({ diagnosis, whatChanged }),
    artifactSignals: null,
  });

  assert.equal(shared.priorPeriodLabel, "Compared with Jan 1, 2026 to Jan 31, 2026");
  assert.equal(report.whatChanged.priorPeriodLabel, shared.priorPeriodLabel);
  assert.equal(sharedContext?.detail?.includes(shared.priorPeriodLabel), true);
  assert.equal(dashboard.comparisonContext?.detail?.includes(shared.priorPeriodLabel), true);
  assert.equal(dashboard.comparisonContext?.body, sharedContext?.body);
  assert.equal(report.whatChanged.watchNext[0]?.body, shared.watchNext[0]?.body);
});

test("mixed, limited, and unavailable typed states stay aligned without upgrading certainty", async () => {
  const [sharedModule, dashboardModule, detailModule] = await loadModules(Date.now() + 3);
  const diagnosis = makeDiagnosis({
    diagnosisType: "mixed_pressure",
    summaryText:
      "Current profile shows mixed pressure across churn_pressure_primary, monetization_pressure_primary; the evidence does not support a single dominant constraint.",
    availability: "limited",
    confidence: "low",
    confidenceAdjusted: true,
    evidenceStrength: "weak",
    reasonCodes: ["mixed_constraint_signals"],
    dataQualityLevel: "limited",
    analysisMode: "reduced",
  });
  const whatChanged = makeWhatChanged({
    comparisonAvailable: false,
    priorReportId: null,
    priorPeriodStart: null,
    priorPeriodEnd: null,
    watchNext: [],
    availability: "unavailable",
    confidence: "low",
    confidenceAdjusted: true,
    evidenceStrength: "none",
    insufficientReason: "prior_report_unavailable",
    reasonCodes: ["prior_report_unavailable"],
    dataQualityLevel: "limited",
    analysisMode: "reduced",
  });

  const sharedDiagnosis = sharedModule.buildDiagnosisPresentation(diagnosis, {
    metricIdPrefix: "shared",
    supportingMetricLimit: 4,
    noticeFallbackBody: "Diagnosis is bounded by the available evidence in this report.",
    missingDiagnosisBody: "Typed diagnosis is unavailable for this report artifact.",
    missingSummaryBody: "Diagnosis details are limited for this report.",
  });
  const sharedWhatChanged = sharedModule.buildWhatChangedPresentation(whatChanged, {
    itemIdPrefix: null,
    itemLimit: 3,
    includeDirectionInDetail: true,
    noticeFallbackBody: "Comparison results are bounded by the comparable report evidence that was available.",
    missingWhatChangedBody: "Typed report-over-report comparison is unavailable for this report artifact.",
    unavailableComparisonBody: "A prior comparable report is not available yet.",
  });
  const dashboard = dashboardModule.buildDashboardDiagnosisViewModel({
    diagnosis,
    whatChanged,
    hasReport: true,
  });
  const report = detailModule.buildReportDetailPresentationModel({
    report: makeReport(),
    artifactModel: makeArtifactModel({ diagnosis, whatChanged }),
    artifactSignals: null,
  });

  assert.equal(sharedDiagnosis.notice?.label, "Reduced confidence");
  assert.equal(dashboard.notice?.label, sharedDiagnosis.notice?.label);
  assert.equal(report.diagnosis.notice?.label, sharedDiagnosis.notice?.label);
  assert.equal(sharedWhatChanged.notice?.label, "Unavailable");
  assert.equal(report.whatChanged.notice?.label, sharedWhatChanged.notice?.label);
  assert.equal(report.whatChanged.unavailableBody, sharedWhatChanged.unavailableBody);
  assert.equal(report.whatChanged.unavailableBody?.includes("Unavailable for this report"), true);
  assert.equal(dashboard.comparisonContext, null);
});

test("older artifacts without typed diagnosis or comparison stay conservative through shared helpers", async () => {
  const [sharedModule, dashboardModule, detailModule] = await loadModules(Date.now() + 4);
  const sharedDiagnosis = sharedModule.buildDiagnosisPresentation(null, {
    metricIdPrefix: "shared",
    supportingMetricLimit: 4,
    noticeFallbackBody: "Diagnosis is bounded by the available evidence in this report.",
    missingDiagnosisBody: "Typed diagnosis is unavailable for this report artifact.",
    missingSummaryBody: "Diagnosis details are limited for this report.",
  });
  const sharedWhatChanged = sharedModule.buildWhatChangedPresentation(null, {
    itemIdPrefix: null,
    itemLimit: 3,
    includeDirectionInDetail: true,
    noticeFallbackBody: "Comparison results are bounded by the comparable report evidence that was available.",
    missingWhatChangedBody: "Typed report-over-report comparison is unavailable for this report artifact.",
    unavailableComparisonBody: "A prior comparable report is not available yet.",
  });
  const dashboard = dashboardModule.buildDashboardDiagnosisViewModel({
    diagnosis: null,
    whatChanged: null,
    hasReport: true,
  });
  const report = detailModule.buildReportDetailPresentationModel({
    report: makeReport(),
    artifactModel: null,
    artifactSignals: null,
  });

  assert.equal(sharedDiagnosis.notice, null);
  assert.equal(sharedDiagnosis.supportingMetrics.length, 0);
  assert.equal(sharedDiagnosis.unavailableBody, "Typed diagnosis is unavailable for this report artifact.");
  assert.equal(sharedWhatChanged.notice, null);
  assert.equal(sharedWhatChanged.improved.length, 0);
  assert.equal(sharedWhatChanged.unavailableBody, "Typed report-over-report comparison is unavailable for this report artifact.");
  assert.equal(dashboard.heading, "No primary constraint identified yet");
  assert.equal(dashboard.hasTypedDiagnosis, false);
  assert.equal(dashboard.notice, null);
  assert.equal(dashboard.comparisonContext, null);
  assert.equal(dashboard.unavailableBody, "This snapshot does not contain enough structured evidence to identify a primary growth constraint yet.");
  assert.equal(report.diagnosis.notice, null);
  assert.equal(report.diagnosis.unavailableBody, "Typed diagnosis is unavailable for this report artifact.");
  assert.equal(report.whatChanged.notice, null);
  assert.equal(report.whatChanged.unavailableBody, "Typed report-over-report comparison is unavailable for this report artifact.");
});

test("shared diagnosis and what-changed helpers do not strengthen backend copy", async () => {
  const [sharedModule, dashboardModule, detailModule] = await loadModules(Date.now() + 5);
  const diagnosisSummary =
    "Current profile shows mixed pressure across churn_pressure_primary; the evidence does not support a single dominant constraint.";
  const watchSummary = "Revenue softened and should be watched next cycle.";
  const diagnosis = makeDiagnosis({
    diagnosisType: "mixed_pressure",
    summaryText: diagnosisSummary,
    availability: "limited",
    confidence: "low",
    confidenceAdjusted: true,
    evidenceStrength: "weak",
    reasonCodes: ["mixed_constraint_signals"],
    dataQualityLevel: "limited",
    analysisMode: "reduced",
  });
  const whatChanged = makeWhatChanged({
    watchNext: [makeComparisonItem({ summaryText: watchSummary })],
    availability: "limited",
    confidence: "low",
    confidenceAdjusted: true,
    evidenceStrength: "weak",
    insufficientReason: "limited_monthly_history",
    reasonCodes: ["limited_monthly_history"],
    dataQualityLevel: "limited",
    analysisMode: "reduced",
  });

  const sharedDiagnosis = sharedModule.buildDiagnosisPresentation(diagnosis, {
    metricIdPrefix: "shared",
    supportingMetricLimit: 4,
    noticeFallbackBody: "Diagnosis is bounded by the available evidence in this report.",
    missingDiagnosisBody: "Typed diagnosis is unavailable for this report artifact.",
    missingSummaryBody: "Diagnosis details are limited for this report.",
  });
  const sharedWhatChanged = sharedModule.buildWhatChangedPresentation(whatChanged, {
    itemIdPrefix: null,
    itemLimit: 3,
    includeDirectionInDetail: true,
    noticeFallbackBody: "Comparison results are bounded by the comparable report evidence that was available.",
    missingWhatChangedBody: "Typed report-over-report comparison is unavailable for this report artifact.",
    unavailableComparisonBody: "A prior comparable report is not available yet.",
  });
  const dashboard = dashboardModule.buildDashboardDiagnosisViewModel({
    diagnosis,
    whatChanged,
    hasReport: true,
  });
  const report = detailModule.buildReportDetailPresentationModel({
    report: makeReport(),
    artifactModel: makeArtifactModel({ diagnosis, whatChanged }),
    artifactSignals: null,
  });

  assert.equal(sharedDiagnosis.summary, diagnosisSummary);
  assert.equal(dashboard.summary, diagnosisSummary);
  assert.equal(report.diagnosis.summary, diagnosisSummary);
  assert.equal(sharedDiagnosis.summary.includes("caused"), false);
  assert.equal(sharedDiagnosis.summary.includes("definitive"), false);
  assert.equal(sharedWhatChanged.watchNext[0]?.body, watchSummary);
  assert.equal(dashboard.comparisonContext?.body, watchSummary);
  assert.equal(report.whatChanged.watchNext[0]?.body, watchSummary);
  assert.equal(sharedWhatChanged.watchNext[0]?.body.includes("definitely"), false);
});
