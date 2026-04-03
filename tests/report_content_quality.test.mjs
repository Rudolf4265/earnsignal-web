/**
 * Content quality guard tests.
 *
 * Ensures:
 * - No banned system/internal phrases appear in user-facing surfaces
 * - No duplicate themes (concentration, revenue decline) across WowSummary sections
 * - Executive summary is capped at 3 blocks
 * - Coverage panel is suppressed (removed from WowSummary)
 * - Opportunity language includes timeframes and concrete actions
 */

import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const wowViewModelUrl = pathToFileURL(path.resolve("src/lib/report/wow-summary-view-model.ts")).href;
const detailPresentationUrl = pathToFileURL(path.resolve("src/lib/report/detail-presentation.ts")).href;
const wowComponentPath = path.resolve("app/(app)/app/report/[id]/_components/ReportWowSummary.tsx");

// ── Banned phrase lists ───────────────────────────────────────────────────────

const BANNED_LITERAL_PHRASES = [
  "churn_not_primary",
  "acquisition_pressure_primary",
  "mixed pressure",
  "mixed_pressure",
  "coverage is grounded in",
  "analysis coverage",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

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
      historyLabel: "Jan–Apr 2026",
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

// ── Tests ─────────────────────────────────────────────────────────────────────

test("wow-summary-view-model source does not contain banned internal phrases as literal strings", async () => {
  const source = await readFile(path.resolve("src/lib/report/wow-summary-view-model.ts"), "utf8");

  for (const phrase of BANNED_LITERAL_PHRASES) {
    assert.equal(
      source.toLowerCase().includes(phrase.toLowerCase()),
      false,
      `Banned phrase found in wow-summary-view-model.ts: "${phrase}"`,
    );
  }
});

test("ReportWowSummary component source does not contain banned internal phrases", async () => {
  const source = await readFile(wowComponentPath, "utf8");

  for (const phrase of BANNED_LITERAL_PHRASES) {
    assert.equal(
      source.toLowerCase().includes(phrase.toLowerCase()),
      false,
      `Banned phrase found in ReportWowSummary.tsx: "${phrase}"`,
    );
  }
});

test("ReportWowSummary component does not render a Coverage panel", async () => {
  const source = await readFile(wowComponentPath, "utf8");

  assert.equal(
    source.includes('data-testid="wow-coverage-trust"'),
    false,
    "Coverage trust panel should be removed from WowSummary",
  );
  assert.equal(
    source.includes("CoverageTrustPanel"),
    false,
    "CoverageTrustPanel component should not exist in WowSummary",
  );
});

test("ReportWowSummary component renders a BiggestRisk card", async () => {
  const source = await readFile(wowComponentPath, "utf8");

  assert.equal(source.includes('data-testid="wow-biggest-risk"'), true, "BiggestRiskCard should exist");
  assert.equal(source.includes("BiggestRiskCard"), true, "BiggestRiskCard component should be present");
});

test("buildReportWowSummaryViewModel includes biggestRisk field", async () => {
  const { buildReportWowSummaryViewModel } = await import(wowViewModelUrl);
  const result = buildReportWowSummaryViewModel(makePresentation(), makeArtifactModel());

  assert.ok("biggestRisk" in result, "biggestRisk field must exist on view model");
  assert.ok(typeof result.biggestRisk.available === "boolean", "biggestRisk.available must be a boolean");
});

test("buildReportWowSummaryViewModel surfaces biggest risk for 100% concentration", async () => {
  const { buildReportWowSummaryViewModel } = await import(wowViewModelUrl);
  const result = buildReportWowSummaryViewModel(makePresentation(), makeArtifactModel());

  assert.equal(result.biggestRisk.available, true, "biggestRisk should be available for 100% concentration");
  assert.ok(result.biggestRisk.headline.length > 0, "biggestRisk.headline should be non-empty");
  assert.ok(result.biggestRisk.body.length > 0, "biggestRisk.body should be non-empty");
});

test("opportunity action includes timeframe language for concentration_pressure diagnosis", async () => {
  const { buildReportWowSummaryViewModel } = await import(wowViewModelUrl);
  const result = buildReportWowSummaryViewModel(makePresentation(), makeArtifactModel());

  const action = result.opportunity.action.toLowerCase();
  const hasTimeframe = action.includes("within") || action.includes("this month") || action.includes("next");
  assert.equal(hasTimeframe, true, `Opportunity action must include a timeframe. Got: "${result.opportunity.action}"`);
});

test("opportunity copy does not contain 'diversify' without context", async () => {
  const { buildReportWowSummaryViewModel } = await import(wowViewModelUrl);

  const diagnosisTypes = ["concentration_pressure", "churn_pressure", "monetization_pressure", "acquisition_pressure"];

  for (const diagnosisType of diagnosisTypes) {
    const result = buildReportWowSummaryViewModel(
      makePresentation(),
      makeArtifactModel({ diagnosis: { diagnosisType, summaryText: null, primitives: null } }),
    );

    const allCopy = [result.opportunity.finding, result.opportunity.upsideLabel ?? "", result.opportunity.action].join(" ").toLowerCase();
    assert.equal(
      allCopy.includes("diversif"),
      false,
      `Opportunity copy for ${diagnosisType} must not contain 'diversify'. Got: "${allCopy}"`,
    );
  }
});

test("executive summary is capped at 3 blocks in detail-presentation source", async () => {
  // Verify the cap is enforced in source code without loading the full module graph
  const source = await readFile(path.resolve("src/lib/report/detail-presentation.ts"), "utf8");
  // buildExecutiveSummary must slice to ≤ 3
  assert.ok(
    source.includes(".slice(0, 3)"),
    "detail-presentation.ts must slice executive summary to max 3 items",
  );
  // The cap must be applied to the return value (not some unrelated array)
  const execSummaryFn = source.slice(source.indexOf("function buildExecutiveSummary"), source.indexOf("function buildReportTruthSummary"));
  assert.ok(execSummaryFn.includes(".slice(0, 3)"), "buildExecutiveSummary must slice its output to 3");
});

test("concentration risk does not appear in both StrengthsRisks and BiggestRisk simultaneously", async () => {
  const { buildReportWowSummaryViewModel } = await import(wowViewModelUrl);
  const result = buildReportWowSummaryViewModel(makePresentation(), makeArtifactModel());

  const riskTexts = result.strengthsRisks.risks.map((r) => r.text.toLowerCase());
  const hasConcentrationInRisks = riskTexts.some((t) => t.includes("concentration") || t.includes("single platform") || t.includes("concentration_high"));

  // If BiggestRisk is showing concentration, it must NOT also appear in StrengthsRisks
  if (result.biggestRisk.available && result.biggestRisk.headline.toLowerCase().includes("concentrat")) {
    assert.equal(
      hasConcentrationInRisks,
      false,
      "Concentration risk must not appear in both BiggestRisk and StrengthsRisks — this creates duplication",
    );
  }
});
