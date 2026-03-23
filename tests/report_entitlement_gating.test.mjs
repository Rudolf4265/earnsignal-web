import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const modelPath = path.resolve("src/lib/entitlements/model.ts");
const gatingPath = path.resolve("src/lib/report/detail-gating.ts");
const teaserComponentPath = path.resolve("app/(app)/app/report/[id]/_components/ReportFreeTeaser.tsx");
const reportPagePath = path.resolve("app/(app)/app/report/[id]/page.tsx");

const modelUrl = pathToFileURL(modelPath).href;
const gatingUrl = pathToFileURL(gatingPath).href;

async function loadModel(seed = Date.now()) {
  return import(`${modelUrl}?t=${seed}`);
}

async function loadGating(seed = Date.now()) {
  return import(`${gatingUrl}?t=${seed}`);
}

function freeSnapshot(overrides = {}) {
  return {
    effective_plan_tier: "free",
    access_granted: false,
    access_reason_code: "ENTITLEMENT_REQUIRED",
    billing_required: true,
    ...overrides,
  };
}

function reportSnapshot(overrides = {}) {
  return {
    effective_plan_tier: "report",
    access_granted: true,
    access_reason_code: "OWNED_REPORT",
    billing_required: false,
    can_view_owned_report: true,
    can_download_owned_report: true,
    ...overrides,
  };
}

function proSnapshot(overrides = {}) {
  return {
    effective_plan_tier: "pro",
    access_granted: true,
    access_reason_code: "ACTIVE_SUBSCRIPTION",
    billing_required: false,
    can_access_pro_comparisons_or_future_pro_features: true,
    ...overrides,
  };
}

// ── Part 1: Capability matrix ──────────────────────────────────────────────────

test("free plan: canViewWowSummary is false", async () => {
  const { resolveCapability } = await loadModel(1);
  assert.equal(resolveCapability(freeSnapshot(), "canViewWowSummary"), false);
});

test("free plan: canViewOpportunity is false", async () => {
  const { resolveCapability } = await loadModel(2);
  assert.equal(resolveCapability(freeSnapshot(), "canViewOpportunity"), false);
});

test("free plan: canViewStrengthsRisks is false", async () => {
  const { resolveCapability } = await loadModel(3);
  assert.equal(resolveCapability(freeSnapshot(), "canViewStrengthsRisks"), false);
});

test("free plan: canViewNextActions is false", async () => {
  const { resolveCapability } = await loadModel(4);
  assert.equal(resolveCapability(freeSnapshot(), "canViewNextActions"), false);
});

test("free plan: canViewTeaserPreview is true", async () => {
  const { resolveCapability } = await loadModel(5);
  assert.equal(resolveCapability(freeSnapshot(), "canViewTeaserPreview"), true);
});

test("report plan: canViewWowSummary is true", async () => {
  const { resolveCapability } = await loadModel(6);
  assert.equal(resolveCapability(reportSnapshot(), "canViewWowSummary"), true);
});

test("report plan: canViewOpportunity is true", async () => {
  const { resolveCapability } = await loadModel(7);
  assert.equal(resolveCapability(reportSnapshot(), "canViewOpportunity"), true);
});

test("report plan: canViewStrengthsRisks is true", async () => {
  const { resolveCapability } = await loadModel(8);
  assert.equal(resolveCapability(reportSnapshot(), "canViewStrengthsRisks"), true);
});

test("report plan: canViewNextActions is true", async () => {
  const { resolveCapability } = await loadModel(9);
  assert.equal(resolveCapability(reportSnapshot(), "canViewNextActions"), true);
});

test("report plan: canViewTeaserPreview is false", async () => {
  const { resolveCapability } = await loadModel(10);
  assert.equal(resolveCapability(reportSnapshot(), "canViewTeaserPreview"), false);
});

test("pro plan: canViewWowSummary is true", async () => {
  const { resolveCapability } = await loadModel(11);
  assert.equal(resolveCapability(proSnapshot(), "canViewWowSummary"), true);
});

test("pro plan: canViewTeaserPreview is false", async () => {
  const { resolveCapability } = await loadModel(12);
  assert.equal(resolveCapability(proSnapshot(), "canViewTeaserPreview"), false);
});

test("canViewWowSummaryFromEntitlement helper mirrors capability resolution", async () => {
  const { canViewWowSummaryFromEntitlement } = await loadModel(13);
  assert.equal(canViewWowSummaryFromEntitlement(freeSnapshot()), false);
  assert.equal(canViewWowSummaryFromEntitlement(reportSnapshot()), true);
  assert.equal(canViewWowSummaryFromEntitlement(proSnapshot()), true);
  assert.equal(canViewWowSummaryFromEntitlement(null), false);
});

