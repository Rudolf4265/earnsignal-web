import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/report/wow-summary-view-model.ts")).href;

async function loadModule() {
  return import(moduleUrl);
}

// ── Minimal stubs ─────────────────────────────────────────────────────────────

function makePresentation(overrides = {}) {
  return {
    heroTitle: "Creator Report",
    heroSubtitle: null,
    heroNotice: null,
    executiveSummary: [],
    heroMetrics: [
      { id: "net_revenue", label: "Net Revenue", value: "$12,400", detail: null, stateLabel: null, stateTone: null },
      { id: "creator_health", label: "Creator Health", value: "74/100", detail: null, stateLabel: null, stateTone: null },
      { id: "platform_risk", label: "Platform Risk", value: "64%", detail: null, stateLabel: null, stateTone: null },
    ],
    signals: [],
    keySignals: [],
    revenueTrend: { points: [], narrative: null },
    subscriberHealth: {
      notice: null,
      metrics: [
        { id: "subscribers", label: "Subscribers", value: "1,240", detail: null, stateLabel: null, stateTone: null },
      ],
      highlights: [],
    },
    platformMix: {
      notice: null,
      concentrationScore: 64,
      platformsConnected: 2,
      highlights: ["64% of revenue comes from Patreon."],
    },
    recommendations: [],
    revenueOutlook: { notice: null, cards: [], highlights: [] },
    diagnosis: {
      diagnosisTypeLabel: null,
      summary: null,
      notice: null,
      supportingMetrics: [],
      primitives: [],
      unavailableBody: null,
    },
    whatChanged: {
      comparisonAvailable: false,
      priorPeriodLabel: null,
      notice: null,
      improved: [],
      worsened: [],
      watchNext: [],
      unavailableBody: null,
    },
    appendixSections: [],
    ...overrides,
  };
}

function makeArtifactModel(overrides = {}) {
  return {
    reportId: "rep_test_001",
    schemaVersion: "v1",
    createdAt: "2026-03-01T10:00:00Z",
    analysisMode: null,
    dataQualityLevel: null,
    executiveSummaryParagraphs: [],
    kpis: { netRevenue: 12400, subscribers: 1240, stabilityIndex: 74, churnVelocity: 4 },
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

// ── Tests ─────────────────────────────────────────────────────────────────────

test("buildReportWowSummaryViewModel returns four KPI cards", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const result = buildReportWowSummaryViewModel(makePresentation(), makeArtifactModel());

  assert.equal(Array.isArray(result.kpiCards), true);
  assert.equal(result.kpiCards.length, 4);
  assert.equal(result.kpiCards[0].id, "total_revenue");
  assert.equal(result.kpiCards[1].id, "active_subscribers");
  assert.equal(result.kpiCards[2].id, "net_growth");
  assert.equal(result.kpiCards[3].id, "top_platform");
});

test("KPI card Total Revenue reads from heroMetrics", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const result = buildReportWowSummaryViewModel(makePresentation(), makeArtifactModel());

  assert.equal(result.kpiCards[0].value, "$12,400");
});

test("KPI card Active Subscribers reads from subscriberHealth metrics", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const result = buildReportWowSummaryViewModel(makePresentation(), makeArtifactModel());

  assert.equal(result.kpiCards[1].value, "1,240");
});

test("KPI card Top Platform parses a known platform from platformMix highlights", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const result = buildReportWowSummaryViewModel(makePresentation(), makeArtifactModel());

  assert.equal(result.kpiCards[3].value.includes("Patreon"), true);
});

test("KPI card Top Platform falls back gracefully when no platform name is parseable", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const pres = makePresentation({
    platformMix: { notice: null, concentrationScore: 71, platformsConnected: 1, highlights: [] },
  });
  const result = buildReportWowSummaryViewModel(pres, makeArtifactModel());

  assert.notEqual(result.kpiCards[3].value, "");
  // Should show concentration score since no platform name is parseable
  assert.equal(result.kpiCards[3].value.includes("71"), true);
});

test("KPI card Top Platform shows '--' when no concentration data at all", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const pres = makePresentation({
    platformMix: { notice: null, concentrationScore: null, platformsConnected: null, highlights: [] },
  });
  const result = buildReportWowSummaryViewModel(pres, makeArtifactModel());

  assert.equal(result.kpiCards[3].value, "--");
});

test("biggest opportunity uses top recommendation when available", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const pres = makePresentation({
    recommendations: [
      { id: "rec1", label: "Add a $15 tier to capture mid-range supporters", body: "Launching a $15 tier could capture mid-range supporters who are currently upgrading to cancel.", detail: "Estimated 12–18% revenue uplift based on tier migration data.", stateLabel: null, stateTone: null },
    ],
  });
  const result = buildReportWowSummaryViewModel(pres, makeArtifactModel());

  assert.equal(result.opportunity.available, true);
  assert.equal(result.opportunity.finding.includes("$15 tier"), true);
  assert.equal(result.opportunity.upsideLabel?.includes("12–18%"), true);
});

