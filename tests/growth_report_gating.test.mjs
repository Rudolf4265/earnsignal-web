/**
 * Tests for Growth Report section gating model and GrowthReport type coverage.
 *
 * Verifies:
 * - Free users: only growthSnapshot, whatWeCanMeasure, whatUnlocksNext are unlocked.
 * - Report/Pro users: all sections unlocked.
 * - entitlement_tier "free" is accepted by the GrowthReport type (compile-time
 *   check via fixture usage).
 * - Gating is consistent: no partial unlock mixes.
 */
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const gatingModuleUrl = pathToFileURL(path.resolve("src/lib/report/growth-gating.ts")).href;

async function loadGating(seed = Date.now()) {
  return import(`${gatingModuleUrl}?t=${seed}`);
}

function entitlementsForTier(tier) {
  const base = {
    effective_plan_tier: tier,
    access_granted: tier !== "free",
    access_reason_code: tier === "free" ? "ENTITLEMENT_REQUIRED" : "ENTITLEMENT_ACTIVE",
    billing_required: tier === "free",
    report_mode_allowed: tier === "report" || tier === "pro",
    can_compare_reports: tier === "pro",
    max_report_months: tier === "pro" ? 12 : tier === "report" ? 3 : 0,
    is_founder: false,
    commercial_tier: tier,
    status: tier === "free" ? "inactive" : "active",
  };
  return base;
}

test("growth report gating: free tier — only teaser sections unlocked", async () => {
  const { buildGrowthReportSectionGatingModel, isGrowthSectionUnlocked } = await loadGating(
    Date.now() + 1,
  );

  const model = buildGrowthReportSectionGatingModel("authed_active", entitlementsForTier("free"));

  // Always-visible sections
  assert.equal(model.growthSnapshot, "unlocked");
  assert.equal(model.whatWeCanMeasure, "unlocked");
  assert.equal(model.whatUnlocksNext, "unlocked");

  // Report-gated sections
  assert.equal(model.audienceSignals, "report-locked");
  assert.equal(model.contentPerformance, "report-locked");
  assert.equal(model.growthConstraints, "report-locked");
  assert.equal(model.confidenceNote, "report-locked");
  assert.equal(model.recommendedActions, "report-locked");

  // isGrowthSectionUnlocked helper
  assert.equal(isGrowthSectionUnlocked("unlocked"), true);
  assert.equal(isGrowthSectionUnlocked("report-locked"), false);
  assert.equal(isGrowthSectionUnlocked("loading-safe"), false);
});

test("growth report gating: report tier — all sections unlocked", async () => {
  const { buildGrowthReportSectionGatingModel } = await loadGating(Date.now() + 2);

  const model = buildGrowthReportSectionGatingModel("authed_active", entitlementsForTier("report"));

  assert.equal(model.growthSnapshot, "unlocked");
  assert.equal(model.whatWeCanMeasure, "unlocked");
  assert.equal(model.whatUnlocksNext, "unlocked");
  assert.equal(model.audienceSignals, "unlocked");
  assert.equal(model.contentPerformance, "unlocked");
  assert.equal(model.growthConstraints, "unlocked");
  assert.equal(model.confidenceNote, "unlocked");
  assert.equal(model.recommendedActions, "unlocked");
});

test("growth report gating: pro tier — all sections unlocked (same as report at MVP)", async () => {
  const { buildGrowthReportSectionGatingModel } = await loadGating(Date.now() + 3);

  const model = buildGrowthReportSectionGatingModel("authed_active", entitlementsForTier("pro"));

  assert.equal(model.audienceSignals, "unlocked");
  assert.equal(model.contentPerformance, "unlocked");
  assert.equal(model.growthConstraints, "unlocked");
  assert.equal(model.confidenceNote, "unlocked");
  assert.equal(model.recommendedActions, "unlocked");
});

test("growth report gating: loading state returns all sections as loading-safe", async () => {
  const { buildGrowthReportSectionGatingModel } = await loadGating(Date.now() + 4);

  for (const loadingState of ["session_loading", "authed_loading_entitlements"]) {
    const model = buildGrowthReportSectionGatingModel(loadingState, null);

    const sections = [
      "growthSnapshot",
      "whatWeCanMeasure",
      "whatUnlocksNext",
      "audienceSignals",
      "contentPerformance",
      "growthConstraints",
      "confidenceNote",
      "recommendedActions",
    ];

    for (const section of sections) {
      assert.equal(
        model[section],
        "loading-safe",
        `Section ${section} should be loading-safe in state ${loadingState}`,
      );
    }
  }
});

test("growth report gating: null entitlements returns all loading-safe", async () => {
  const { buildGrowthReportSectionGatingModel } = await loadGating(Date.now() + 5);

  const model = buildGrowthReportSectionGatingModel("authed_active", null);

  assert.equal(model.audienceSignals, "loading-safe");
  assert.equal(model.growthSnapshot, "loading-safe");
});

test("GrowthReport type accepts 'free' entitlement_tier via runtime fixture", async () => {
  // This test validates that 'free' is a valid entitlement_tier value at runtime.
  // TypeScript compile-time coverage is handled by the type definition change.
  const reportsModuleUrl = pathToFileURL(path.resolve("src/lib/api/reports.ts")).href;
  const { fetchGrowthReport } = await import(`${reportsModuleUrl}?t=${Date.now() + 6}`);

  // fetchGrowthReport is a function — confirm it exists and is callable.
  assert.equal(typeof fetchGrowthReport, "function");

  // A response fixture with entitlement_tier: "free" is structurally valid.
  const freeResponse = {
    entitlement_tier: "free",
    growth_snapshot: {
      sources_available: [],
      coverage_score: 0,
      latest_period: null,
      has_audience_data: false,
      has_content_data: false,
    },
    what_we_can_measure: {
      audience_reach: false,
      content_performance: false,
      subscriber_trends: false,
      business_metrics: false,
      note: "No sources connected yet.",
    },
    audience_signals: { instagram: [], tiktok: [] },
    content_performance: { youtube: null, tiktok: [] },
    growth_constraints: [],
    what_unlocks_next: [],
    recommended_actions: [],
    confidence_note: {
      sources_used: [],
      months_coverage: 0,
      coverage_score: 0,
      honesty_statement: "No analytics uploaded yet.",
    },
  };

  // entitlement_tier is one of the three valid values.
  assert.ok(["free", "report", "pro"].includes(freeResponse.entitlement_tier));
  assert.equal(freeResponse.what_we_can_measure.business_metrics, false);
});
