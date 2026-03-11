import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/billing/plan-card.ts")).href;

async function loadModule(seed = Date.now()) {
  return import(`${moduleUrl}?t=${seed}`);
}

test("active Pro plan resolves premium current variant with dark-theme classes", async () => {
  const { buildBillingPlanCardViewModel } = await loadModule(Date.now() + 1);

  const viewModel = buildBillingPlanCardViewModel({
    planId: "pro",
    planLabel: "Pro",
    activePlanTier: "pro",
    isActive: true,
    allowCheckout: true,
  });

  assert.equal(viewModel.isCurrent, true);
  assert.equal(viewModel.variant, "pro_current_active");
  assert.equal(viewModel.ctaLabel, "Pro active");
  assert.equal(viewModel.checkoutDisabled, true);
  assert.equal(viewModel.cardClassName.includes("bg-blue-50"), false);
  assert.equal(viewModel.cardClassName.includes("bg-white"), false);
  assert.equal(viewModel.cardClassName.includes("border-brand-accent-blue"), true);
  assert.equal(viewModel.badgeClassName.includes("text-emerald-100"), true);
});

test("paid-equivalent aliases render as current Pro state", async () => {
  const { buildBillingPlanCardViewModel } = await loadModule(Date.now() + 2);

  const paidEquivalent = buildBillingPlanCardViewModel({
    planId: "pro",
    planLabel: "Pro",
    activePlanTier: "paid_equivalent",
    isActive: true,
    allowCheckout: true,
  });
  const founderEquivalent = buildBillingPlanCardViewModel({
    planId: "pro",
    planLabel: "Pro",
    activePlanTier: "founder_creator_report",
    isActive: true,
    allowCheckout: true,
  });

  assert.equal(paidEquivalent.variant, "pro_current_active");
  assert.equal(founderEquivalent.variant, "pro_current_active");
});

test("free or unentitled state keeps both plans selectable", async () => {
  const { buildBillingPlanCardViewModel } = await loadModule(Date.now() + 3);

  const basic = buildBillingPlanCardViewModel({
    planId: "basic",
    planLabel: "Basic",
    activePlanTier: "none",
    isActive: false,
    allowCheckout: true,
  });
  const pro = buildBillingPlanCardViewModel({
    planId: "pro",
    planLabel: "Pro",
    activePlanTier: "none",
    isActive: false,
    allowCheckout: true,
  });

  assert.equal(basic.variant, "basic_selectable");
  assert.equal(pro.variant, "pro_selectable");
  assert.equal(basic.ctaLabel, "Choose Basic");
  assert.equal(pro.ctaLabel, "Choose Pro");
  assert.equal(basic.checkoutDisabled, false);
  assert.equal(pro.checkoutDisabled, false);
});

test("cta label and disabled semantics stay aligned with current active plan behavior", async () => {
  const { buildBillingPlanCardViewModel } = await loadModule(Date.now() + 4);

  const activeBasic = buildBillingPlanCardViewModel({
    planId: "basic",
    planLabel: "Basic",
    activePlanTier: "basic",
    isActive: true,
    allowCheckout: true,
  });
  const inactiveCurrentPro = buildBillingPlanCardViewModel({
    planId: "pro",
    planLabel: "Pro",
    activePlanTier: "pro",
    isActive: false,
    allowCheckout: true,
  });
  const checkoutBlocked = buildBillingPlanCardViewModel({
    planId: "pro",
    planLabel: "Pro",
    activePlanTier: "none",
    isActive: false,
    allowCheckout: false,
  });

  assert.equal(activeBasic.ctaLabel, "Basic active");
  assert.equal(activeBasic.checkoutDisabled, true);
  assert.equal(inactiveCurrentPro.ctaLabel, "Choose Pro");
  assert.equal(inactiveCurrentPro.checkoutDisabled, false);
  assert.equal(checkoutBlocked.checkoutDisabled, true);
});

test("billing page source no longer includes the legacy light selected-card class", async () => {
  const source = await readFile(path.resolve("app/(app)/app/billing/page.tsx"), "utf8");
  assert.equal(source.includes("bg-blue-50"), false);
});