test("biggest opportunity derives from concentration_pressure diagnosis when no recommendations", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const artifactModel = makeArtifactModel({
    diagnosis: {
      diagnosisType: "concentration_pressure",
      summaryText: "Revenue is overly concentrated.",
      supportingMetrics: [],
      primitives: {
        revenueTrendDirection: "flat",
        activeSubscribersDirection: "flat",
        churnPressureLevel: "low",
        concentrationPressureLevel: "high",
        monetizationEfficiencyLevel: "low",
        stabilityDirection: "flat",
        evidenceStrength: "moderate",
        dataQualityLevel: null,
        analysisMode: null,
      },
      availability: "available",
      confidence: "medium",
      confidenceAdjusted: false,
      evidenceStrength: "moderate",
      insufficientReason: null,
      reasonCodes: [],
      dataQualityLevel: null,
      analysisMode: null,
      recommendationMode: null,
    },
  });
  const result = buildReportWowSummaryViewModel(makePresentation(), artifactModel);

  assert.equal(result.opportunity.available, true);
  assert.equal(result.opportunity.finding.toLowerCase().includes("concentrat"), true);
});

test("biggest opportunity derives from churn_pressure diagnosis", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const artifactModel = makeArtifactModel({
    diagnosis: {
      diagnosisType: "churn_pressure",
      summaryText: "Churn is elevated.",
      supportingMetrics: [],
      primitives: {
        revenueTrendDirection: "down",
        activeSubscribersDirection: "down",
        churnPressureLevel: "high",
        concentrationPressureLevel: "low",
        monetizationEfficiencyLevel: "medium",
        stabilityDirection: "down",
        evidenceStrength: "strong",
        dataQualityLevel: null,
        analysisMode: null,
      },
      availability: "available",
      confidence: "high",
      confidenceAdjusted: false,
      evidenceStrength: "strong",
      insufficientReason: null,
      reasonCodes: [],
      dataQualityLevel: null,
      analysisMode: null,
      recommendationMode: null,
    },
  });
  const result = buildReportWowSummaryViewModel(makePresentation(), artifactModel);

  assert.equal(result.opportunity.available, true);
  assert.equal(result.opportunity.finding.toLowerCase().includes("churn"), true);
});

test("biggest opportunity shows unavailable state gracefully when no data", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const result = buildReportWowSummaryViewModel(makePresentation(), makeArtifactModel());

  assert.equal(typeof result.opportunity.finding, "string");
  assert.equal(typeof result.opportunity.action, "string");
  // available = false is acceptable when no recommendations or diagnosis type
  assert.equal(typeof result.opportunity.available, "boolean");
});

test("platform mix interpretation reflects concentration level correctly", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();

  const highConc = makePresentation({ platformMix: { notice: null, concentrationScore: 82, platformsConnected: 1, highlights: ["82% Patreon"] } });
  const highResult = buildReportWowSummaryViewModel(highConc, makeArtifactModel());
  assert.equal(highResult.platformMix.interpretationText.toLowerCase().includes("significant"), true);

  const lowConc = makePresentation({ platformMix: { notice: null, concentrationScore: 30, platformsConnected: 3, highlights: [] } });
  const lowResult = buildReportWowSummaryViewModel(lowConc, makeArtifactModel());
  assert.equal(lowResult.platformMix.interpretationText.toLowerCase().includes("diversified"), true);
});

test("platform mix shows unavailable copy when no data", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const pres = makePresentation({ platformMix: { notice: null, concentrationScore: null, platformsConnected: null, highlights: [] } });
  const result = buildReportWowSummaryViewModel(pres, makeArtifactModel());

  assert.equal(result.platformMix.available, false);
  assert.equal(result.platformMix.interpretationText.toLowerCase().includes("not available"), true);
});

test("momentum builds correct summary for revenue-up subscriber-flat", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const artifactModel = makeArtifactModel({
    diagnosis: {
      diagnosisType: null,
      summaryText: null,
      supportingMetrics: [],
      primitives: {
        revenueTrendDirection: "up",
        activeSubscribersDirection: "flat",
        churnPressureLevel: "low",
        concentrationPressureLevel: "medium",
        monetizationEfficiencyLevel: "medium",
        stabilityDirection: "up",
        evidenceStrength: "moderate",
        dataQualityLevel: null,
        analysisMode: null,
      },
      availability: "available",
      confidence: "medium",
      confidenceAdjusted: false,
      evidenceStrength: "moderate",
      insufficientReason: null,
      reasonCodes: [],
      dataQualityLevel: null,
      analysisMode: null,
      recommendationMode: null,
    },
  });
  const result = buildReportWowSummaryViewModel(makePresentation(), artifactModel);

  assert.equal(result.momentum.revenueTrend, "up");
  assert.equal(result.momentum.subscriberTrend, "flat");
  assert.equal(result.momentum.summaryText.toLowerCase().includes("flattened"), true);
});

