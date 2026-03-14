import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const reportDetailGatingPath = path.resolve("src/lib/report/detail-gating.ts");
const reportDetailGatingModuleUrl = pathToFileURL(reportDetailGatingPath).href;

async function loadModule(seed = Date.now()) {
  return import(`${reportDetailGatingModuleUrl}?t=${seed}`);
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
    canValidateUpload: true,
    canGenerateReport: false,
    canViewReports: false,
    canDownloadPdf: false,
    canAccessDashboard: false,
    entitled: false,
    isActive: false,
    is_active: false,
    features: { app: false, upload: true, report: false },
    ...overrides,
  };
}

test("report detail keeps Pro section gating centralized through canonical helper", async () => {
  const source = await readFile(reportDetailGatingPath, "utf8");

  assert.equal(source.includes('import { canDownloadPdfFromEntitlement, hasProEquivalentEntitlement } from "../entitlements/model";'), true);
  assert.equal(source.includes('return hasProEquivalentEntitlement(entitlements) ? "pro-unlocked" : "pro-locked";'), true);
});

test("report detail PDF gating uses owned-report download capability instead of Pro-only status", async () => {
  const source = await readFile(reportDetailGatingPath, "utf8");

  assert.equal(source.includes('return canDownloadPdfFromEntitlement(entitlements) ? "pdf-unlocked" : "pdf-locked";'), true);
  assert.equal(source.includes('return mode === "pdf-unlocked";'), true);
});

test("report detail gating defines loading-safe handling for unresolved entitlement states", async () => {
  const source = await readFile(reportDetailGatingPath, "utf8");

  assert.equal(source.includes('gateState === "session_loading"'), true);
  assert.equal(source.includes('gateState === "authed_loading_entitlements"'), true);
  assert.equal(source.includes('gateState === "entitlements_error"'), true);
  assert.equal(source.includes("entitlements === null"), true);
  assert.equal(source.includes('return "loading-safe";'), true);
});

test("report detail maps all required Pro-only sections and avoids content leaks", async () => {
  const source = await readFile(reportDetailGatingPath, "utf8");

  assert.equal(source.includes('subscriberHealth: proMode'), true);
  assert.equal(source.includes('growthRecommendations: proMode'), true);
  assert.equal(source.includes('revenueOutlook: proMode'), true);
  assert.equal(source.includes('platformRiskExplanation: proMode'), true);
});

test("report detail PDF access mode unlocks for Pro entitlements", async () => {
  const { resolveReportDetailPdfAccessMode, canAccessFullReportPdf } = await loadModule(Date.now() + 10);

  const mode = resolveReportDetailPdfAccessMode({
    gateState: "authed_entitled",
    entitlements: createEntitlements({
      effectivePlanTier: "pro",
      plan: "pro",
      plan_tier: "pro",
      planTier: "pro",
      accessGranted: true,
      isActive: true,
      is_active: true,
      canDownloadPdf: true,
    }),
  });

  assert.equal(mode, "pdf-unlocked");
  assert.equal(canAccessFullReportPdf(mode), true);
});

test("report detail PDF access mode unlocks for one-time report access", async () => {
  const { resolveReportDetailPdfAccessMode, canAccessFullReportPdf } = await loadModule(Date.now() + 11);

  const mode = resolveReportDetailPdfAccessMode({
    gateState: "authed_entitled",
    entitlements: createEntitlements({
      effectivePlanTier: "report",
      plan: "report",
      plan_tier: "report",
      planTier: "report",
      entitlementSource: "owned_report",
      accessGranted: true,
      isActive: true,
      is_active: true,
      canDownloadPdf: true,
      can_download_pdf: true,
    }),
  });

  assert.equal(mode, "pdf-unlocked");
  assert.equal(canAccessFullReportPdf(mode), true);
});

test("report detail PDF access mode locks free users", async () => {
  const { resolveReportDetailPdfAccessMode, canAccessFullReportPdf } = await loadModule(Date.now() + 12);

  const mode = resolveReportDetailPdfAccessMode({
    gateState: "authed_entitled",
    entitlements: createEntitlements(),
  });

  assert.equal(mode, "pdf-locked");
  assert.equal(canAccessFullReportPdf(mode), false);
});

test("report detail PDF access mode is loading-safe while entitlements resolve", async () => {
  const { resolveReportDetailPdfAccessMode, canAccessFullReportPdf } = await loadModule(Date.now() + 13);

  const mode = resolveReportDetailPdfAccessMode({
    gateState: "authed_loading_entitlements",
    entitlements: null,
  });

  assert.equal(mode, "loading-safe");
  assert.equal(canAccessFullReportPdf(mode), false);
});
