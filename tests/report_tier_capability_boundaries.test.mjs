import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/entitlements/model.ts")).href;

function load(seed) {
  return import(`${moduleUrl}?t=${seed}`);
}

function reportSnapshot(overrides = {}) {
  return {
    effective_plan_tier: "report",
    entitlement_source: "owned_report",
    access_granted: true,
    access_reason_code: null,
    billing_required: false,
    can_view_owned_report: true,
    can_download_owned_report: true,
    ...overrides,
  };
}

function proSnapshot(overrides = {}) {
  return {
    effective_plan_tier: "pro",
    entitlement_source: "stripe",
    access_granted: true,
    access_reason_code: "ACTIVE_SUBSCRIPTION",
    billing_required: false,
    ...overrides,
  };
}

// ── Report tier: denied capabilities ─────────────────────────────────────────

test("Report tier: canViewReportHistory is false by default (no history access)", async () => {
  const { resolveCapability } = await load(Date.now() + 1);
  assert.equal(resolveCapability(reportSnapshot(), "canViewReportHistory"), false);
});

test("Report tier: canAccessDashboardIntelligence is false by default (no dashboard intelligence)", async () => {
  const { resolveCapability } = await load(Date.now() + 2);
  assert.equal(resolveCapability(reportSnapshot(), "canAccessDashboardIntelligence"), false);
});

test("Report tier: canAccessRecurringMonitoring is false (no monitoring)", async () => {
  const { resolveCapability } = await load(Date.now() + 3);
  assert.equal(resolveCapability(reportSnapshot(), "canAccessRecurringMonitoring"), false);
});

test("Report tier: canAccessProComparisonsOrFutureProFeatures is false (no comparisons)", async () => {
  const { resolveCapability } = await load(Date.now() + 4);
  assert.equal(resolveCapability(reportSnapshot(), "canAccessProComparisonsOrFutureProFeatures"), false);
});

test("Report tier: hasProEquivalentEntitlement is false", async () => {
  const { hasProEquivalentEntitlement } = await load(Date.now() + 5);
  assert.equal(hasProEquivalentEntitlement(reportSnapshot()), false);
});

// ── Report tier: permitted capabilities ──────────────────────────────────────

test("Report tier: canViewOwnedReport is true (core report access)", async () => {
  const { resolveCapability } = await load(Date.now() + 6);
  assert.equal(resolveCapability(reportSnapshot(), "canViewOwnedReport"), true);
});

test("Report tier: canDownloadOwnedReport is true (PDF download)", async () => {
  const { canDownloadPdfFromEntitlement } = await load(Date.now() + 7);
  assert.equal(canDownloadPdfFromEntitlement(reportSnapshot()), true);
});

test("Report tier: canViewWowSummary is true (report section access)", async () => {
  const { resolveCapability } = await load(Date.now() + 8);
  assert.equal(resolveCapability(reportSnapshot(), "canViewWowSummary"), true);
});

test("Report tier: canViewOpportunity is true (report section access)", async () => {
  const { resolveCapability } = await load(Date.now() + 9);
  assert.equal(resolveCapability(reportSnapshot(), "canViewOpportunity"), true);
});

test("Report tier: canViewStrengthsRisks is true (report section access)", async () => {
  const { resolveCapability } = await load(Date.now() + 10);
  assert.equal(resolveCapability(reportSnapshot(), "canViewStrengthsRisks"), true);
});

test("Report tier: canViewNextActions is true (report section access)", async () => {
  const { resolveCapability } = await load(Date.now() + 11);
  assert.equal(resolveCapability(reportSnapshot(), "canViewNextActions"), true);
});

// ── Pro tier: all capabilities retained ──────────────────────────────────────

test("Pro tier: canViewReportHistory is true (history access retained)", async () => {
  const { resolveCapability } = await load(Date.now() + 12);
  assert.equal(resolveCapability(proSnapshot(), "canViewReportHistory"), true);
});

test("Pro tier: canAccessDashboardIntelligence is true (dashboard access retained)", async () => {
  const { resolveCapability } = await load(Date.now() + 13);
  assert.equal(resolveCapability(proSnapshot(), "canAccessDashboardIntelligence"), true);
});

test("Pro tier: canAccessRecurringMonitoring is true", async () => {
  const { resolveCapability } = await load(Date.now() + 14);
  assert.equal(resolveCapability(proSnapshot(), "canAccessRecurringMonitoring"), true);
});

test("Pro tier: canAccessProComparisonsOrFutureProFeatures is true", async () => {
  const { resolveCapability } = await load(Date.now() + 15);
  assert.equal(resolveCapability(proSnapshot(), "canAccessProComparisonsOrFutureProFeatures"), true);
});

test("Pro tier: hasProEquivalentEntitlement is true", async () => {
  const { hasProEquivalentEntitlement } = await load(Date.now() + 16);
  assert.equal(hasProEquivalentEntitlement(proSnapshot()), true);
});

// ── Matrix source-of-truth assertions ────────────────────────────────────────

test("capability matrix: Report tier denied capabilities are false in source", async () => {
  const source = await (await import("node:fs/promises")).readFile(
    path.resolve("src/lib/entitlements/model.ts"),
    "utf8",
  );

  const reportBlockStart = source.indexOf("report: {");
  const reportBlockEnd = source.indexOf("  },", reportBlockStart);
  const reportBlock = source.slice(reportBlockStart, reportBlockEnd);

  assert.equal(reportBlock.includes("canViewReportHistory: false"), true);
  assert.equal(reportBlock.includes("canAccessDashboardIntelligence: false"), true);
  assert.equal(reportBlock.includes("canAccessRecurringMonitoring: false"), true);
  assert.equal(reportBlock.includes("canAccessProComparisonsOrFutureProFeatures: false"), true);
});

test("capability matrix: Pro tier retains all history and intelligence capabilities as true in source", async () => {
  const source = await (await import("node:fs/promises")).readFile(
    path.resolve("src/lib/entitlements/model.ts"),
    "utf8",
  );

  const proBlockStart = source.indexOf("pro: {");
  const proBlockEnd = source.indexOf("  },", proBlockStart);
  const proBlock = source.slice(proBlockStart, proBlockEnd);

  assert.equal(proBlock.includes("canViewReportHistory: true"), true);
  assert.equal(proBlock.includes("canAccessDashboardIntelligence: true"), true);
  assert.equal(proBlock.includes("canAccessRecurringMonitoring: true"), true);
  assert.equal(proBlock.includes("canAccessProComparisonsOrFutureProFeatures: true"), true);
});

// ── Explicit override still works for provisioned Report users ────────────────
// (Admin-granted or specially provisioned Report users can still receive these
//  capabilities via explicit backend fields — the matrix is the default, not a ceiling)

test("Report tier: explicit can_view_report_history=true override is honoured", async () => {
  const { resolveCapability } = await load(Date.now() + 17);
  const overridden = reportSnapshot({ can_view_report_history: true });
  assert.equal(resolveCapability(overridden, "canViewReportHistory"), true);
});

test("Report tier: explicit can_access_dashboard_intelligence=true override is honoured", async () => {
  const { resolveCapability } = await load(Date.now() + 18);
  const overridden = reportSnapshot({ can_access_dashboard_intelligence: true });
  assert.equal(resolveCapability(overridden, "canAccessDashboardIntelligence"), true);
});