test("canViewTeaserPreviewFromEntitlement helper mirrors capability resolution", async () => {
  const { canViewTeaserPreviewFromEntitlement } = await loadModel(14);
  assert.equal(canViewTeaserPreviewFromEntitlement(freeSnapshot()), true);
  assert.equal(canViewTeaserPreviewFromEntitlement(reportSnapshot()), false);
  assert.equal(canViewTeaserPreviewFromEntitlement(proSnapshot()), false);
  assert.equal(canViewTeaserPreviewFromEntitlement(null), false);
});

test("revoked entitlement denies wow summary regardless of plan tier", async () => {
  const { resolveCapability } = await loadModel(15);
  const revoked = {
    effective_plan_tier: "pro",
    access_granted: false,
    access_reason_code: "OVERRIDE_REVOKED",
    can_view_wow_summary: true,
  };
  assert.equal(resolveCapability(revoked, "canViewWowSummary"), false);
});

// ── Part 2: Report-tier section gating ────────────────────────────────────────

test("detail-gating exports ReportDetailReportSectionMode type shape through source", async () => {
  const source = await readFile(gatingPath, "utf8");
  assert.equal(source.includes('ReportDetailReportSectionMode = "report-unlocked" | "report-locked" | "loading-safe"'), true);
  assert.equal(source.includes("canRenderReportDetailReportContent"), true);
  assert.equal(source.includes("canViewOwnedReportFromEntitlement"), true);
});

test("gating model includes all four wow section fields", async () => {
  const source = await readFile(gatingPath, "utf8");
  assert.equal(source.includes("wowSummary: ReportDetailReportSectionMode"), true);
  assert.equal(source.includes("opportunity: ReportDetailReportSectionMode"), true);
  assert.equal(source.includes("strengthsRisks: ReportDetailReportSectionMode"), true);
  assert.equal(source.includes("nextActions: ReportDetailReportSectionMode"), true);
});

function createEntitlements(overrides = {}) {
  return {
    effectivePlanTier: "free",
    entitlementSource: "none",
    accessGranted: false,
    billingRequired: true,
    plan: "free",
    plan_tier: "free",
    planTier: "free",
    canUpload: true,
    canValidateUpload: true,
    canGenerateReport: false,
    canViewReports: false,
    canDownloadPdf: false,
    entitled: false,
    isActive: false,
    ...overrides,
  };
}

test("free user sees report-locked for all wow sections", async () => {
  const { buildReportDetailSectionGatingModel, canRenderReportDetailReportContent } = await loadGating(20);

  const model = buildReportDetailSectionGatingModel({
    gateState: "authed_entitled",
    entitlements: createEntitlements(),
  });

  assert.equal(model.wowSummary, "report-locked");
  assert.equal(model.opportunity, "report-locked");
  assert.equal(model.strengthsRisks, "report-locked");
  assert.equal(model.nextActions, "report-locked");
  assert.equal(canRenderReportDetailReportContent(model.wowSummary), false);
});

test("report-tier user sees report-unlocked for all wow sections", async () => {
  const { buildReportDetailSectionGatingModel, canRenderReportDetailReportContent } = await loadGating(21);

  const model = buildReportDetailSectionGatingModel({
    gateState: "authed_entitled",
    entitlements: createEntitlements({
      effectivePlanTier: "report",
      plan: "report",
      plan_tier: "report",
      planTier: "report",
      entitlementSource: "owned_report",
      accessGranted: true,
      isActive: true,
      canViewReports: true,
      canDownloadPdf: true,
    }),
  });

  assert.equal(model.wowSummary, "report-unlocked");
  assert.equal(model.opportunity, "report-unlocked");
  assert.equal(model.strengthsRisks, "report-unlocked");
  assert.equal(model.nextActions, "report-unlocked");
  assert.equal(canRenderReportDetailReportContent(model.wowSummary), true);
});

test("pro user sees report-unlocked for wow sections", async () => {
  const { buildReportDetailSectionGatingModel } = await loadGating(22);

  const model = buildReportDetailSectionGatingModel({
    gateState: "authed_entitled",
    entitlements: createEntitlements({
      effectivePlanTier: "pro",
      plan: "pro",
      plan_tier: "pro",
      planTier: "pro",
      accessGranted: true,
      isActive: true,
      canViewReports: true,
      canDownloadPdf: true,
      can_access_pro_comparisons_or_future_pro_features: true,
    }),
  });

  assert.equal(model.wowSummary, "report-unlocked");
  assert.equal(model.opportunity, "report-unlocked");
});