test("momentum falls back gracefully when no diagnosis primitives", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const result = buildReportWowSummaryViewModel(makePresentation(), makeArtifactModel());

  assert.equal(result.momentum.revenueTrend, "unknown");
  assert.equal(result.momentum.subscriberTrend, "unknown");
  assert.equal(typeof result.momentum.summaryText, "string");
  assert.equal(result.momentum.summaryText.length > 0, true);
});

test("recommended actions renders from recommendations", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const pres = makePresentation({
    recommendations: [
      { id: "r1", label: "Action 1", body: "Add a stronger paid CTA from YouTube to Patreon", detail: null, stateLabel: null, stateTone: null },
      { id: "r2", label: "Action 2", body: "Re-engage dormant Substack readers with a paid offer", detail: null, stateLabel: null, stateTone: null },
      { id: "r3", label: "Action 3", body: "Reduce overreliance on a single revenue source", detail: null, stateLabel: null, stateTone: null },
      { id: "r4", label: "Action 4", body: "This fourth action should not appear", detail: null, stateLabel: null, stateTone: null },
    ],
  });
  const result = buildReportWowSummaryViewModel(pres, makeArtifactModel());

  assert.equal(result.nextActions.length, 3);
  assert.equal(result.nextActions[0].title.includes("YouTube"), true);
  assert.equal(result.nextActions[1].title.includes("Substack"), true);
  assert.equal(result.nextActions[2].title.includes("overreliance"), true);
  // Fourth action must not appear
  assert.equal(result.nextActions.some((a) => a.title.includes("fourth action")), false);
});

test("recommended actions returns empty array when no recommendations", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const result = buildReportWowSummaryViewModel(makePresentation(), makeArtifactModel());

  assert.equal(Array.isArray(result.nextActions), true);
  assert.equal(result.nextActions.length, 0);
});

test("wow summary suppresses prior-period growth detail when continuity signals are disabled", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const pres = makePresentation({
    diagnosis: {
      diagnosisTypeLabel: null,
      summary: null,
      notice: null,
      supportingMetrics: [],
      primitives: [{ label: "Subscriber trend", value: "Growing" }],
      unavailableBody: null,
    },
  });
  const artifactModel = makeArtifactModel({
    whatChanged: {
      deltas: {
        active_subscribers: {
          percentDelta: 12,
          direction: "up",
        },
      },
    },
  });

  const result = buildReportWowSummaryViewModel(pres, artifactModel, null, { includeContinuitySignals: false });

  assert.equal(result.kpiCards[2].value, "Growing");
  assert.equal(result.kpiCards[2].detail, "subscriber trend");
});

test("strengths uses improved items from whatChanged when comparison is available", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const pres = makePresentation({
    whatChanged: {
      comparisonAvailable: true,
      priorPeriodLabel: "Prior period",
      notice: null,
      improved: [
        { id: "i1", body: "Revenue stability improved month-over-month.", detail: null, stateLabel: "Improved", stateTone: "good" },
        { id: "i2", body: "Active subscribers grew by 8%.", detail: null, stateLabel: "Improved", stateTone: "good" },
      ],
      worsened: [
        { id: "w1", body: "Platform concentration increased.", detail: null, stateLabel: "Risk", stateTone: "warn" },
      ],
      watchNext: [],
      unavailableBody: null,
    },
  });
  const result = buildReportWowSummaryViewModel(pres, makeArtifactModel());

  assert.equal(result.strengthsRisks.available, true);
  assert.equal(result.strengthsRisks.strengths.length, 2);
  assert.equal(result.strengthsRisks.strengths[0].text.includes("stability"), true);
  assert.equal(result.strengthsRisks.risks.length, 1);
  assert.equal(result.strengthsRisks.risks[0].text.includes("concentration"), true);
});

