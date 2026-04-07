import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/billing/subscription-state.ts")).href;

async function loadModule(seed = Date.now()) {
  return import(`${moduleUrl}?t=${seed}`);
}

test("active Pro subscription exposes manage subscription state", async () => {
  const { buildSubscriptionStateViewModel } = await loadModule(Date.now() + 1);

  const value = buildSubscriptionStateViewModel({
    effectivePlanTier: "pro",
    accessGranted: true,
    entitlementSource: "stripe",
    status: "active",
    cancelAtPeriodEnd: false,
    currentPeriodEnd: "2026-05-01T00:00:00Z",
    stripeCustomerId: "cus_123",
    stripeSubscriptionId: "sub_123",
  });

  assert.equal(value.stateLabel, "Active");
  assert.equal(value.showManageSubscription, true);
  assert.equal(value.manageSubscriptionLabel, "Manage subscription");
});

test("canceling Pro subscription keeps access through the period end", async () => {
  const { buildSubscriptionStateViewModel } = await loadModule(Date.now() + 2);

  const value = buildSubscriptionStateViewModel({
    effectivePlanTier: "pro",
    accessGranted: true,
    entitlementSource: "stripe",
    status: "active",
    cancelAtPeriodEnd: true,
    currentPeriodEnd: "2026-05-01T00:00:00Z",
    stripeCustomerId: "cus_123",
    stripeSubscriptionId: "sub_123",
  });

  assert.equal(value.stateLabel, "Canceling at period end");
  assert.equal(value.description?.includes("Pro remains active through"), true);
  assert.equal(value.showManageSubscription, true);
});

test("expired Stripe subscription still exposes management when a Stripe subscription record exists", async () => {
  const { buildSubscriptionStateViewModel } = await loadModule(Date.now() + 3);

  const value = buildSubscriptionStateViewModel({
    effectivePlanTier: "free",
    accessGranted: false,
    entitlementSource: "stripe",
    status: "canceled",
    cancelAtPeriodEnd: false,
    currentPeriodEnd: "2026-04-01T00:00:00Z",
    stripeCustomerId: "cus_123",
    stripeSubscriptionId: "sub_123",
  });

  assert.equal(value.stateLabel, "Canceled");
  assert.equal(value.showManageSubscription, true);
});

test("report and free states do not show misleading subscription UI", async () => {
  const { buildSubscriptionStateViewModel } = await loadModule(Date.now() + 4);

  const report = buildSubscriptionStateViewModel({
    effectivePlanTier: "report",
    accessGranted: true,
    entitlementSource: "owned_report",
    status: "active",
    cancelAtPeriodEnd: null,
    currentPeriodEnd: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  });
  const free = buildSubscriptionStateViewModel({
    effectivePlanTier: "free",
    accessGranted: false,
    entitlementSource: null,
    status: "inactive",
    cancelAtPeriodEnd: null,
    currentPeriodEnd: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  });

  assert.equal(report.stateLabel, "Report owned");
  assert.equal(report.showManageSubscription, false);
  assert.equal(free.stateLabel, "Free");
  assert.equal(free.showManageSubscription, false);
});

test("stripe state without a subscription id does not show misleading manage UI", async () => {
  const { buildSubscriptionStateViewModel } = await loadModule(Date.now() + 5);

  const value = buildSubscriptionStateViewModel({
    effectivePlanTier: "pro",
    accessGranted: true,
    entitlementSource: "stripe",
    status: "active",
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    stripeCustomerId: "cus_123",
    stripeSubscriptionId: null,
  });

  assert.equal(value.showManageSubscription, false);
});
