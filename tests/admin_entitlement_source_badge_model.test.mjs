import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/admin/entitlement-source-badge.ts")).href;

test("source badge mapping covers known source values", async () => {
  const { resolveEntitlementSourceBadgeModel } = await import(`${moduleUrl}?t=${Date.now()}-known`);

  const stripe = resolveEntitlementSourceBadgeModel({ source: "stripe" });
  const override = resolveEntitlementSourceBadgeModel({ source: "admin_override" });
  const trial = resolveEntitlementSourceBadgeModel({ source: "trial" });
  const none = resolveEntitlementSourceBadgeModel({ source: "none" });
  const founder = resolveEntitlementSourceBadgeModel({ source: "admin_override", accessReasonCode: "founder_protected" });

  assert.equal(stripe.kind, "stripe");
  assert.equal(stripe.label, "Stripe");
  assert.equal(stripe.className.includes("sky"), true);

  assert.equal(override.kind, "admin_override");
  assert.equal(override.label, "Admin Override");
  assert.equal(override.className.includes("emerald"), true);

  assert.equal(founder.kind, "founder_protected");
  assert.equal(founder.label, "Founder");
  assert.equal(founder.className.includes("violet"), true);

  assert.equal(trial.kind, "trial");
  assert.equal(trial.label, "Trial");
  assert.equal(trial.className.includes("amber"), true);

  assert.equal(none.kind, "none");
  assert.equal(none.label, "Free / None");
  assert.equal(none.className.includes("slate"), true);
});

test("source badge mapping has safe unknown fallback", async () => {
  const { resolveEntitlementSourceBadgeModel } = await import(`${moduleUrl}?t=${Date.now()}-unknown`);
  const unknown = resolveEntitlementSourceBadgeModel({ source: "custom_source" });
  const missing = resolveEntitlementSourceBadgeModel({ source: null });

  assert.equal(unknown.kind, "unknown");
  assert.equal(unknown.label, "Custom Source");
  assert.equal(unknown.className.includes("slate"), true);

  assert.equal(missing.kind, "unknown");
  assert.equal(missing.label, "Unknown Source");
});
