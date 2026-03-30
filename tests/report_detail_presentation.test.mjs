import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/report/detail-presentation.ts")).href;

async function loadModule(seed = Date.now()) {
  void seed;
  return import(moduleUrl);
}

function makeReport(overrides = {}) {
  return {
    id: "rep_test_001",
    title: "Creator Earnings Snapshot",
    status: "ready",
    summary: "No summary available.",
    createdAt: "2026-03-01T10:00:00Z",
    updatedAt: "2026-03-01T10:00:00Z",
    artifactUrl: "/v1/reports/rep_test_001/artifact",
    pdfUrl: "/v1/reports/rep_test_001/artifact",
    artifactJsonUrl: "/v1/reports/rep_test_001/artifact.json",
    keySignals: [],
    recommendedActions: [],
    platformsIncluded: [],
    sourceCount: null,
    reportKind: "unknown",
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

test("buildReportDetailPresentationModel maps production sections into structured narrative groups", async () => {
  const { buildReportDetailPresentationModel } = await loadModule(Date.now() + 1);

  const model = buildReportDetailPresentationModel({
    report: makeReport({
      id: "rep_prod_001",
      title: "Report rep_prod_001",
      keySignals: ["Platform concentration risk remains elevated on one channel."],
      recommendedActions: ["Review paid cohort retention weekly."],
      metrics: {
        netRevenue: 215000,
        subscribers: 1400,
        stabilityIndex: 87,
        churnVelocity: 5,
        coverageMonths: 6,
        platformsConnected: 2,
      },
    }),
    artifactModel: {
      reportId: "rep_prod_001",
      schemaVersion: "v1",
      createdAt: "2026-03-01T10:00:00Z",
      executiveSummaryParagraphs: ["Revenue quality improved while volatility eased."],
      kpis: {
        netRevenue: 215000,
        subscribers: 1400,
        stabilityIndex: 87,
        churnVelocity: 5,
      },
      sections: [
        {
          title: "Revenue Snapshot",
          paragraphs: [],
          bullets: ["2026-01: 200000", "2026-02: 215000"],
        },
        {
          title: "Subscribers Retention",
          paragraphs: [],
          bullets: ["Retention reached 84% across paid cohorts.", "ARPU is $42 for core memberships."],
        },
        {
          title: "Platform Mix",
          paragraphs: [],
          bullets: ["Concentration score: 68", "YouTube remains the largest channel."],
        },
        {
          title: "Key Signals",
          paragraphs: [],
          bullets: ["Revenue momentum is improving with stable churn."],
        },
        {
          title: "Recommended Actions",
          paragraphs: [],
          bullets: ["Shift spend toward retention experiments first."],
        },
        {
          title: "Outlook",
          paragraphs: [],
          bullets: [
            "Base case points to steady quarter-over-quarter growth.",
            "Upside from bundle conversion could accelerate revenue.",
            "Downside risk is concentrated in one channel.",
          ],
        },
        {
          title: "Appendix",
          paragraphs: ["Method assumptions and source caveats."],
          bullets: [],
        },
      ],
    },
    artifactSignals: {
      keySignals: [
        "Revenue momentum remains positive in high-retention cohorts.",
        "Platform concentration risk remains elevated on one channel.",
      ],
      recommendedActions: ["Prioritize retention loop tests before acquisition scale-up."],
      trendPreview: "Revenue trend is gradually improving through the latest period.",
      revenueTrend: [
        { label: "Dec 2025", value: 198000 },
        { label: "Jan 2026", value: 205500 },
        { label: "Feb 2026", value: 215000 },
      ],
    },
  });

  assert.equal(model.heroTitle, "Combined Report — 2 Sources");
  assert.equal(model.executiveSummary[0], "Revenue quality improved while volatility eased.");
  assert.equal(model.heroMetrics.some((metric) => metric.label === "Net Revenue"), true);
  assert.equal(model.heroMetrics.some((metric) => metric.label === "Creator Health"), true);
  assert.equal(model.heroMetrics.some((metric) => metric.label === "Platform Risk"), true);
  assert.equal(model.keySignals.length > 0, true);
  assert.equal(model.revenueTrend.points.length, 3);
  assert.equal(model.revenueTrend.points[2]?.value, 215000);
  assert.equal(model.subscriberHealth.metrics.some((metric) => metric.id === "retention"), true);
  assert.equal(model.subscriberHealth.metrics.some((metric) => metric.id === "arpu"), true);
  assert.equal(model.recommendations[0]?.body, "Prioritize retention loop tests before acquisition scale-up.");
  assert.equal(model.revenueOutlook.cards.some((card) => card.title === "Base Case"), true);
  assert.equal(model.revenueOutlook.cards.some((card) => card.title === "Upside"), true);
  assert.equal(model.revenueOutlook.cards.some((card) => card.title === "Downside"), true);
  assert.equal(model.appendixSections.some((section) => section.title === "Appendix"), true);
});

test("buildReportDetailPresentationModel degrades gracefully for sparse report data", async () => {
  const { buildReportDetailPresentationModel } = await loadModule(Date.now() + 2);

  const model = buildReportDetailPresentationModel({
    report: makeReport({
      title: "Q1 Revenue Quality",
      summary: "No summary available.",
    }),
    artifactModel: null,
    artifactSignals: null,
  });

  assert.equal(model.heroTitle, "Q1 Revenue Quality");
  assert.equal(model.executiveSummary.length, 1);
  assert.equal(model.executiveSummary[0].includes("Summary details are limited"), true);
  assert.equal(model.heroNotice, null);
  assert.equal(model.keySignals.length, 0);
  assert.equal(model.revenueTrend.points.length, 0);
  assert.equal(model.subscriberHealth.metrics.length, 0);
  assert.equal(model.recommendations.length, 0);
  assert.equal(model.revenueOutlook.cards.length, 0);
  assert.equal(model.heroMetrics.find((metric) => metric.id === "net_revenue")?.value, "$--");
});

test("buildReportDetailPresentationModel falls back to canonical title when explicit title conflicts with included sources", async () => {
  const { buildReportDetailPresentationModel } = await loadModule(Date.now() + 21);

  const model = buildReportDetailPresentationModel({
    report: makeReport({
      title: "Combined Report — Patreon + Substack + YouTube",
      platformsIncluded: ["Patreon", "Substack"],
      sourceCount: 2,
      reportKind: "combined",
      metrics: {
        netRevenue: null,
        subscribers: null,
        stabilityIndex: null,
        churnVelocity: null,
        coverageMonths: null,
        platformsConnected: 2,
      },
    }),
    artifactModel: null,
    artifactSignals: null,
  });

  assert.equal(model.heroTitle, "Combined Report — Patreon + Substack");
});

test("buildReportDetailPresentationModel maps platform-risk insight tone into hero signal when no score exists", async () => {
  const { buildReportDetailPresentationModel } = await loadModule(Date.now() + 3);

  const model = buildReportDetailPresentationModel({
    report: makeReport({
      keySignals: ["Platform concentration risk remains elevated on one channel."],
    }),
    artifactModel: {
      reportId: "rep_platform_signal_001",
      schemaVersion: "v1",
      createdAt: "2026-03-01T10:00:00Z",
      executiveSummaryParagraphs: [],
      kpis: {
        netRevenue: null,
        subscribers: null,
        stabilityIndex: null,
        churnVelocity: null,
      },
      sections: [],
    },
    artifactSignals: null,
  });

  const platformRiskMetric = model.heroMetrics.find((metric) => metric.id === "platform_risk");
  assert.equal(platformRiskMetric?.value, "Warning");
});

test("buildReportDetailPresentationModel surfaces typed limited and unavailable truth states", async () => {
  const { buildReportDetailPresentationModel } = await loadModule(Date.now() + 4);

  const model = buildReportDetailPresentationModel({
    report: makeReport({
      metrics: {
        netRevenue: 10000,
        subscribers: 1200,
        stabilityIndex: 61,
        churnVelocity: null,
        coverageMonths: 2,
        platformsConnected: 1,
      },
    }),
    artifactModel: {
      reportId: "rep_truth_detail_001",
      schemaVersion: "v1",
      createdAt: "2026-03-01T10:00:00Z",
      analysisMode: "reduced",
      dataQualityLevel: "limited",
      executiveSummaryParagraphs: ["Reduced confidence due to limited subscriber evidence."],
      kpis: {
        netRevenue: 10000,
        subscribers: 1200,
        stabilityIndex: 61,
        churnVelocity: null,
      },
      sections: [],
      metricSnapshot: {
        churnRisk: 50,
        churnRiskRawScore: 72,
        churnRiskConfidence: "low",
        churnRiskAvailability: "unavailable",
        churnRiskReasonCodes: ["missing_subscriber_evidence"],
        activeSubscribersSource: "derived",
        churnRateSource: "derived",
        arpuSource: "derived",
        stabilityConfidence: 0.52,
        analysisMode: "reduced",
        dataQualityLevel: "limited",
      },
      metricProvenance: {
        active_subscribers: {
          value: 1200,
          source: "derived",
          confidence: "low",
          confidenceAdjusted: false,
          availability: "limited",
          evidenceStrength: "weak",
          insufficientReason: "missing_subscriber_snapshot",
          reasonCodes: ["missing_subscriber_snapshot"],
          dataQualityLevel: "limited",
          analysisMode: "reduced",
          recommendationMode: null,
          confidenceScore: null,
        },
      },
      signals: [
        {
          id: "sig_1",
          title: "Retention signal needs validation",
          description: "Subscriber evidence is incomplete this cycle.",
          category: "risk",
          severity: 60,
          signalType: "churn_acceleration",
          confidenceScore: 0.45,
          availability: "limited",
          confidence: "low",
          confidenceAdjusted: true,
          evidenceStrength: "weak",
          insufficientReason: "missing_subscriber_snapshot",
          reasonCodes: ["missing_subscriber_snapshot"],
          dataQualityLevel: "limited",
          analysisMode: "reduced",
          recommendationMode: "watch",
        },
      ],
      recommendations: [
        {
          id: "rec_1",
          title: "Validate churn visibility before a retention sprint",
          description: "Confirm subscriber snapshot coverage before acting.",
          expectedImpact: "low",
          effort: "low",
          confidenceScore: 0.45,
          steps: ["Verify subscriber snapshot coverage."],
          linkedSignals: ["churn_acceleration"],
          availability: "limited",
          confidence: "low",
          confidenceAdjusted: true,
          evidenceStrength: "weak",
          insufficientReason: "missing_subscriber_snapshot",
          reasonCodes: ["missing_subscriber_snapshot"],
          dataQualityLevel: "limited",
          analysisMode: "reduced",
          recommendationMode: "validate",
        },
      ],
      outlook: {
        summary: [],
        items: [
          {
            id: "churn_outlook",
            title: "Churn Outlook",
            body: "Unavailable for this report because subscriber evidence is missing.",
            level: "medium",
            score: 50,
            scoreBeforeAdjustment: 72,
            confidenceScore: 0.35,
            availability: "unavailable",
            confidence: "low",
            confidenceAdjusted: true,
            evidenceStrength: "none",
            insufficientReason: "missing_subscriber_evidence",
            reasonCodes: ["missing_subscriber_evidence"],
            dataQualityLevel: "limited",
            analysisMode: "reduced",
            recommendationMode: null,
          },
        ],
      },
      stability: {
        score: 61,
        band: "medium",
        explanation: "Stability is medium with reduced confidence due to limited evidence.",
        confidenceScore: 0.52,
        components: null,
        availability: "limited",
        confidence: "low",
        confidenceAdjusted: true,
        evidenceStrength: "weak",
        insufficientReason: "missing_subscriber_snapshot",
        reasonCodes: ["missing_subscriber_snapshot"],
        dataQualityLevel: "limited",
        analysisMode: "reduced",
        recommendationMode: null,
      },
    },
    artifactSignals: {
      keySignals: [],
      recommendedActions: [],
      trendPreview: null,
      revenueTrend: [],
    },
  });

  assert.equal(model.heroNotice?.label, "Unavailable");
  assert.equal(model.heroMetrics.find((metric) => metric.id === "creator_health")?.stateLabel, "Reduced confidence");
  assert.equal(model.subscriberHealth.notice?.label, "Unavailable");
  assert.equal(model.subscriberHealth.metrics.find((metric) => metric.id === "subscribers")?.stateLabel, "Heuristic signal");
  assert.equal(model.recommendations[0]?.label, "Validate first");
  assert.equal(model.revenueOutlook.notice?.label, "Unavailable");
  assert.equal(model.revenueOutlook.cards[0]?.stateLabel, "Unavailable");
});

test("buildReportDetailPresentationModel surfaces typed diagnosis and what-changed sections explicitly", async () => {
  const { buildReportDetailPresentationModel } = await loadModule(Date.now() + 5);

  const model = buildReportDetailPresentationModel({
    report: makeReport({
      id: "rep_diag_cmp_surface",
      metrics: {
        netRevenue: 9400,
        subscribers: 980,
        stabilityIndex: 57,
        churnVelocity: null,
        coverageMonths: 6,
        platformsConnected: 2,
      },
    }),
    artifactModel: {
      reportId: "rep_diag_cmp_surface",
      schemaVersion: "v1",
      createdAt: "2026-03-01T10:00:00Z",
      executiveSummaryParagraphs: [],
      kpis: {
        netRevenue: 9400,
        subscribers: 980,
        stabilityIndex: 57,
        churnVelocity: null,
      },
      sections: [],
      diagnosis: {
        diagnosisType: "churn_pressure",
        summaryText: "Current profile looks more churn-limited based on elevated churn pressure.",
        supportingMetrics: [
          {
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
            reasonCodes: ["churn_pressure_high"],
            dataQualityLevel: "good",
            analysisMode: "full",
            recommendationMode: null,
          },
        ],
        primitives: {
          revenueTrendDirection: "down",
          activeSubscribersDirection: "down",
          churnPressureLevel: "high",
          concentrationPressureLevel: "low",
          monetizationEfficiencyLevel: "low",
          stabilityDirection: "down",
          evidenceStrength: "moderate",
          dataQualityLevel: "good",
          analysisMode: "full",
        },
        availability: "limited",
        confidence: "medium",
        confidenceAdjusted: true,
        evidenceStrength: "moderate",
        insufficientReason: null,
        reasonCodes: ["churn_pressure_primary"],
        dataQualityLevel: "good",
        analysisMode: "full",
        recommendationMode: null,
      },
      whatChanged: {
        comparisonAvailable: true,
        priorReportId: "rep_prev_001",
        priorPeriodStart: "2026-01-01",
        priorPeriodEnd: "2026-01-31",
        comparableMetricCount: 3,
        comparisonBasisMetrics: ["latest_net_revenue", "active_subscribers"],
        deltas: {},
        whatImproved: [
          {
            category: "platform",
            metric: "concentration_risk",
            changeType: "improved",
            direction: "down",
            materiality: "medium",
            summaryText: "Platform concentration eased versus the prior report.",
            availability: "available",
            confidence: "medium",
            confidenceAdjusted: false,
            evidenceStrength: "moderate",
            insufficientReason: null,
            reasonCodes: ["concentration_risk_improved"],
            dataQualityLevel: "good",
            analysisMode: "full",
            recommendationMode: null,
          },
        ],
        whatWorsened: [
          {
            category: "churn",
            metric: "churn_rate",
            changeType: "worsened",
            direction: "up",
            materiality: "high",
            summaryText: "Churn worsened relative to the prior report.",
            availability: "available",
            confidence: "medium",
            confidenceAdjusted: false,
            evidenceStrength: "moderate",
            insufficientReason: null,
            reasonCodes: ["churn_rate_worsened"],
            dataQualityLevel: "good",
            analysisMode: "full",
            recommendationMode: null,
          },
        ],
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
        availability: "limited",
        confidence: "medium",
        confidenceAdjusted: true,
        evidenceStrength: "moderate",
        insufficientReason: null,
        reasonCodes: ["comparison_basis_available"],
        dataQualityLevel: "good",
        analysisMode: "full",
        recommendationMode: null,
      },
      recommendations: [],
      signals: [],
      metricProvenance: {},
      metricSnapshot: null,
      outlook: null,
      stability: null,
    },
    artifactSignals: null,
  });

  assert.equal(model.diagnosis.diagnosisTypeLabel, "Churn pressure");
  assert.equal(model.diagnosis.summary, "Current profile looks more churn-limited based on elevated churn pressure.");
  assert.equal(model.diagnosis.notice?.label, "Reduced confidence");
  assert.equal(model.diagnosis.supportingMetrics[0]?.label, "Churn Rate");
  assert.equal(model.diagnosis.primitives.some((entry) => entry.label === "Churn pressure" && entry.value === "High"), true);
  assert.equal(model.whatChanged.comparisonAvailable, true);
  assert.equal(model.whatChanged.priorPeriodLabel, "Compared with Jan 1, 2026 to Jan 31, 2026");
  assert.equal(model.whatChanged.improved[0]?.body, "Platform concentration eased versus the prior report.");
  assert.equal(model.whatChanged.worsened[0]?.body, "Churn worsened relative to the prior report.");
  assert.equal(model.whatChanged.watchNext[0]?.stateLabel, "Reduced confidence");
  assert.equal(model.executiveSummary.some((line) => line.includes("churn-limited")), true);
});

test("buildReportDetailPresentationModel keeps mixed diagnosis and comparison-unavailable states explicit", async () => {
  const { buildReportDetailPresentationModel } = await loadModule(Date.now() + 6);

  const model = buildReportDetailPresentationModel({
    report: makeReport({
      id: "rep_mixed_diag_surface",
    }),
    artifactModel: {
      reportId: "rep_mixed_diag_surface",
      schemaVersion: "v1",
      createdAt: "2026-03-01T10:00:00Z",
      executiveSummaryParagraphs: [],
      kpis: {
        netRevenue: null,
        subscribers: null,
        stabilityIndex: null,
        churnVelocity: null,
      },
      sections: [],
      diagnosis: {
        diagnosisType: "mixed_pressure",
        summaryText:
          "Current profile shows mixed pressure across churn_pressure_primary, monetization_pressure_primary; the evidence does not support a single dominant constraint.",
        supportingMetrics: [],
        primitives: null,
        availability: "limited",
        confidence: "low",
        confidenceAdjusted: true,
        evidenceStrength: "weak",
        insufficientReason: null,
        reasonCodes: ["mixed_constraint_signals"],
        dataQualityLevel: "limited",
        analysisMode: "reduced",
        recommendationMode: null,
      },
      whatChanged: {
        comparisonAvailable: false,
        priorReportId: null,
        priorPeriodStart: null,
        priorPeriodEnd: null,
        comparableMetricCount: 0,
        comparisonBasisMetrics: [],
        deltas: {},
        whatImproved: [],
        whatWorsened: [],
        watchNext: [],
        availability: "unavailable",
        confidence: "low",
        confidenceAdjusted: true,
        evidenceStrength: "none",
        insufficientReason: "prior_report_unavailable",
        reasonCodes: ["prior_report_unavailable"],
        dataQualityLevel: "limited",
        analysisMode: "reduced",
        recommendationMode: null,
      },
      recommendations: [],
      signals: [],
      metricProvenance: {},
      metricSnapshot: null,
      outlook: null,
      stability: null,
    },
    artifactSignals: null,
  });

  assert.equal(model.diagnosis.diagnosisTypeLabel, "Mixed pressure");
  assert.equal(model.diagnosis.summary.includes("mixed pressure"), true);
  assert.equal(model.diagnosis.notice?.label, "Reduced confidence");
  assert.equal(model.whatChanged.comparisonAvailable, false);
  assert.equal(model.whatChanged.unavailableBody?.includes("Unavailable for this report"), true);
  assert.deepEqual(model.whatChanged.improved, []);
  assert.deepEqual(model.whatChanged.worsened, []);
  assert.deepEqual(model.whatChanged.watchNext, []);
});

test("buildReportDetailPresentationModel keeps low-confidence diagnosis and comparison wording bounded", async () => {
  const { buildReportDetailPresentationModel } = await loadModule(Date.now() + 7);
  const diagnosisSummary =
    "Current profile shows mixed pressure across churn_pressure_primary; the evidence does not support a single dominant constraint.";
  const watchSummary = "Revenue softened and should be watched next cycle.";

  const model = buildReportDetailPresentationModel({
    report: makeReport({
      id: "rep_bounded_copy",
    }),
    artifactModel: {
      reportId: "rep_bounded_copy",
      schemaVersion: "v1",
      createdAt: "2026-03-01T10:00:00Z",
      executiveSummaryParagraphs: [],
      kpis: {
        netRevenue: null,
        subscribers: null,
        stabilityIndex: null,
        churnVelocity: null,
      },
      sections: [],
      diagnosis: {
        diagnosisType: "mixed_pressure",
        summaryText: diagnosisSummary,
        supportingMetrics: [],
        primitives: null,
        availability: "limited",
        confidence: "low",
        confidenceAdjusted: true,
        evidenceStrength: "weak",
        insufficientReason: null,
        reasonCodes: ["mixed_constraint_signals"],
        dataQualityLevel: "limited",
        analysisMode: "reduced",
        recommendationMode: null,
      },
      whatChanged: {
        comparisonAvailable: true,
        priorReportId: "rep_prev_bounded",
        priorPeriodStart: "2026-01-01",
        priorPeriodEnd: "2026-01-31",
        comparableMetricCount: 1,
        comparisonBasisMetrics: ["latest_net_revenue"],
        deltas: {},
        whatImproved: [],
        whatWorsened: [],
        watchNext: [
          {
            category: "revenue",
            metric: "latest_net_revenue",
            changeType: "watch",
            direction: "down",
            materiality: "medium",
            summaryText: watchSummary,
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
      recommendations: [],
      signals: [],
      metricProvenance: {},
      metricSnapshot: null,
      outlook: null,
      stability: null,
    },
    artifactSignals: null,
  });

  assert.equal(model.diagnosis.summary, diagnosisSummary);
  assert.equal(model.diagnosis.summary.includes("caused"), false);
  assert.equal(model.whatChanged.watchNext[0]?.body, watchSummary);
  assert.equal(model.whatChanged.watchNext[0]?.body.includes("definitely"), false);
  assert.equal(model.whatChanged.notice?.label, "Reduced confidence");
});
