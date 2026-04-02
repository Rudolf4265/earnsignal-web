import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const hydrationModuleUrl = pathToFileURL(path.resolve("src/lib/dashboard/artifact-hydration.ts")).href;
const adapterModuleUrl = pathToFileURL(path.resolve("src/lib/dashboard/grow-adapter.ts")).href;
const modelModuleUrl = pathToFileURL(path.resolve("src/lib/dashboard/grow-model.ts")).href;

async function loadModules(seed = Date.now()) {
  const [hydration, adapter, model] = await Promise.all([
    import(`${hydrationModuleUrl}?t=${seed}`),
    import(`${adapterModuleUrl}?t=${seed}`),
    import(`${modelModuleUrl}?t=${seed}`),
  ]);

  return { ...hydration, ...adapter, ...model };
}

function createReportDetail(overrides = {}) {
  return {
    id: "rep_grow_001",
    title: "Growth Report",
    status: "ready",
    summary: "Audience momentum is improving.",
    createdAt: "2026-03-10T12:00:00Z",
    updatedAt: "2026-03-11T09:30:00Z",
    artifactUrl: null,
    pdfUrl: null,
    artifactJsonUrl: null,
    keySignals: [],
    recommendedActions: [],
    diagnosis: null,
    whatChanged: null,
    metrics: {
      netRevenue: 12000,
      subscribers: 400,
      stabilityIndex: 84,
      churnVelocity: null,
      coverageMonths: 6,
      platformsConnected: 2,
    },
    ...overrides,
  };
}

function createGrowthArtifact() {
  return {
    report: {
      report_id: "rep_grow_001",
      created_at: "2026-03-10T12:00:00Z",
      sections: {
        executive_summary: {
          summary: "Audience momentum is improving across short-form content.",
        },
        plan: {
          bullets: ["Post Tue-Thu 11 AM to 1 PM when your short-form audience is most active."],
        },
        prioritized_insights: [
          {
            id: "sig_1",
            title: "Reels engagement is compounding",
            description: "Short-form reach is growing week over week.",
            confidence: "high",
            evidence_strength: "strong",
          },
        ],
        ranked_recommendations: [
          {
            id: "rec_1",
            title: "Double down on short-form posts",
            description: "Publish two extra reels in the best-performing format.",
            expected_impact: "Increase top-of-funnel reach",
            recommendation_mode: "action",
            confidence: "high",
            evidence_strength: "strong",
            supporting_context_reason_codes: ["growth_signal"],
          },
          {
            id: "rec_2",
            title: "Protect the highest-retention cohorts",
            description: "Follow up with the audience segment already returning most often.",
            expected_impact: "Lift repeat engagement",
            recommendation_mode: "action",
            confidence: "medium",
            evidence_strength: "moderate",
          },
          {
            id: "rec_3",
            title: "Test a creator collaboration slot",
            description: "Use a collaboration slot to widen qualified reach.",
            expected_impact: "Broaden discovery",
            recommendation_mode: "watch",
            confidence: "medium",
            evidence_strength: "moderate",
          },
        ],
      },
      diagnosis: {
        diagnosis_type: "acquisition_pressure",
        summary_text: "Acquisition is the current growth constraint in the latest report evidence.",
        supporting_metrics: [
          {
            metric: "creator_score",
            current_value: 84,
            prior_value: 80,
            direction: "up",
            source: "observed",
            availability: "available",
            confidence: "high",
            evidence_strength: "strong",
          },
          {
            metric: "engagement_rate",
            current_value: 0.089,
            prior_value: 0.073,
            direction: "up",
            source: "observed",
            availability: "available",
            confidence: "high",
            evidence_strength: "strong",
          },
          {
            metric: "audience_value_score",
            current_value: 72,
            prior_value: 68,
            direction: "up",
            source: "observed",
            availability: "available",
            confidence: "high",
            evidence_strength: "strong",
          },
        ],
      },
      what_changed: {
        comparison_available: true,
        deltas: {
          followers: {
            metric: "followers",
            current_value: 1000,
            prior_value: 932,
            percent_delta: 0.072,
            direction: "up",
            comparable: true,
            confidence: "high",
            evidence_strength: "strong",
          },
        },
      },
    },
  };
}

function createRevenueContaminatedArtifact() {
  return {
    report: {
      report_id: "rep_grow_002",
      created_at: "2026-03-10T12:00:00Z",
      sections: {
        executive_summary: {
          summary: "Audience reach is mixed and still early.",
        },
        ranked_recommendations: [
          {
            id: "rec_1",
            title: "Improve discovery hooks",
            description: "Refresh the opening seconds of short-form content to earn more repeat views.",
            expected_impact: "Strengthen audience discovery",
            recommendation_mode: "action",
            confidence: "medium",
            evidence_strength: "moderate",
            supporting_context_reason_codes: ["growth_signal"],
          },
        ],
      },
      what_changed: {
        comparison_available: true,
        deltas: {
          latest_net_revenue: {
            metric: "latest_net_revenue",
            current_value: 12000,
            prior_value: 9000,
            percent_delta: 0.333,
            direction: "up",
            comparable: true,
            confidence: "high",
            evidence_strength: "strong",
          },
        },
      },
    },
  };
}

