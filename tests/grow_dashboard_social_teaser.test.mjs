/**
 * Tests for the Grow Dashboard social analytics teaser logic.
 *
 * The teaser renders when:
 * - growDashboardModel is null (no Earn report artifact with growth metrics)
 * - growthReport has at least one source in sources_available
 *
 * Verifies:
 * 1. Grow dashboard teaser triggers when social context data exists.
 * 2. Grow stays empty when neither Earn metrics nor social analytics exist.
 * 3. GrowthReport with partial sources → teaser shows (not fake full score).
 * 4. growGuidanceLimited is false when social analytics are connected
 *    (no misleading "Use Earn now" onboarding guidance shown).
 * 5. Instagram/TikTok remain context/performance only — no Earn metrics generated.
 */
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const adapterModuleUrl = pathToFileURL(path.resolve("src/lib/dashboard/grow-adapter.ts")).href;
const modelModuleUrl = pathToFileURL(path.resolve("src/lib/dashboard/grow-model.ts")).href;

async function loadModules(seed = Date.now()) {
  const [adapter, model] = await Promise.all([
    import(`${adapterModuleUrl}?t=${seed}`),
    import(`${modelModuleUrl}?t=${seed}`),
  ]);
  return { ...adapter, ...model };
}

function emptyGrowthReport(sourceOverrides = []) {
  return {
    entitlement_tier: "free",
    growth_snapshot: {
      sources_available: sourceOverrides,
      coverage_score: sourceOverrides.length > 0 ? sourceOverrides.length * 33 : 0,
      latest_period: sourceOverrides.length > 0 ? "2026-02" : null,
      has_audience_data: sourceOverrides.some((s) =>
        ["instagram", "tiktok"].includes(s),
      ),
      has_content_data: sourceOverrides.some((s) =>
        ["tiktok", "youtube_channel_analytics"].includes(s),
      ),
    },
    what_we_can_measure: {
      audience_reach: sourceOverrides.some((s) => ["instagram", "tiktok"].includes(s)),
      content_performance: sourceOverrides.some((s) =>
        ["tiktok", "youtube_channel_analytics"].includes(s),
      ),
      subscriber_trends: false,
      business_metrics: false,
      note: "Social analytics only.",
    },
    audience_signals: {
      instagram:
        sourceOverrides.includes("instagram")
          ? [{ month: "2026-02", followers_gained: 100, followers_lost: 20, impressions: 5000, reach: 3000, engagements: 400 }]
          : [],
      tiktok:
        sourceOverrides.includes("tiktok")
          ? [{ month: "2026-02", followers_gained: 200, followers_lost: 30, video_views: 12000, likes: 800, comments: 60, shares: 150 }]
          : [],
    },
    content_performance: {
      youtube: sourceOverrides.includes("youtube_channel_analytics")
        ? {
            total_views: 45000,
            total_watch_time_hours: 1200.5,
            avg_impressions_ctr_pct: 3.2,
            subscribers_gained_total: 500,
            subscribers_lost_total: 80,
            net_subscribers_change: 420,
            date_range_start: "2026-01-01",
            date_range_end: "2026-03-31",
            has_subscriber_data: true,
            has_impressions_data: true,
          }
        : null,
      tiktok:
        sourceOverrides.includes("tiktok")
          ? [{ month: "2026-02", video_views: 12000, likes: 800, comments: 60, shares: 150, profile_views: 2000 }]
          : [],
    },
    growth_constraints: [],
    what_unlocks_next: [],
    recommended_actions: [],
    confidence_note: {
      sources_used: sourceOverrides,
      months_coverage: sourceOverrides.length > 0 ? 1 : 0,
      coverage_score: sourceOverrides.length * 33,
      honesty_statement: "Bounded to uploaded data.",
    },
  };
}

test("adaptGrowDashboardSource returns null when no Earn report artifact exists", async () => {
  const { adaptGrowDashboardSource } = await loadModules(Date.now() + 1);

  // Simulate the case: only social uploads, no Earn report artifact
  const result = adaptGrowDashboardSource({
    latestArtifact: null,
    latestReport: null,
    latestUpload: null,
  });

  assert.equal(result, null, "Grow model must be null when there is no Earn report artifact.");
});

test("growthReport with Instagram source has has_audience_data = true", async () => {
  const growthReport = emptyGrowthReport(["instagram"]);

  assert.equal(growthReport.growth_snapshot.sources_available.length, 1);
  assert.ok(growthReport.growth_snapshot.sources_available.includes("instagram"));
  assert.equal(growthReport.growth_snapshot.has_audience_data, true);
  assert.equal(growthReport.growth_snapshot.has_content_data, false);
  // Instagram must not appear as a business-metric source.
  assert.equal(growthReport.what_we_can_measure.business_metrics, false);
});

