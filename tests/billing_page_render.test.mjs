import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const billingPagePath = path.resolve("app/(app)/app/billing/page.tsx");

test("billing page copy stays product-facing and avoids internal entitlement phrasing", async () => {
  const source = await readFile(billingPagePath, "utf8");

  assert.equal(source.includes("Current plan:"), true);
  assert.equal(source.includes("Admin-granted access"), true);
  assert.equal(source.includes("Subscription access"), true);
  assert.equal(source.includes("Update billing to restore premium access."), true);
  assert.equal(source.includes("reports used this period"), true);
  assert.equal(source.includes("Subscription management appears here when you have an active Pro subscription."), true);
  assert.equal(source.includes("Checkout unavailable"), true);
  assert.equal(source.includes("One focused 3-month creator business diagnostic from your staged workspace sources."), true);
  assert.equal(source.includes("Everything in Report, plus full-history analysis, report history, comparisons, and ongoing intelligence across fresh workspace runs."), true);
  assert.equal(source.includes("Report gives you ownership. Pro gives you continuity."), true);
  assert.equal(source.includes("Included at a glance"), true);
  assert.equal(source.includes("Feature access:"), false);
  assert.equal(source.includes("Access reason:"), false);
  assert.equal(source.includes("generated this period"), false);
  assert.equal(source.includes("Manage subscription is unavailable"), false);
  assert.equal(source.includes("Stripe checkout configuration required"), false);
});
