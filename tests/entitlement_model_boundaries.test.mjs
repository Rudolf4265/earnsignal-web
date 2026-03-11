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
    effective_plan_tier: "none",
    entitlement_source: "none",
    access_granted: false,
    access_reason_code: "ENTITLEMENT_REQUIRED",
    billing_required: true,
    plan_tier: "none",
    status: "inactive",
    ...overrides,
  };
}

test("free/unentitled snapshot denies premium actions", async () => {
  const { canGenerateReportFromEntitlement, canDownloadPdfFromEntitlement, hasProEquivalentEntitlement } = await loadModel(Date.now() + 1);
  const value = snapshot();

  assert.equal(canGenerateReportFromEntitlement(value), false);
  assert.equal(canDownloadPdfFromEntitlement(value), false);
  assert.equal(hasProEquivalentEntitlement(value), false);
});

test("paid Pro snapshot allows premium actions", async () => {
  const { canGenerateReportFromEntitlement, canDownloadPdfFromEntitlement, hasProEquivalentEntitlement } = await loadModel(Date.now() + 2);
  const value = snapshot({
    effective_plan_tier: "pro",
    entitlement_source: "stripe",
    access_granted: true,
    access_reason_code: "ACTIVE_SUBSCRIPTION",
    billing_required: false,
    can_generate_report: true,
  });

  assert.equal(canGenerateReportFromEntitlement(value), true);
  assert.equal(canDownloadPdfFromEntitlement(value), true);
  assert.equal(hasProEquivalentEntitlement(value), true);
});

test("admin override snapshot grants paid-equivalent access", async () => {
  const { canGenerateReportFromEntitlement, canDownloadPdfFromEntitlement, hasProEquivalentEntitlement } = await loadModel(Date.now() + 3);
  const value = snapshot({
    effective_plan_tier: "none",
    entitlement_source: "admin_override",
    access_granted: true,
    access_reason_code: "ADMIN_OVERRIDE",
    billing_required: false,
    can_generate_report: true,
  });

  assert.equal(canGenerateReportFromEntitlement(value), true);
  assert.equal(canDownloadPdfFromEntitlement(value), true);
  assert.equal(hasProEquivalentEntitlement(value), true);
});

test("founder paid-equivalent snapshot grants premium access without Stripe source", async () => {
  const { canDownloadPdfFromEntitlement, hasProEquivalentEntitlement } = await loadModel(Date.now() + 4);
  const value = snapshot({
    effective_plan_tier: "founder_creator_report",
    entitlement_source: "founder",
    access_granted: true,
    access_reason_code: "FOUNDER_PROTECTED",
    billing_required: false,
  });

  assert.equal(canDownloadPdfFromEntitlement(value), true);
  assert.equal(hasProEquivalentEntitlement(value), true);
});

test("revoked/expired/future-style override snapshots are denied when access is not granted", async () => {
  const { canGenerateReportFromEntitlement, canDownloadPdfFromEntitlement, hasProEquivalentEntitlement } = await loadModel(Date.now() + 5);
  const revoked = snapshot({
    effective_plan_tier: "pro",
    entitlement_source: "admin_override",
    access_granted: false,
    access_reason_code: "OVERRIDE_REVOKED",
    can_generate_report: true,
    can_download_pdf: true,
  });
  const expired = snapshot({
    effective_plan_tier: "pro",
    entitlement_source: "admin_override",
    access_granted: false,
    access_reason_code: "OVERRIDE_EXPIRED",
    can_generate_report: true,
    can_download_pdf: true,
  });
  const future = snapshot({
    effective_plan_tier: "pro",
    entitlement_source: "admin_override",
    access_granted: false,
    access_reason_code: "OVERRIDE_NOT_ACTIVE_YET",
    can_generate_report: true,
    can_download_pdf: true,
  });

  for (const value of [revoked, expired, future]) {
    assert.equal(canGenerateReportFromEntitlement(value), false);
    assert.equal(canDownloadPdfFromEntitlement(value), false);
    assert.equal(hasProEquivalentEntitlement(value), false);
  }
});

test("canonical deny state wins over permissive legacy aliases", async () => {
  const { resolveEffectivePlanTier, resolveAccessGranted, canGenerateReportFromEntitlement, canDownloadPdfFromEntitlement, hasProEquivalentEntitlement } =
    await loadModel(Date.now() + 6);

  const value = {
    effective_plan_tier: "none",
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

  assert.equal(resolveEffectivePlanTier(value), "none");
  assert.equal(resolveAccessGranted(value), false);
  assert.equal(canGenerateReportFromEntitlement(value), false);
  assert.equal(canDownloadPdfFromEntitlement(value), false);
  assert.equal(hasProEquivalentEntitlement(value), false);
});
