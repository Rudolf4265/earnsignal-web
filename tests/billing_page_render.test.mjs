import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const billingPagePath = path.resolve("app/(app)/app/billing/page.tsx");

test("billing page copy stays product-facing and avoids internal entitlement phrasing", async () => {
  const source = await readFile(billingPagePath, "utf8");

  // Current access section
  assert.equal(source.includes("Current plan:"), true);
  assert.equal(source.includes("Admin-granted access"), true);
  assert.equal(source.includes("Subscription access"), true);
  assert.equal(source.includes("Resolution:"), true);
  assert.equal(source.includes("Update billing to restore premium access."), true);
  assert.equal(source.includes("reports used this period"), true);

  // Manage subscription CTA and supporting copy
  assert.equal(source.includes("Manage billing, payment method, renewal, or cancellation."), true);
  assert.equal(source.includes("billing-manage-subscription-btn"), true);

  // State-aware upgrade CTAs for free/report users
  assert.equal(source.includes("Upgrade to Pro"), true);
  assert.equal(source.includes("Get your report"), true);

  // Checkout error handling
  assert.equal(source.includes("Checkout unavailable"), true);

  // Pricing plan wiring
  assert.equal(source.includes("formatPricingPlanPrice(reportPlan)"), true);
  assert.equal(source.includes("reportPlan.badge"), true);

  // Plan summaries
  assert.equal(source.includes("One complete business diagnosis from your workspace data"), true);
  assert.equal(source.includes("Everything in Report, plus ongoing visibility as your business evolves"), true);

  // Free card
  assert.equal(source.includes("billing-plan-card-free"), true);
  assert.equal(source.includes("Set up your workspace and validate your data."), true);
  assert.equal(source.includes("Free plan active"), true);

  // Comparison table includes Free column
  assert.equal(source.includes("Included at a glance"), true);
  assert.equal(source.includes("Upload data"), true);
  assert.equal(source.includes("row.free"), true);

  // Things that must NOT appear
  assert.equal(source.includes("Feature access:"), false);
  assert.equal(source.includes("Access reason:"), false);
  assert.equal(source.includes("generated this period"), false);
  assert.equal(source.includes("Manage subscription is unavailable"), false);
  assert.equal(source.includes("Stripe checkout configuration required"), false);
  // Old placeholder text is gone
  assert.equal(source.includes("Subscription management appears here when you have an active or canceling Pro subscription."), false);
  // Old redundant marketing block is gone
  assert.equal(source.includes("Report gives you ownership. Pro gives you continuity."), false);
});

test("Free card is rendered before Report and Pro cards", async () => {
  const source = await readFile(billingPagePath, "utf8");

  // Free card has a static testid; Report/Pro use template literals `billing-plan-card-${plan.id}`
  const freeIdx = source.indexOf("billing-plan-card-free");
  // The template literal pattern is the canonical identifier for the dynamic cards
  const dynamicCardIdx = source.indexOf('billing-plan-card-${plan.id}');

  assert.equal(freeIdx !== -1, true, "Free card testid must be present");
  assert.equal(dynamicCardIdx !== -1, true, "Dynamic plan card template literal must be present");
  assert.equal(freeIdx < dynamicCardIdx, true, "Free card must appear before the dynamic Report/Pro cards in source");

  // All three plan ids must be present in the plans array definition
  assert.equal(source.includes('"report"'), true, "report plan id must be defined");
  assert.equal(source.includes('"pro"'), true, "pro plan id must be defined");
});

test("Manage subscription CTA uses backend portal flow, not hardcoded URL", async () => {
  const source = await readFile(billingPagePath, "utf8");

  // Must call the real API function
  assert.equal(source.includes("createBillingPortalSession"), true);
  // Must not hardcode Stripe portal URLs
  assert.equal(source.includes("billing.stripe.com"), false);
  assert.equal(source.includes("stripe.com/billing"), false);
});

test("Portal session failure surfaces user feedback", async () => {
  const source = await readFile(billingPagePath, "utf8");

  assert.equal(source.includes("portalError"), true);
  assert.equal(source.includes("Subscription management unavailable"), true);
});

test("Comparison table includes Free, Report, and Pro columns", async () => {
  const source = await readFile(billingPagePath, "utf8");

  // All three column headers present
  assert.equal(source.includes('"Free"'), true);
  assert.equal(source.includes('"Report"'), true);
  assert.equal(source.includes('"Pro"'), true);

  // row.free is rendered
  assert.equal(source.includes("row.free"), true);
  assert.equal(source.includes("row.report"), true);
  assert.equal(source.includes("row.pro"), true);

  // Key comparison rows present
  assert.equal(source.includes("Upload data"), true);
  assert.equal(source.includes("Ongoing monitoring"), true);
  assert.equal(source.includes("Full-history analysis"), true);
});

test("Admin override users do not see Stripe manage-subscription for non-stripe source", async () => {
  const source = await readFile(billingPagePath, "utf8");

  // The isAdminOverride guard must be present on the upgrade CTAs
  assert.equal(source.includes("isAdminOverride"), true);
  // Admin override check must gate the free and report upgrade paths
  const adminGuardInFreeBlock = source.includes("isFreeUser && !isAdminOverride");
  const adminGuardInReportBlock = source.includes("isReportUser && !isAdminOverride");
  assert.equal(adminGuardInFreeBlock, true, "Free user upgrade path must be gated by !isAdminOverride");
  assert.equal(adminGuardInReportBlock, true, "Report user upgrade path must be gated by !isAdminOverride");
});
