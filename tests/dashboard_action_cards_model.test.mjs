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
    effectivePlanTier: "free",
    entitlementSource: "none",
    accessGranted: false,
    accessReasonCode: "ENTITLEMENT_REQUIRED",
    billingRequired: true,
    plan: "free",
    plan_tier: "free",
    planTier: "free",
    status: "inactive",
    source: "none",
    canUpload: true,
    canGenerateReport: false,
    canDownloadPdf: false,
    canAccessDashboard: false,
    entitled: false,
    isActive: false,
    is_active: false,
    features: { app: false, upload: true, report: false },
    ...overrides,
  };
}

test("unlocks action cards only for canonical Pro capability and caps at two cards", async () => {
  const { buildDashboardActionCardsViewModel } = await loadModule(Date.now() + 1);

  const result = buildDashboardActionCardsViewModel({
    gateState: "authed_entitled",
    entitlements: createEntitlements({
      effectivePlanTier: "pro",
      plan: "pro",
      plan_tier: "pro",
      planTier: "pro",
      accessGranted: true,
      isActive: true,
      is_active: true,
      can_access_pro_comparisons_or_future_pro_features: true,
    }),
    recommendedActions: [
      "Scale annual plan conversion from trial cohort insights.",
      "Tighten churn win-back automations for at-risk subscriber segments.",
      "This third recommendation should not render.",
    ],
  });

  assert.equal(result.mode, "unlocked");
  assert.equal(result.cards.length, 2);
});