test("wow summary falls back to snapshot strengths and risks when continuity signals are disabled", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const pres = makePresentation({
    whatChanged: {
      comparisonAvailable: true,
      priorPeriodLabel: "Prior period",
      notice: null,
      improved: [{ id: "i1", body: "Revenue stability improved month-over-month.", detail: null, stateLabel: "Improved", stateTone: "good" }],
      worsened: [{ id: "w1", body: "Platform concentration increased.", detail: null, stateLabel: "Risk", stateTone: "warn" }],
      watchNext: [],
      unavailableBody: null,
    },
  });
  const artifactModel = makeArtifactModel({
    diagnosis: {
      diagnosisType: "concentration_pressure",
      summaryText: null,
      supportingMetrics: [],
      primitives: {
        revenueTrendDirection: "up",
        activeSubscribersDirection: "up",
        churnPressureLevel: "low",
        concentrationPressureLevel: "high",
        monetizationEfficiencyLevel: "medium",
        stabilityDirection: "up",
        evidenceStrength: "moderate",
        dataQualityLevel: null,
        analysisMode: null,
      },
      availability: "available",
      confidence: "medium",
      confidenceAdjusted: false,
      evidenceStrength: "moderate",
      insufficientReason: null,
      reasonCodes: [],
      dataQualityLevel: null,
      analysisMode: null,
      recommendationMode: null,
    },
  });

  const result = buildReportWowSummaryViewModel(pres, artifactModel, null, { includeContinuitySignals: false });

  assert.equal(result.strengthsRisks.strengths.some((item) => item.text.includes("month-over-month")), false);
  assert.equal(result.strengthsRisks.strengths.some((item) => item.text.toLowerCase().includes("revenue")), true);
  assert.equal(result.strengthsRisks.risks.some((item) => item.text.toLowerCase().includes("concentration")), true);
});

test("strengths derives from diagnosis primitives when no comparison available", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const artifactModel = makeArtifactModel({
    diagnosis: {
      diagnosisType: "concentration_pressure",
      summaryText: null,
      supportingMetrics: [],
      primitives: {
        revenueTrendDirection: "up",
        activeSubscribersDirection: "up",
        churnPressureLevel: "low",
        concentrationPressureLevel: "high",
        monetizationEfficiencyLevel: "medium",
        stabilityDirection: "up",
        evidenceStrength: "moderate",
        dataQualityLevel: null,
        analysisMode: null,
      },
      availability: "available",
      confidence: "medium",
      confidenceAdjusted: false,
      evidenceStrength: "moderate",
      insufficientReason: null,
      reasonCodes: [],
      dataQualityLevel: null,
      analysisMode: null,
      recommendationMode: null,
    },
  });
  const result = buildReportWowSummaryViewModel(makePresentation(), artifactModel);

  // Revenue and subscribers both up → two strengths
  assert.equal(result.strengthsRisks.strengths.some((s) => s.text.toLowerCase().includes("revenue")), true);
  assert.equal(result.strengthsRisks.strengths.some((s) => s.text.toLowerCase().includes("subscriber")), true);
  // High concentration → risk present
  assert.equal(result.strengthsRisks.risks.some((r) => r.text.toLowerCase().includes("concentration")), true);
});

test("report renders gracefully with fully null/empty artifact model", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const result = buildReportWowSummaryViewModel(makePresentation(), null);

  assert.equal(result.kpiCards.length, 4);
  assert.equal(typeof result.opportunity.finding, "string");
  assert.equal(typeof result.momentum.summaryText, "string");
  assert.equal(typeof result.platformMix.interpretationText, "string");
  assert.equal(Array.isArray(result.strengthsRisks.strengths), true);
  assert.equal(Array.isArray(result.strengthsRisks.risks), true);
  assert.equal(Array.isArray(result.nextActions), true);
});

test("summary sentence prefers substantive executive summary over null", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const pres = makePresentation({
    executiveSummary: ["Your creator business grew this period, driven mainly by Patreon subscriber growth and improved retention."],
  });
  const result = buildReportWowSummaryViewModel(pres, makeArtifactModel());

  assert.equal(result.summarySentence?.includes("creator business grew"), true);
});

test("summary sentence returns null when only generic placeholder text is available", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const pres = makePresentation({
    executiveSummary: ["Summary details are limited for this report."],
  });
  const result = buildReportWowSummaryViewModel(pres, makeArtifactModel());

  assert.equal(result.summarySentence, null);
});

test("coverage metadata flows through to the wow summary model", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const result = buildReportWowSummaryViewModel(
    makePresentation(),
    makeArtifactModel(),
    {
      snapshotCoverageNote: "Based on Patreon Jan-Mar and Instagram Feb-Mar snapshots.",
      reportHasBusinessMetrics: false,
      sectionStrength: [
        {
          id: "subscriber_health",
          label: "Subscriber health",
          level: "weak",
          reason: "Missing direct subscription data in this snapshot.",
        },
      ],
    },
  );

  assert.equal(result.coverage.snapshotCoverageNote, "Based on Patreon Jan-Mar and Instagram Feb-Mar snapshots.");
  assert.equal(result.coverage.reportHasBusinessMetrics, false);
  assert.deepEqual(result.coverage.sectionStrength, [
    {
      id: "subscriber_health",
      label: "Subscriber health",
      level: "weak",
      reason: "Missing direct subscription data in this snapshot.",
    },
  ]);
});
