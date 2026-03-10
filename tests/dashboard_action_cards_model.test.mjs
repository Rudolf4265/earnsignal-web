import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/dashboard/action-cards.ts")).href;

async function loadModule(seed = Date.now()) {
  return import(`${moduleUrl}?t=${seed}`);
}

function createEntitlements(overrides = {}) {
  return {
    plan: "basic",
    plan_tier: "basic",
    planTier: "basic",
    status: "active",
    source: "stripe",
    canUpload: true,
    canGenerateReport: true,
    canViewReports: true,
    canDownloadPdf: false,
    canAccessDashboard: true,
    reportsRemainingThisPeriod: 4,
    reportsGeneratedThisPeriod: 1,
    monthlyReportLimit: 5,
    entitled: true,
    isActive: true,
    is_active: true,
    features: { app: true, upload: true, report: true },
    ...overrides,
  };
}

test("unlocks action cards only for canonical Pro plan tier and caps at two cards", async () => {
  const { buildDashboardActionCardsViewModel } = await loadModule(Date.now() + 1);

  const result = buildDashboardActionCardsViewModel({
    gateState: "authed_entitled",
    entitlements: createEntitlements({ plan: "pro", plan_tier: "pro", planTier: "pro" }),
    recommendedActions: [
      "Scale annual plan conversion from trial cohort insights.",
      "Tighten churn win-back automations for at-risk subscriber segments.",
      "This third recommendation should not render.",
    ],
  });

  assert.equal(result.mode, "unlocked");
  assert.equal(result.cards.length, 2);
  assert.deepEqual(
    result.cards.map((entry) => entry.body),
    [
      "Scale annual plan conversion from trial cohort insights.",
      "Tighten churn win-back automations for at-risk subscriber segments.",
    ],
  );
});

test("keeps Basic users locked and omits recommendation cards", async () => {
  const { buildDashboardActionCardsViewModel } = await loadModule(Date.now() + 2);

  const result = buildDashboardActionCardsViewModel({
    gateState: "authed_entitled",
    entitlements: createEntitlements({ plan: "basic", plan_tier: "basic", planTier: "basic" }),
    recommendedActions: ["Do not leak this recommendation"],
  });

  assert.equal(result.mode, "locked");
  assert.deepEqual(result.cards, []);
});

test("returns loading-safe mode while entitlement state is unresolved", async () => {
  const { buildDashboardActionCardsViewModel } = await loadModule(Date.now() + 3);

  const result = buildDashboardActionCardsViewModel({
    gateState: "authed_loading_entitlements",
    entitlements: null,
    recommendedActions: ["Do not leak this recommendation while loading"],
  });

  assert.equal(result.mode, "loading");
  assert.deepEqual(result.cards, []);
});

test("centralizes Pro-tier resolution in isProPlan helper", async () => {
  const { isProPlan } = await loadModule(Date.now() + 4);

  assert.equal(isProPlan(createEntitlements({ plan: "pro", plan_tier: "pro", planTier: "pro" })), true);
  assert.equal(isProPlan(createEntitlements({ plan: "basic", plan_tier: "basic", planTier: "basic" })), false);
  assert.equal(isProPlan(createEntitlements({ plan: "plan_b", plan_tier: "plan_b", planTier: "plan_b" })), true);
  assert.equal(isProPlan(null), false);
});