test("loading state returns loading-safe for wow sections", async () => {
  const { buildReportDetailSectionGatingModel, canRenderReportDetailReportContent } = await loadGating(23);

  const loadingStates = [
    { gateState: "session_loading", entitlements: null },
    { gateState: "authed_loading_entitlements", entitlements: null },
  ];

  for (const input of loadingStates) {
    const model = buildReportDetailSectionGatingModel(input);
    assert.equal(model.wowSummary, "loading-safe", `Expected loading-safe for gateState=${input.gateState}`);
    assert.equal(canRenderReportDetailReportContent(model.wowSummary), false);
  }
});

test("entitlements_error returns loading-safe for wow sections", async () => {
  const { buildReportDetailSectionGatingModel } = await loadGating(24);

  const model = buildReportDetailSectionGatingModel({
    gateState: "entitlements_error",
    entitlements: null,
  });

  assert.equal(model.wowSummary, "loading-safe");
});

test("pro-only sections remain at pro-locked for report-tier user", async () => {
  const { buildReportDetailSectionGatingModel, canRenderReportDetailProContent } = await loadGating(25);

  const model = buildReportDetailSectionGatingModel({
    gateState: "authed_entitled",
    entitlements: createEntitlements({
      effectivePlanTier: "report",
      plan: "report",
      plan_tier: "report",
      planTier: "report",
      accessGranted: true,
      isActive: true,
      canViewReports: true,
      canDownloadPdf: true,
    }),
  });

  // Report-tier user unlocks wow sections but not Pro-only sections
  assert.equal(model.wowSummary, "report-unlocked");
  assert.equal(model.subscriberHealth, "pro-locked");
  assert.equal(model.growthRecommendations, "pro-locked");
  assert.equal(model.revenueOutlook, "pro-locked");
  assert.equal(model.platformRiskExplanation, "pro-locked");
  assert.equal(canRenderReportDetailProContent(model.subscriberHealth), false);
});

test("pro user unlocks both report-tier and pro-only sections", async () => {
  const { buildReportDetailSectionGatingModel, canRenderReportDetailProContent, canRenderReportDetailReportContent } = await loadGating(26);

  const model = buildReportDetailSectionGatingModel({
    gateState: "authed_entitled",
    entitlements: createEntitlements({
      effectivePlanTier: "pro",
      plan: "pro",
      plan_tier: "pro",
      planTier: "pro",
      accessGranted: true,
      isActive: true,
      canViewReports: true,
      canDownloadPdf: true,
      can_access_pro_comparisons_or_future_pro_features: true,
    }),
  });

  assert.equal(canRenderReportDetailReportContent(model.wowSummary), true);
  assert.equal(canRenderReportDetailProContent(model.subscriberHealth), true);
});

test("founder user unlocks both report-tier and pro-only sections without a paid plan", async () => {
  const { buildReportDetailSectionGatingModel, canRenderReportDetailProContent, canRenderReportDetailReportContent } = await loadGating(265);

  const model = buildReportDetailSectionGatingModel({
    gateState: "authed_entitled",
    entitlements: createEntitlements({
      effectivePlanTier: "free",
      plan: "free",
      plan_tier: "free",
      planTier: "free",
      accessGranted: false,
      isActive: false,
      isFounder: true,
      is_founder: true,
      accessReasonCode: "FOUNDER_PROTECTED",
      access_reason_code: "FOUNDER_PROTECTED",
    }),
  });

  assert.equal(canRenderReportDetailReportContent(model.wowSummary), true);
  assert.equal(canRenderReportDetailProContent(model.subscriberHealth), true);
});

// ── Part 3 & 4: Free teaser component and upgrade copy ────────────────────────

test("ReportFreeTeaser component exists with correct test IDs", async () => {
  const source = await readFile(teaserComponentPath, "utf8");

  assert.equal(source.includes('data-testid="report-free-teaser"'), true);
  assert.equal(source.includes('data-testid="report-free-teaser-locked-sections"'), true);
  assert.equal(source.includes('data-testid="report-free-teaser-upgrade-cta"'), true);
  assert.equal(source.includes('data-testid="report-free-teaser-pro-upsell"'), true);
});

test("ReportFreeTeaser upgrade CTA has correct copy", async () => {
  const source = await readFile(teaserComponentPath, "utf8");

  assert.equal(
    source.includes("Your data is ready. Unlock the full report to see your biggest opportunity, platform risks, and next actions."),
    true,
  );
  assert.equal(source.includes("View plans"), true);
  assert.equal(source.includes("/app/billing"), true);
});

