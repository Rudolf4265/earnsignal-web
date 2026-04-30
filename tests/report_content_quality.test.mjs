import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const wowViewModelUrl = pathToFileURL(path.resolve("src/lib/report/wow-summary-view-model.ts")).href;
const detailPresentationUrl = pathToFileURL(path.resolve("src/lib/report/detail-presentation.ts")).href;
const premiumNarrativeUrl = pathToFileURL(path.resolve("src/lib/report/premium-narrative.ts")).href;
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

const BANNED_VISIBLE_REPORT_PHRASES = [
  "report read",
  "this chapter",
  "current artifact",
  "operating summary",
  "single statement should carry",
];

function stripComments(source) {
  return source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

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

function makeReportDetail(overrides = {}) {
  return {
    id: "rep_test_001",
    title: "Creator Report",
    status: "complete",
    summary: "Revenue is still concentrated in one place.",
    createdAt: "2026-04-01T10:00:00Z",
    updatedAt: "2026-04-01T10:00:00Z",
    artifactUrl: "/artifact.json",
    pdfUrl: "/artifact.pdf",
    artifactJsonUrl: "/artifact.json",
    keySignals: [],
    recommendedActions: [],
    diagnosis: null,
    whatChanged: null,
    platformsIncluded: ["Patreon", "Substack", "YouTube"],
    sourceCount: 3,
    reportKind: "combined",
    snapshotWindowMode: null,
    snapshotCoverageNote: null,
    youtubeContributionMode: null,
    monthsPresent: null,
    reportHasBusinessMetrics: true,
    sectionStrength: [],
    metrics: {
      netRevenue: 3084,
      subscribers: 305,
      stabilityIndex: 36,
      churnVelocity: null,
      coverageMonths: 3,
      platformsConnected: 3,
    },
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

test("visible report copy removes stale report-meta phrases", async () => {
  const pageSource = stripComments(await readFile(reportPagePath, "utf8")).toLowerCase();

  for (const phrase of BANNED_VISIBLE_REPORT_PHRASES) {
    assert.equal(pageSource.includes(phrase), false, `Found stale visible phrase in report page: ${phrase}`);
  }
});

test("report page trims repeated coverage caveat copy when a hero coverage notice is present", async () => {
  const source = await readFile(reportPagePath, "utf8");

  assert.equal(source.includes("function isCoverageCaveatLine"), true);
  assert.equal(source.includes("const hasCoverageNotice = Boolean"), true);
  assert.equal(source.includes("filtered = lines.filter((line) => !isCoverageCaveatLine(line))"), true);
  assert.equal(source.includes("rationale: hasCoverageNotice && isCoverageCaveatLine(recommendation.detail) ? null : recommendation.detail"), true);
});

test("audience growth only keeps rows for report sources that were actually included", async () => {
  const { buildReportDetailPresentationModel } = await import(detailPresentationUrl);

  const presentation = buildReportDetailPresentationModel({
    report: makeReportDetail({
      platformsIncluded: ["Patreon", "Substack", "YouTube"],
      sourceCount: 3,
    }),
    artifactModel: makeArtifactModel({
      diagnosis: null,
      audienceGrowthSignals: {
        title: "Audience signals",
        subtitle: "Based on your available Instagram, TikTok, and YouTube audience data.",
        summary: {
          creatorScore: 72,
          sourceCoverage: 67,
          audienceMomentum: 61,
          engagementSignal: 59,
        },
        includedSources: [
          { platform: "youtube", label: "YouTube", included: true, latestPeriodLabel: "Apr 2026", dataType: "audience_and_content" },
          { platform: "instagram", label: "Instagram", included: true, latestPeriodLabel: "Apr 2026", dataType: "audience" },
          { platform: "tiktok", label: "TikTok", included: true, latestPeriodLabel: "Apr 2026", dataType: "audience" },
        ],
        platformCards: [
          {
            platform: "youtube",
            label: "YouTube",
            included: true,
            metrics: [{ id: "subscribers_trend", label: "Subscribers trend", value: "Stable" }],
            insight: "YouTube is contributing useful audience context.",
          },
          {
            platform: "instagram",
            label: "Instagram",
            included: true,
            metrics: [{ id: "followers_trend", label: "Followers trend", value: "Up" }],
            insight: "Instagram is climbing fastest.",
          },
          {
            platform: "tiktok",
            label: "TikTok",
            included: true,
            metrics: [{ id: "followers_trend", label: "Followers trend", value: "Up" }],
            insight: "TikTok is climbing fastest.",
          },
        ],
        diagnosis: {
          strongestSignal: "TikTok is the strongest audience signal in this upload.",
          watchout: null,
          nextBestMove: null,
        },
        trustNote: null,
      },
    }),
    artifactSignals: null,
  });

  assert.deepEqual(
    presentation.audienceGrowth?.includedSources.map((source) => source.label),
    ["YouTube"],
  );
  assert.deepEqual(
    presentation.audienceGrowth?.platformCards.map((card) => card.label),
    ["YouTube"],
  );
  assert.equal(presentation.audienceGrowth?.diagnosis, null);
});

test("premium narrative polish removes fake precision and robotic revenue phrasing", async () => {
  const { polishReportSentence } = await import(premiumNarrativeUrl);
  const polished = polishReportSentence("Current net revenue is $8344.00, with a month-over-month change of 0.68%.");

  assert.equal(polished, "Revenue is holding steady this cycle, up 0.7% month over month to $8,344.");
  assert.equal(polished?.includes(".00"), false);
  assert.equal(polished?.includes("Current net revenue is"), false);
});

test("report page source avoids artifact fallback language in main customer-facing sections", async () => {
  const source = await readFile(reportPagePath, "utf8");

  assert.equal(source.includes("Tier-level detail is not present in this artifact."), false);
  assert.equal(source.includes("Trend chart data is not available in this report artifact."), false);
  assert.equal(source.includes("stays grounded in the artifact"), false);
  assert.equal(source.includes("Artifact JSON Unavailable"), false);
  assert.equal(source.includes("Artifact JSON unavailable"), false);
  assert.equal(source.includes("JSON artifact yet"), false);
});

test("reports index source uses creator-facing report data language", async () => {
  const source = await readFile(path.resolve("app/(app)/app/report/page.tsx"), "utf8");

  assert.equal(source.includes("access report artifacts"), false);
  assert.equal(source.includes("access report data"), true);
});
