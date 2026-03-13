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

test("legacy report aliases render as current Report state, not Pro", async () => {
  const { buildBillingPlanCardViewModel } = await loadModule(Date.now() + 2);

  const legacyReport = buildBillingPlanCardViewModel({
    planId: "report",
    planLabel: "Report",
    activePlanTier: "founder_creator_report",
    isActive: true,
    allowCheckout: true,
  });

  assert.equal(legacyReport.variant, "report_current");
});

test("free state keeps report and pro plans selectable", async () => {
  const { buildBillingPlanCardViewModel } = await loadModule(Date.now() + 3);

  const report = buildBillingPlanCardViewModel({
    planId: "report",
    planLabel: "Report",
    activePlanTier: "free",
    isActive: false,
    allowCheckout: true,
  });
  const pro = buildBillingPlanCardViewModel({
    planId: "pro",
    planLabel: "Pro",
    activePlanTier: "free",
    isActive: false,
    allowCheckout: true,
  });

  assert.equal(report.variant, "report_selectable");
  assert.equal(pro.variant, "pro_selectable");
  assert.equal(report.ctaLabel, "Choose Report");
  assert.equal(pro.ctaLabel, "Choose Pro");
  assert.equal(report.checkoutDisabled, false);
  assert.equal(pro.checkoutDisabled, false);
});

test("cta label and disabled semantics stay aligned with current active plan behavior", async () => {
  const { buildBillingPlanCardViewModel, formatPlanLabel } = await loadModule(Date.now() + 4);

  const activeReport = buildBillingPlanCardViewModel({
    planId: "report",
    planLabel: "Report",
    activePlanTier: "report",
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
    activePlanTier: "free",
    isActive: false,
    allowCheckout: false,
  });

  assert.equal(activeReport.ctaLabel, "Report active");
  assert.equal(activeReport.checkoutDisabled, true);
  assert.equal(inactiveCurrentPro.ctaLabel, "Choose Pro");
  assert.equal(inactiveCurrentPro.checkoutDisabled, false);
  assert.equal(checkoutBlocked.checkoutDisabled, true);
  assert.equal(formatPlanLabel("free"), "Free");
  assert.equal(formatPlanLabel("founder_creator_report"), "Report");
  assert.equal(formatPlanLabel("paid_equivalent"), "Pro");
});

test("billing page source no longer includes the legacy light selected-card class", async () => {
  const source = await readFile(path.resolve("app/(app)/app/billing/page.tsx"), "utf8");
  assert.equal(source.includes("bg-blue-50"), false);
});
