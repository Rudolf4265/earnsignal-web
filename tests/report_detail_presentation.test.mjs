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

  assert.equal(model.heroTitle, "Creator Earnings Report");
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
