import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const modulePath = pathToFileURL(path.resolve("packages/config/src/pricing.ts")).href;

function load(tag) {
  return import(`${modulePath}?t=${tag}`);
}

test("pricing config defines launch plans with stable keys and pricing", async () => {
  const { pricingPlans } = await load(Date.now());

  assert.equal(Array.isArray(pricingPlans), true);
  assert.deepEqual(
    pricingPlans.map((plan) => plan.key),
    ["free", "founder_creator_report", "creator_pro"],
  );

  const free = pricingPlans.find((plan) => plan.key === "free");
  const founder = pricingPlans.find((plan) => plan.key === "founder_creator_report");
  const pro = pricingPlans.find((plan) => plan.key === "creator_pro");

  assert.equal(free?.price, "$0");
  assert.equal(free?.cadence, "forever");

  assert.equal(founder?.price, "$25");
  assert.equal(founder?.anchorPrice, "$49");
  assert.match(founder?.priceNote ?? "", /60 days/i);

  assert.equal(pro?.price, "$39");
  assert.equal(pro?.cadence, "monthly");
});