test("ReportFreeTeaser pro upsell has correct copy", async () => {
  const source = await readFile(teaserComponentPath, "utf8");

  assert.equal(
    source.includes("Upgrade to Pro to track changes over time, compare periods, and monitor new risks and opportunities."),
    true,
  );
});

test("ReportFreeTeaser locked sections preview shows all four gated sections", async () => {
  const source = await readFile(teaserComponentPath, "utf8");

  assert.equal(source.includes("Biggest Opportunity"), true);
  assert.equal(source.includes("Platform Mix"), true);
  assert.equal(source.includes("Strengths & Risks"), true);
  assert.equal(source.includes("Next 3 Actions"), true);
});

test("ReportFreeTeaser component renders only safe generic data", async () => {
  const source = await readFile(teaserComponentPath, "utf8");

  // Teaser renders platform count and boolean signal presence only — no raw financial values
  assert.equal(source.includes("model.platformCount"), true);
  assert.equal(source.includes("model.hasRevenueSignals"), true);
  assert.equal(source.includes("model.hasSubscriberSignals"), true);

  // Component itself must not display concentration scores or raw financial values
  assert.equal(source.includes("concentrationScore"), false);
  // Platform count is safe (integer count), but specific revenue/subscriber dollar values are not shown
  assert.equal(source.includes("metric.value"), false);
});

test("buildReportFreeTeaserViewModel is exported from teaser component", async () => {
  const source = await readFile(teaserComponentPath, "utf8");
  assert.equal(source.includes("export function buildReportFreeTeaserViewModel"), true);
  assert.equal(source.includes("platformCount"), true);
  assert.equal(source.includes("hasRevenueSignals"), true);
  assert.equal(source.includes("hasSubscriberSignals"), true);
});

// ── Part 5: Ownership check wiring ────────────────────────────────────────────

test("detail-gating uses canViewOwnedReportFromEntitlement for report-tier sections", async () => {
  const source = await readFile(gatingPath, "utf8");
  assert.equal(
    source.includes('canViewOwnedReportFromEntitlement(entitlements) ? "report-unlocked" : "report-locked"'),
    true,
  );
});

test("report plan: canViewOwnedReport is true (ownership check passes)", async () => {
  const { resolveCapability } = await loadModel(30);
  assert.equal(resolveCapability(reportSnapshot(), "canViewOwnedReport"), true);
});

test("free plan: canViewOwnedReport is false (ownership check fails)", async () => {
  const { resolveCapability } = await loadModel(31);
  assert.equal(resolveCapability(freeSnapshot(), "canViewOwnedReport"), false);
});

// ── Part 6: Report page wiring ─────────────────────────────────────────────────

test("report page imports canRenderReportDetailReportContent from detail-gating", async () => {
  const source = await readFile(reportPagePath, "utf8");
  assert.equal(source.includes("canRenderReportDetailReportContent"), true);
});

test("report page imports ReportFreeTeaser component", async () => {
  const source = await readFile(reportPagePath, "utf8");
  assert.equal(source.includes("ReportFreeTeaser"), true);
  assert.equal(source.includes("buildReportFreeTeaserViewModel"), true);
});

test("report page gates wow summary behind showFullReportContent", async () => {
  const source = await readFile(reportPagePath, "utf8");
  assert.equal(source.includes("showFullReportContent && wowSummary"), true);
});

test("report page shows teaser when report-locked", async () => {
  const source = await readFile(reportPagePath, "utf8");
  assert.equal(source.includes('!isFounder && proSectionGate.wowSummary === "report-locked" && freeTeaserModel'), true);
});

test("report page derives founder override from entitlement state before paywall rendering", async () => {
  const source = await readFile(reportPagePath, "utf8");

  assert.equal(source.includes("isFounderFromEntitlement"), true);
  assert.equal(source.includes("const isFounder = useMemo(() => isFounderFromEntitlement(entitlements), [entitlements]);"), true);
  assert.equal(source.includes("const showFullReportContent = isFounder || canRenderReportDetailReportContent(proSectionGate.wowSummary);"), true);
});

test("report page gates hero metrics behind showFullReportContent", async () => {
  const source = await readFile(reportPagePath, "utf8");
  assert.equal(source.includes("showFullReportContent ? ("), true);
  // Hero metrics grid is inside the showFullReportContent gate
  const idx = source.indexOf("showFullReportContent ? (");
  const metricsIdx = source.indexOf("presentation.heroMetrics.map", idx);
  assert.equal(metricsIdx > idx, true);
});

test("report page gates all content sections behind showFullReportContent", async () => {
  const source = await readFile(reportPagePath, "utf8");
  // Content sections are inside the fragment gate
  assert.equal(source.includes("{showFullReportContent ? <>"), true);
});
