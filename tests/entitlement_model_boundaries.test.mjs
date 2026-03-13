import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/entitlements/model.ts")).href;

async function loadModel(seed = Date.now()) {
  return import(`${moduleUrl}?t=${seed}`);
}

function snapshot(overrides = {}) {
  return {
    effective_plan_tier: "free",
    entitlement_source: "none",
    access_granted: false,
    access_reason_code: "ENTITLEMENT_REQUIRED",
    billing_required: true,
    plan_tier: "free",
    status: "inactive",
    ...overrides,
  };
}

test("free snapshot denies paid actions but preserves upload validation access", async () => {
  const { canGenerateReportFromEntitlement, canDownloadPdfFromEntitlement, hasProEquivalentEntitlement, resolveCapability } = await loadModel(
    Date.now() + 1,
  );
  const value = snapshot();

  assert.equal(resolveCapability(value, "canUpload"), true);
  assert.equal(resolveCapability(value, "canValidateUpload"), true);
  assert.equal(canGenerateReportFromEntitlement(value), false);
  assert.equal(canDownloadPdfFromEntitlement(value), false);
  assert.equal(hasProEquivalentEntitlement(value), false);
});

test("report snapshot unlocks owned report access without collapsing into Pro", async () => {
  const { canGenerateReportFromEntitlement, canDownloadPdfFromEntitlement, hasProEquivalentEntitlement, resolveCapability } = await loadModel(
    Date.now() + 2,
  );
  const value = snapshot({
    effective_plan_tier: "report",
    entitlement_source: "owned_report",
    access_granted: true,
    access_reason_code: null,
    billing_required: false,
    can_generate_paid_report: false,
    can_view_owned_report: true,
    can_download_owned_report: true,
    can_view_report_history: true,
    can_access_dashboard_intelligence: true,
  });

  assert.equal(canGenerateReportFromEntitlement(value), false);
  assert.equal(resolveCapability(value, "canViewOwnedReport"), true);
  assert.equal(resolveCapability(value, "canViewReportHistory"), true);
  assert.equal(canDownloadPdfFromEntitlement(value), true);
  assert.equal(hasProEquivalentEntitlement(value), false);
});

test("pro snapshot allows recurring and Pro-only actions", async () => {
  const { canGenerateReportFromEntitlement, canDownloadPdfFromEntitlement, hasProEquivalentEntitlement, resolveCapability } = await loadModel(
    Date.now() + 3,
  );
  const value = snapshot({
    effective_plan_tier: "pro",
    entitlement_source: "stripe",
    access_granted: true,
    access_reason_code: "ACTIVE_SUBSCRIPTION",
    billing_required: false,
  });

  assert.equal(canGenerateReportFromEntitlement(value), true);
  assert.equal(resolveCapability(value, "canAccessRecurringMonitoring"), true);
  assert.equal(canDownloadPdfFromEntitlement(value), true);
  assert.equal(hasProEquivalentEntitlement(value), true);
});

test("explicit override capabilities can still unlock Pro-only access", async () => {
  const { hasProEquivalentEntitlement, resolveCapability } = await loadModel(Date.now() + 4);
  const value = snapshot({
    effective_plan_tier: "free",
    entitlement_source: "admin_override",
    access_granted: true,
    access_reason_code: "ADMIN_OVERRIDE",
    billing_required: false,
    can_access_pro_comparisons_or_future_pro_features: true,
    can_access_recurring_monitoring: true,
  });

  assert.equal(resolveCapability(value, "canAccessRecurringMonitoring"), true);
  assert.equal(hasProEquivalentEntitlement(value), true);
});

test("revoked override snapshots are denied when access is not granted", async () => {
  const { canGenerateReportFromEntitlement, canDownloadPdfFromEntitlement, hasProEquivalentEntitlement } = await loadModel(Date.now() + 5);
  const revoked = snapshot({
    effective_plan_tier: "pro",
    entitlement_source: "admin_override",
    access_granted: false,
    access_reason_code: "OVERRIDE_REVOKED",
    can_generate_report: true,
    can_download_pdf: true,
    can_access_pro_comparisons_or_future_pro_features: true,
  });

  assert.equal(canGenerateReportFromEntitlement(revoked), false);
  assert.equal(canDownloadPdfFromEntitlement(revoked), false);
  assert.equal(hasProEquivalentEntitlement(revoked), false);
});

test("canonical deny state wins over permissive legacy aliases", async () => {
  const { resolveEffectivePlanTier, resolveAccessGranted, canGenerateReportFromEntitlement, canDownloadPdfFromEntitlement, hasProEquivalentEntitlement } =
    await loadModel(Date.now() + 6);

  const value = {
    effective_plan_tier: "free",
    plan_tier: "pro",
    plan: "pro",
    access_granted: false,
    entitled: true,
    is_active: true,
    can_generate_report: true,
    can_download_pdf: true,
    entitlement_source: "admin_override",
    access_reason_code: "ADMIN_OVERRIDE",
    manual_entitlements: [{ plan_tier: "pro", active: true }],
  };

  assert.equal(resolveEffectivePlanTier(value), "free");
  assert.equal(resolveAccessGranted(value), false);
  assert.equal(canGenerateReportFromEntitlement(value), false);
  assert.equal(canDownloadPdfFromEntitlement(value), false);
  assert.equal(hasProEquivalentEntitlement(value), false);
});