test("one-time report access keeps Pro recommendation cards locked", async () => {
  const { buildDashboardActionCardsViewModel } = await loadModule(Date.now() + 2);

  const result = buildDashboardActionCardsViewModel({
    gateState: "authed_entitled",
    entitlements: createEntitlements({
      effectivePlanTier: "report",
      plan: "report",
      plan_tier: "report",
      planTier: "report",
      accessGranted: true,
      isActive: true,
      is_active: true,
      canDownloadPdf: true,
    }),
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

test("isProPlan resolves from Pro-only capability, not report aliases", async () => {
  const { isProPlan } = await loadModule(Date.now() + 4);

  assert.equal(
    isProPlan(
      createEntitlements({
        effectivePlanTier: "pro",
        plan: "pro",
        plan_tier: "pro",
        planTier: "pro",
        accessGranted: true,
        can_access_pro_comparisons_or_future_pro_features: true,
      }),
    ),
    true,
  );
  assert.equal(
    isProPlan(
      createEntitlements({
        effectivePlanTier: "report",
        plan: "report",
        plan_tier: "report",
        planTier: "report",
        accessGranted: true,
      }),
    ),
    false,
  );
  assert.equal(
    isProPlan(
      createEntitlements({
        effectivePlanTier: "free",
        entitlementSource: "admin_override",
        accessGranted: true,
        can_access_pro_comparisons_or_future_pro_features: true,
      }),
    ),
    true,
  );
  assert.equal(isProPlan(null), false);
});

test("dashboard action cards distinguish validate recommendations from action-ready ones", async () => {
  const { buildDashboardActionCardsViewModel } = await loadModule(Date.now() + 5);

  const result = buildDashboardActionCardsViewModel({
    gateState: "authed_entitled",
    entitlements: createEntitlements({
      effectivePlanTier: "pro",
      plan: "pro",
      plan_tier: "pro",
      planTier: "pro",
      accessGranted: true,
      isActive: true,
      can_access_pro_comparisons_or_future_pro_features: true,
    }),
    recommendedActions: [],
    recommendationItems: [
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
  });

  assert.equal(result.mode, "unlocked");
  assert.equal(result.cards[0]?.label, "Validate first");
  assert.equal(result.cards[0]?.detail?.includes("Validate before acting"), true);
});

test("dashboard action cards prioritize context-matched recommendations conservatively without changing their modes", async () => {
  const { buildDashboardActionCardsViewModel } = await loadModule(Date.now() + 6);

  const result = buildDashboardActionCardsViewModel({
    gateState: "authed_entitled",
    entitlements: createEntitlements({
      effectivePlanTier: "pro",
      plan: "pro",
      plan_tier: "pro",
      planTier: "pro",
      accessGranted: true,
      isActive: true,
      can_access_pro_comparisons_or_future_pro_features: true,
    }),
    recommendedActions: [],
    diagnosis: {
      diagnosisType: "churn_pressure",
      summaryText: "Current profile looks more churn-limited based on elevated churn pressure.",
      supportingMetrics: [],
      primitives: null,
      availability: "limited",
      confidence: "medium",
      confidenceAdjusted: true,
      evidenceStrength: "moderate",
      insufficientReason: null,
      reasonCodes: ["churn_pressure_primary"],
      dataQualityLevel: "good",
      analysisMode: "full",
      recommendationMode: null,
    },
    whatChanged: {
      comparisonAvailable: true,
      priorReportId: "rep_prev_001",
      priorPeriodStart: "2026-01-01",
      priorPeriodEnd: "2026-01-31",
      comparableMetricCount: 1,
      comparisonBasisMetrics: ["latest_net_revenue"],
      deltas: {},
      whatImproved: [],
      whatWorsened: [
        {
          category: "churn",
          metric: "churn_rate",
          changeType: "worsened",
          direction: "up",
          materiality: "high",
          summaryText: "Churn worsened relative to the prior report.",
          availability: "available",
          confidence: "medium",
          confidenceAdjusted: false,
          evidenceStrength: "moderate",
          insufficientReason: null,
          reasonCodes: ["churn_rate_worsened"],
          dataQualityLevel: "good",
          analysisMode: "full",
          recommendationMode: null,
        },
      ],
      watchNext: [],
      availability: "limited",
      confidence: "medium",
      confidenceAdjusted: true,
      evidenceStrength: "moderate",
      insufficientReason: null,
      reasonCodes: ["comparison_basis_available"],
      dataQualityLevel: "good",
      analysisMode: "full",
      recommendationMode: null,
    },
    recommendationItems: [
      {
        id: "rec_watch_context",
        title: "Watch retention signals for one more cycle",
        description: "Wait for more stable subscriber evidence before acting.",
        expectedImpact: "low",
        effort: "low",
        confidenceScore: 0.6,
        steps: [],
        linkedSignals: [],
        supportingContextReasonCodes: ["churn_pressure_primary", "churn_rate_worsened"],
        availability: "limited",
        confidence: "medium",
        confidenceAdjusted: true,
        evidenceStrength: "moderate",
        insufficientReason: null,
        reasonCodes: ["watch_retention"],
        dataQualityLevel: "good",
        analysisMode: "full",
        recommendationMode: "watch",
      },
      {
        id: "rec_action_plain",
        title: "Fix renewal messaging on the highest-churn cohort",
        description: "Start with the segment already showing early churn pressure.",
        expectedImpact: "medium",
        effort: "medium",
        confidenceScore: 0.55,
        steps: [],
        linkedSignals: [],
        supportingContextReasonCodes: [],
        availability: "available",
        confidence: "medium",
        confidenceAdjusted: false,
        evidenceStrength: "moderate",
        insufficientReason: null,
        reasonCodes: ["retention_play"],
        dataQualityLevel: "good",
        analysisMode: "full",
        recommendationMode: "action",
      },
      {
        id: "rec_action_context",
        title: "Audit churn drivers before expanding acquisition spend",
        description: "Check cancellation drivers before broadening spend.",
        expectedImpact: "medium",
        effort: "medium",
        confidenceScore: 0.55,
        steps: [],
        linkedSignals: [],
        supportingContextReasonCodes: ["churn_pressure_primary", "churn_rate_worsened"],
        availability: "available",
        confidence: "medium",
        confidenceAdjusted: false,
        evidenceStrength: "strong",
        insufficientReason: null,
        reasonCodes: ["retention_play"],
        dataQualityLevel: "good",
        analysisMode: "full",
        recommendationMode: "action",
      },
    ],
  });

  assert.equal(result.mode, "unlocked");
  assert.deepEqual(
    result.cards.map((card) => card.id),
    ["rec_action_context", "rec_action_plain"],
  );
  assert.deepEqual(
    result.cards.map((card) => card.label),
    ["Recommended action", "Recommended action"],
  );
});
