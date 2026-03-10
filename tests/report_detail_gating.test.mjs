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

test("report detail gating centralizes Pro-tier resolution through canonical helper", async () => {
  const source = await readFile(reportDetailGatingPath, "utf8");

  assert.equal(source.includes('import { isProPlan } from "../dashboard/action-cards";'), true);
  assert.equal(source.includes('return entitlements.isActive && isProPlan(entitlements) ? "pro-unlocked" : "pro-locked";'), true);
});

test("report detail gating defines loading-safe handling for unresolved entitlement states", async () => {
  const source = await readFile(reportDetailGatingPath, "utf8");

  assert.equal(source.includes('gateState === "session_loading"'), true);
  assert.equal(source.includes('gateState === "authed_loading_entitlements"'), true);
  assert.equal(source.includes('gateState === "entitlements_error"'), true);
  assert.equal(source.includes("entitlements === null"), true);
  assert.equal(source.includes('return "loading-safe";'), true);
});

test("report detail gating maps all required sections and enforces non-leak guard", async () => {
  const source = await readFile(reportDetailGatingPath, "utf8");

  assert.equal(source.includes('subscriberHealth: proMode'), true);
  assert.equal(source.includes('growthRecommendations: proMode'), true);
  assert.equal(source.includes('revenueOutlook: proMode'), true);
  assert.equal(source.includes('platformRiskExplanation: proMode'), true);
  assert.equal(source.includes('return mode === "pro-unlocked";'), true);
});

test("report detail PDF access mode unlocks only for Pro entitlements", async () => {
  const { resolveReportDetailPdfAccessMode, canAccessFullReportPdf } = await loadModule(Date.now() + 10);

  const mode = resolveReportDetailPdfAccessMode({
    gateState: "authed_entitled",
    entitlements: createEntitlements({ plan: "pro", plan_tier: "pro", planTier: "pro", isActive: true }),
  });

  assert.equal(mode, "pro-unlocked");
  assert.equal(canAccessFullReportPdf(mode), true);
});

test("report detail PDF access mode locks Basic users", async () => {
  const { resolveReportDetailPdfAccessMode, canAccessFullReportPdf } = await loadModule(Date.now() + 11);

  const mode = resolveReportDetailPdfAccessMode({
    gateState: "authed_entitled",
    entitlements: createEntitlements({ plan: "basic", plan_tier: "basic", planTier: "basic", isActive: true }),
  });

  assert.equal(mode, "pro-locked");
  assert.equal(canAccessFullReportPdf(mode), false);
});

test("report detail PDF access mode is loading-safe while entitlements resolve", async () => {
  const { resolveReportDetailPdfAccessMode, canAccessFullReportPdf } = await loadModule(Date.now() + 12);

  const mode = resolveReportDetailPdfAccessMode({
    gateState: "authed_loading_entitlements",
    entitlements: null,
  });

  assert.equal(mode, "loading-safe");
  assert.equal(canAccessFullReportPdf(mode), false);
});
