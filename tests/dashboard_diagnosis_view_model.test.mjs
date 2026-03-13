import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/dashboard/diagnosis.ts")).href;

async function loadModule(seed = Date.now()) {
  return import(`${moduleUrl}?t=${seed}`);
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

test("dashboard diagnosis view-model maps high-confidence typed diagnosis into a compact card model", async () => {
  const { buildDashboardDiagnosisViewModel } = await loadModule(Date.now() + 1);
  const result = buildDashboardDiagnosisViewModel({
    diagnosis: makeDiagnosis({
      supportingMetrics: [
        {
          metric: "churn_rate",
          currentValue: 0.12,
          priorValue: 0.08,
          direction: "up",
          source: "observed",
          availability: "available",
          confidence: "high",
          confidenceAdjusted: false,
          evidenceStrength: "strong",
          insufficientReason: null,
          reasonCodes: ["churn_rate_worsened"],
          dataQualityLevel: "good",
          analysisMode: "full",
          recommendationMode: null,
        },
      ],
    }),
    whatChanged: null,
    hasReport: true,
  });

  assert.equal(result.hasTypedDiagnosis, true);
  assert.equal(result.diagnosisTypeLabel, "Churn pressure");
  assert.equal(result.summary, "Current profile looks more churn-limited based on the latest typed report evidence.");
  assert.equal(result.notice, null);
  assert.equal(result.supportingMetrics[0]?.label, "Churn Rate");
  assert.equal(result.supportingMetrics[0]?.value, "12%");
  assert.equal(result.supportingMetrics[0]?.detail?.includes("Prior 8%"), true);
  assert.equal(result.comparisonContext, null);
  assert.equal(result.unavailableBody, null);
});

test("dashboard diagnosis view-model keeps mixed and reduced-confidence diagnosis states explicit", async () => {
  const { buildDashboardDiagnosisViewModel } = await loadModule(Date.now() + 2);
  const result = buildDashboardDiagnosisViewModel({
    diagnosis: makeDiagnosis({
      diagnosisType: "mixed_pressure",
      summaryText: "Current profile shows mixed pressure and the evidence does not support a single dominant constraint.",
      availability: "limited",
      confidence: "low",
      confidenceAdjusted: true,
      evidenceStrength: "weak",
      reasonCodes: ["mixed_constraint_signals"],
      dataQualityLevel: "limited",
      analysisMode: "reduced",
    }),
    whatChanged: null,
    hasReport: true,
  });

  assert.equal(result.diagnosisTypeLabel, "Mixed pressure");
  assert.equal(result.summary?.includes("mixed pressure"), true);
  assert.equal(result.notice?.label, "Reduced confidence");
  assert.equal(result.notice?.body.includes("Reduced confidence"), true);
});

test("dashboard diagnosis view-model surfaces unavailable typed diagnosis honestly", async () => {
  const { buildDashboardDiagnosisViewModel } = await loadModule(Date.now() + 3);
  const result = buildDashboardDiagnosisViewModel({
    diagnosis: makeDiagnosis({
      diagnosisType: "insufficient_evidence",
      summaryText: null,
      availability: "unavailable",
      confidence: "low",
      confidenceAdjusted: true,
      evidenceStrength: "none",
      insufficientReason: "missing_subscriber_evidence",
      reasonCodes: ["missing_subscriber_evidence"],
      dataQualityLevel: "limited",
      analysisMode: "reduced",
    }),
    whatChanged: null,
    hasReport: true,
  });

  assert.equal(result.hasTypedDiagnosis, true);
  assert.equal(result.diagnosisTypeLabel, "Insufficient evidence");
  assert.equal(result.notice?.label, "Unavailable");
  assert.equal(result.unavailableBody?.includes("Unavailable for this report because subscriber evidence is missing."), true);
});

test("dashboard diagnosis view-model stays conservative for older artifacts without typed diagnosis", async () => {
  const { buildDashboardDiagnosisViewModel } = await loadModule(Date.now() + 4);
  const result = buildDashboardDiagnosisViewModel({
    diagnosis: null,
    whatChanged: makeWhatChanged({
      watchNext: [
        {
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
        },
      ],
    }),
    hasReport: true,
  });

  assert.equal(result.hasTypedDiagnosis, false);
  assert.equal(result.notice, null);
  assert.equal(result.comparisonContext, null);
  assert.equal(result.unavailableBody, "Diagnosis unavailable for this dashboard snapshot.");
});

test("dashboard diagnosis view-model does not overstate when typed diagnosis summary is present", async () => {
  const { buildDashboardDiagnosisViewModel } = await loadModule(Date.now() + 5);
  const summaryText =
    "Current profile shows mixed pressure across churn_pressure_primary; the evidence does not support a single dominant constraint.";
  const result = buildDashboardDiagnosisViewModel({
    diagnosis: makeDiagnosis({
      diagnosisType: "mixed_pressure",
      summaryText,
      availability: "limited",
      confidence: "low",
      confidenceAdjusted: true,
      evidenceStrength: "weak",
      reasonCodes: ["mixed_constraint_signals"],
      dataQualityLevel: "limited",
      analysisMode: "reduced",
    }),
    whatChanged: makeWhatChanged({
      watchNext: [
        {
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
        },
      ],
    }),
    hasReport: true,
  });

  assert.equal(result.summary, summaryText);
  assert.equal(result.summary.includes("definitive"), false);
  assert.equal(result.summary.includes("caused"), false);
});

test("dashboard diagnosis view-model adds bounded watch-next context only from typed comparable data", async () => {
  const { buildDashboardDiagnosisViewModel } = await loadModule(Date.now() + 6);
  const result = buildDashboardDiagnosisViewModel({
    diagnosis: makeDiagnosis(),
    whatChanged: makeWhatChanged({
      watchNext: [
        {
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
        },
      ],
    }),
    hasReport: true,
  });

  assert.equal(result.comparisonContext?.label, "Watch next");
  assert.equal(result.comparisonContext?.body, "Revenue softened and should be watched next cycle.");
  assert.equal(result.comparisonContext?.stateLabel, "Reduced confidence");
  assert.equal(result.comparisonContext?.detail?.includes("Compared with Jan 1, 2026 to Jan 31, 2026"), true);
});

test("dashboard diagnosis view-model omits comparison context when typed comparison is unavailable", async () => {
  const { buildDashboardDiagnosisViewModel } = await loadModule(Date.now() + 7);
  const result = buildDashboardDiagnosisViewModel({
    diagnosis: makeDiagnosis(),
    whatChanged: makeWhatChanged({
      comparisonAvailable: false,
      availability: "unavailable",
      confidence: "low",
      confidenceAdjusted: true,
      evidenceStrength: "none",
      insufficientReason: "prior_report_unavailable",
      reasonCodes: ["prior_report_unavailable"],
      watchNext: [
        {
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
        },
      ],
    }),
    hasReport: true,
  });

  assert.equal(result.comparisonContext, null);
});