test("grow dashboard adapter only maps quantitative values from growth-native signals", async () => {
  const { hydrateDashboardFromArtifact, adaptGrowDashboardSource } = await loadModules(Date.now() + 1);

  const latestArtifact = hydrateDashboardFromArtifact(createGrowthArtifact());
  const latestReport = createReportDetail();
  const result = adaptGrowDashboardSource({
    latestArtifact,
    latestReport,
    latestUpload: null,
    growthReport: null,
  });

  assert.equal(result?.hasStructuredGrowthEvidence, true);
  assert.equal(result?.creatorScore, 84);
  assert.equal(result?.growthVelocityPercent, 7.2);
  assert.equal(result?.engagementRate, 8.9);
  assert.equal(result?.audienceValueScore, 72);
  assert.equal(result?.bestPostingWindow?.primaryWindow, "Tue-Thu 11 AM to 1 PM");
  assert.equal(result?.topOpportunity?.title, "Double down on short-form posts");
  assert.equal(result?.nextActions.length, 3);
  assert.equal(result?.diagnosisSummary?.includes("growth constraint"), true);
});

test("grow dashboard builder maps structured growth data without revenue framing", async () => {
  const { buildGrowDashboardModel } = await loadModules(Date.now() + 2);

  const result = buildGrowDashboardModel({
    hasStructuredGrowthEvidence: true,
    creatorScore: 84,
    growthVelocityPercent: 7.2,
    engagementRate: 8.9,
    audienceValueScore: 72,
    diagnosisSummary: "Acquisition is the current growth constraint in the latest report evidence.",
    trendSummary: "Audience momentum is improving across short-form content.",
    bestPostingWindow: {
      primaryWindow: "Tue-Thu 11 AM to 1 PM",
      secondaryWindow: "Sun 6 PM to 8 PM",
      rationale: "Recent engagement spikes cluster around late-morning midweek posts.",
    },
    topOpportunity: {
      title: "Double down on short-form posts",
      summary: "Publish two extra reels in the best-performing format.",
      estimatedImpact: "Increase top-of-funnel reach",
    },
    nextActions: [
      { title: "Double down on short-form posts", impact: "Increase top-of-funnel reach" },
      { title: "Protect the highest-retention cohorts", impact: "Lift repeat engagement" },
      { title: "Test a creator collaboration slot", impact: "Broaden discovery" },
      { title: "Ignore this extra action", impact: "Should be trimmed" },
    ],
    sourceUpdatedAt: "2026-03-11T09:30:00Z",
  });

  assert.equal(result.availability, "structured");
  assert.equal(result.creatorScore?.score, 84);
  assert.equal(result.growthHealth?.value, "Healthy");
  assert.equal(result.growthHealth?.tone, "positive");
  assert.equal(result.growthVelocity?.weeklyGrowthRate, 7.2);
  assert.equal(result.audienceValue?.score, 72);
  assert.equal(result.audienceValue?.label.includes("$"), false);
  assert.equal(result.bestPostingWindow?.primaryWindow, "Tue-Thu 11 AM to 1 PM");
  assert.equal(result.topOpportunity?.title, "Double down on short-form posts");
  assert.equal(result.nextActions.length, 3);
  assert.equal(result.latestGrowthSummary?.body.includes("growth constraint"), true);
  assert.equal(result.sourceUpdatedLabel, "Mar 11, 2026");
});

test("grow dashboard builder stays sparse when structured growth evidence is insufficient", async () => {
  const { buildGrowDashboardModel } = await loadModules(Date.now() + 3);

  const result = buildGrowDashboardModel({
    hasStructuredGrowthEvidence: false,
    creatorScore: null,
    growthVelocityPercent: null,
    engagementRate: null,
    audienceValueScore: null,
    diagnosisSummary: "Audience engagement themes are emerging, but measured analytics are still limited.",
    trendSummary: null,
    bestPostingWindow: null,
    topOpportunity: {
      title: "Tighten the first three seconds",
      summary: "Use the latest audience guidance to sharpen early content hooks.",
      estimatedImpact: null,
    },
    nextActions: [{ title: "Document the next growth test", impact: null }],
    sourceUpdatedAt: null,
  });

  assert.equal(result.availability, "partial");
  assert.equal(result.creatorScore, null);
  assert.equal(result.growthHealth, null);
  assert.equal(result.growthVelocity, null);
  assert.equal(result.audienceValue, null);
  assert.equal(result.latestGrowthSummary?.label, "Available guidance");
  assert.equal(result.topOpportunity?.title, "Tighten the first three seconds");
});

test("grow dashboard adapter does not reuse revenue fields for growth metrics", async () => {
  const { hydrateDashboardFromArtifact, adaptGrowDashboardSource } = await loadModules(Date.now() + 4);

  const latestArtifact = hydrateDashboardFromArtifact(createRevenueContaminatedArtifact());
  const latestReport = createReportDetail({
    summary: "Audience reach is mixed and still early.",
  });
  const result = adaptGrowDashboardSource({
    latestArtifact,
    latestReport,
    latestUpload: null,
    growthReport: null,
  });

  assert.notEqual(result, null);
  assert.equal(result?.hasStructuredGrowthEvidence, false);
  assert.equal(result?.creatorScore, null);
  assert.equal(result?.growthVelocityPercent, null);
  assert.equal(result?.audienceValueScore, null);
  assert.equal(result?.topOpportunity?.title, "Improve discovery hooks");
});

test("grow dashboard adapter returns null when no meaningful growth data exists", async () => {
  const { adaptGrowDashboardSource } = await loadModules(Date.now() + 5);

  const result = adaptGrowDashboardSource({
    latestArtifact: null,
    latestReport: createReportDetail({
      summary: "No summary available.",
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
    }),
    latestUpload: null,
    growthReport: null,
  });

  assert.equal(result, null);
});
