import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/report/wow-summary-view-model.ts")).href;

async function loadModule() {
  return import(moduleUrl);
}

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
      metrics: [{ id: "subscribers", label: "Subscribers", value: "1,240", detail: null, stateLabel: null, stateTone: null }],
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

test("kpi cards read from the presentation metrics", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const result = buildReportWowSummaryViewModel(makePresentation(), makeArtifactModel());

  assert.equal(result.kpiCards[0].value, "$12,400");
  assert.equal(result.kpiCards[1].value, "1,240");
  assert.equal(result.kpiCards[3].value.includes("Patreon"), true);
});

test("biggest opportunity becomes creator-friendly for concentration pressure", async () => {
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
      },
    },
  });
  const result = buildReportWowSummaryViewModel(makePresentation(), artifactModel);

  assert.equal(result.opportunity.available, true);
  assert.equal(result.opportunity.finding.includes("Start building"), true);
  assert.equal(result.opportunity.action.toLowerCase().includes("owned channel"), true);
});

test("biggest opportunity stays creator-friendly for churn pressure", async () => {
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
      },
    },
  });
  const result = buildReportWowSummaryViewModel(makePresentation(), artifactModel);

  assert.equal(result.opportunity.available, true);
  assert.equal(result.opportunity.finding.toLowerCase().includes("stay"), true);
  assert.equal(result.opportunity.action.toLowerCase().includes("next 2 weeks"), true);
});

test("platform mix copy becomes a clear income risk statement", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const highConc = makePresentation({ platformMix: { notice: null, concentrationScore: 82, platformsConnected: 1, highlights: ["82% Patreon"] } });
  const result = buildReportWowSummaryViewModel(highConc, makeArtifactModel());

  assert.equal(result.platformMix.interpretationText, "Your income is currently dependent on one platform.");
  assert.equal(result.platformMix.highlights[0].toLowerCase().includes("most of the business"), true);
});

test("platform mix falls back gracefully when concentration data is unavailable", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const presentation = makePresentation({
    platformMix: { notice: null, concentrationScore: null, platformsConnected: null, highlights: [] },
  });
  const result = buildReportWowSummaryViewModel(presentation, makeArtifactModel());

  assert.equal(result.platformMix.available, false);
  assert.equal(result.platformMix.interpretationText.toLowerCase().includes("forming"), true);
});

test("momentum produces a short headline and implication", async () => {
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
      },
    },
  });
  const result = buildReportWowSummaryViewModel(makePresentation(), artifactModel);

  assert.equal(result.momentum.revenueTrend, "up");
  assert.equal(result.momentum.subscriberTrend, "flat");
  assert.equal(result.momentum.headline.includes("uneven"), true);
  assert.equal(result.momentum.summaryText.length > 0, true);
});

test("next actions reduce to a focused primary and secondary card", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const presentation = makePresentation({
    recommendations: [
      { id: "r1", label: "Action 1", body: "Add a stronger paid CTA from YouTube to Patreon", detail: null, stateLabel: null, stateTone: null },
      { id: "r2", label: "Action 2", body: "Re-engage dormant Substack readers with a paid offer", detail: null, stateLabel: null, stateTone: null },
      { id: "r3", label: "Action 3", body: "This third action should not appear", detail: null, stateLabel: null, stateTone: null },
    ],
  });
  const result = buildReportWowSummaryViewModel(presentation, makeArtifactModel());

  assert.equal(result.nextActions.length, 2);
  assert.equal(result.nextActions[0].title.includes("YouTube"), true);
  assert.equal(result.nextActions[1].title.includes("Substack"), true);
  assert.equal(result.nextActions.every((action) => action.timeframe !== null), true);
});

test("coverage metadata and kpi context flow through to the wow summary model", async () => {
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
  assert.equal(result.kpiContext?.toLowerCase().includes("latest business read"), true);
});

test("summary sentence prefers substantive executive summary copy", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const presentation = makePresentation({
    executiveSummary: ["Your creator business grew this period, driven mainly by Patreon subscriber growth and improved retention."],
  });
  const result = buildReportWowSummaryViewModel(presentation, makeArtifactModel());

  assert.equal(result.summarySentence?.includes("creator business grew"), true);
});

test("summary sentence still returns a fallback line when generic summary text is all that exists", async () => {
  const { buildReportWowSummaryViewModel } = await loadModule();
  const presentation = makePresentation({
    executiveSummary: ["Summary details are limited for this report."],
  });
  const result = buildReportWowSummaryViewModel(presentation, makeArtifactModel());

  assert.equal(typeof result.summarySentence, "string");
  assert.equal(result.summarySentence.length > 0, true);
});