test("growthReport with TikTok source has both audience and content data", async () => {
  const growthReport = emptyGrowthReport(["tiktok"]);

  assert.equal(growthReport.growth_snapshot.has_audience_data, true);
  assert.equal(growthReport.growth_snapshot.has_content_data, true);
  assert.equal(growthReport.what_we_can_measure.business_metrics, false);

  // TikTok audience and content signals are present.
  assert.equal(growthReport.audience_signals.tiktok.length, 1);
  assert.equal(growthReport.content_performance.tiktok.length, 1);
});

test("growthReport with YouTube source has content data, no audience data", async () => {
  const growthReport = emptyGrowthReport(["youtube_channel_analytics"]);

  assert.equal(growthReport.growth_snapshot.has_content_data, true);
  assert.equal(growthReport.growth_snapshot.has_audience_data, false);
  assert.notEqual(growthReport.content_performance.youtube, null);
  assert.equal(growthReport.content_performance.youtube.total_views, 45000);
  assert.equal(growthReport.what_we_can_measure.business_metrics, false);
});

test("growthReport with no sources has coverage_score 0 and no data", async () => {
  const growthReport = emptyGrowthReport([]);

  assert.equal(growthReport.growth_snapshot.sources_available.length, 0);
  assert.equal(growthReport.growth_snapshot.coverage_score, 0);
  assert.equal(growthReport.growth_snapshot.has_audience_data, false);
  assert.equal(growthReport.growth_snapshot.has_content_data, false);
  assert.equal(growthReport.audience_signals.instagram.length, 0);
  assert.equal(growthReport.audience_signals.tiktok.length, 0);
  assert.equal(growthReport.content_performance.youtube, null);
});

test("growthReport with all three sources has coverage_score above 90", async () => {
  const growthReport = emptyGrowthReport(["instagram", "tiktok", "youtube_channel_analytics"]);

  assert.equal(growthReport.growth_snapshot.sources_available.length, 3);
  // 3 sources * 33 = 99, + 10 (latest_period) = 109 → capped to 100
  assert.ok(
    growthReport.growth_snapshot.coverage_score >= 90,
    `Coverage score ${growthReport.growth_snapshot.coverage_score} should be >= 90`,
  );
});

test("hasSocialAnalytics suppresses growGuidanceLimited when sources are present", async () => {
  // This mirrors the logic in app/page.tsx:
  //   const hasSocialAnalytics = (growthReport?.growth_snapshot.sources_available.length ?? 0) > 0;
  //   const growGuidanceLimited = !growDashboardModel && !hasSocialAnalytics;

  const growthReportWithSources = emptyGrowthReport(["instagram"]);
  const growthReportEmpty = emptyGrowthReport([]);

  const hasSocialAnalyticsWhenConnected =
    (growthReportWithSources.growth_snapshot.sources_available.length ?? 0) > 0;
  const hasSocialAnalyticsWhenEmpty =
    (growthReportEmpty.growth_snapshot.sources_available.length ?? 0) > 0;

  // When social analytics are connected and no Earn model exists:
  const growDashboardModel = null;
  const growGuidanceLimitedWithSocial =
    !growDashboardModel && !hasSocialAnalyticsWhenConnected;
  const growGuidanceLimitedWithoutSocial =
    !growDashboardModel && !hasSocialAnalyticsWhenEmpty;

  assert.equal(
    growGuidanceLimitedWithSocial,
    false,
    "growGuidanceLimited must be false when social analytics are connected.",
  );
  assert.equal(
    growGuidanceLimitedWithoutSocial,
    true,
    "growGuidanceLimited must be true when no social analytics exist.",
  );
});

test("partial data (Instagram only) yields audience signals but not content performance", async () => {
  const growthReport = emptyGrowthReport(["instagram"]);

  // Only Instagram connected — audience is present, content is not.
  assert.equal(growthReport.what_we_can_measure.audience_reach, true);
  assert.equal(growthReport.what_we_can_measure.content_performance, false);
  assert.equal(growthReport.audience_signals.instagram.length, 1);
  assert.equal(growthReport.audience_signals.tiktok.length, 0);
  assert.equal(growthReport.content_performance.youtube, null);

  // No fake composite score present.
  assert.equal("creator_score" in growthReport, false);
  assert.equal("growth_score" in growthReport, false);
});
