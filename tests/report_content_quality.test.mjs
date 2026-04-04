import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const wowViewModelUrl = pathToFileURL(path.resolve("src/lib/report/wow-summary-view-model.ts")).href;
const wowComponentPath = path.resolve("app/(app)/app/report/[id]/_components/ReportWowSummary.tsx");
const reportPagePath = path.resolve("app/(app)/app/report/[id]/page.tsx");
const detailPresentationPath = path.resolve("src/lib/report/detail-presentation.ts");

const BANNED_LITERAL_PHRASES = [
  "churn_not_primary",
  "acquisition_pressure_primary",
  "mixed pressure",
  "mixed_pressure",
  "coverage is grounded in",
  "analysis coverage",
  "technical report details",
  "quality flag",
];

function makePresentation(overrides = {}) {
  return {
    heroTitle: "Creator Report",
    heroSubtitle: null,
    heroNotice: null,
    executiveSummary: [],
    heroMetrics: [],
    signals: [],
    keySignals: [],
    revenueTrend: { points: [], narrative: null },
    subscriberHealth: { notice: null, metrics: [], highlights: [] },
    platformMix: {
      notice: null,
      concentrationScore: 100,
      platformsConnected: 1,
      highlights: ["100% of revenue comes from Substack."],
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
    displayContext: {
      snapshotLabel: "Apr 2026",
      historyLabel: "Jan-Apr 2026",
      businessFramingNote: null,
    },
    audienceGrowth: null,
    ...overrides,
  };
}

function makeArtifactModel(overrides = {}) {
  return {
    reportId: "rep_test_001",
    schemaVersion: "v1",
    createdAt: "2026-04-01T10:00:00Z",
    analysisMode: null,
    dataQualityLevel: null,
    executiveSummaryParagraphs: [],
    kpis: { netRevenue: 3084, subscribers: 305, stabilityIndex: 36, churnVelocity: null },
    sections: [],
    diagnosis: {
      diagnosisType: "concentration_pressure",
      summaryText: "Revenue is highly concentrated in a single platform.",
      primitives: {
        revenueTrendDirection: "down",
        activeSubscribersDirection: "flat",
        churnPressureLevel: "low",
        concentrationPressureLevel: "high",
        monetizationEfficiencyLevel: "medium",
        stabilityDirection: "down",
      },
    },
    whatChanged: null,
    metricSnapshot: null,
    metricProvenance: {},
    signals: [],
    recommendations: [],
    outlook: null,
    stability: null,
    audienceGrowthSignals: null,
    ...overrides,
  };
}

test("creator-facing report sources do not contain banned internal phrases", async () => {
  const wowSource = await readFile(path.resolve("src/lib/report/wow-summary-view-model.ts"), "utf8");
  const componentSource = await readFile(wowComponentPath, "utf8");
  const pageSource = await readFile(reportPagePath, "utf8");

  for (const phrase of BANNED_LITERAL_PHRASES) {
    assert.equal(wowSource.toLowerCase().includes(phrase.toLowerCase()), false, `Found banned phrase in wow summary view-model: ${phrase}`);
    assert.equal(componentSource.toLowerCase().includes(phrase.toLowerCase()), false, `Found banned phrase in wow summary component: ${phrase}`);
    assert.equal(pageSource.toLowerCase().includes(phrase.toLowerCase()), false, `Found banned phrase in report page: ${phrase}`);
  }
});

test("detail-presentation still caps executive summary blocks at three", async () => {
  const source = await readFile(detailPresentationPath, "utf8");
  const execSummaryFn = source.slice(source.indexOf("function buildExecutiveSummary"), source.indexOf("function buildReportTruthSummary"));

  assert.equal(execSummaryFn.includes(".slice(0, 3)"), true);
});

test("opportunity copy stays creator-friendly and action-led", async () => {
  const { buildReportWowSummaryViewModel } = await import(wowViewModelUrl);
  const result = buildReportWowSummaryViewModel(makePresentation(), makeArtifactModel());
  const allCopy = [result.opportunity.finding, result.opportunity.upsideLabel ?? "", result.opportunity.action].join(" ").toLowerCase();

  assert.equal(allCopy.includes("diversif"), false);
  assert.equal(allCopy.includes("severity"), false);
  assert.equal(allCopy.includes("confidence"), false);
  assert.equal(result.opportunity.finding.includes("Start"), true);
});

test("next actions are reduced to a focused primary and secondary move", async () => {
  const { buildReportWowSummaryViewModel } = await import(wowViewModelUrl);
  const result = buildReportWowSummaryViewModel(makePresentation(), makeArtifactModel());

  assert.equal(result.nextActions.length, 2);
  assert.equal(result.nextActions.every((action) => typeof action.title === "string" && action.title.length > 0), true);
  assert.equal(result.nextActions.every((action) => action.timeframe !== null), true);
});

test("concentration risk does not appear in both strengths/risks and biggest risk", async () => {
  const { buildReportWowSummaryViewModel } = await import(wowViewModelUrl);
  const result = buildReportWowSummaryViewModel(makePresentation(), makeArtifactModel());
  const riskTexts = result.strengthsRisks.risks.map((risk) => risk.text.toLowerCase());
  const hasConcentrationInRisks = riskTexts.some((text) => text.includes("concentration") || text.includes("single platform"));

  assert.equal(result.biggestRisk.available, true);
  assert.equal(hasConcentrationInRisks, false);
});

test("creator-facing page no longer renders supporting detail or old recommendations labels", async () => {
  const source = await readFile(reportPagePath, "utf8");

  assert.equal(source.includes("Supporting Detail"), false);
  assert.equal(source.includes("Recommended Actions"), false);
  assert.equal(source.includes("What to do next"), true);
});
