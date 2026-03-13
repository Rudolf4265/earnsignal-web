import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const modulePath = pathToFileURL(path.resolve("packages/config/src/pricing.ts")).href;

function load(tag) {
  return import(`${modulePath}?t=${tag}`);
}

test("pricing config defines the canonical Free / Report / Pro ladder", async () => {
  const { pricingPlans } = await load(Date.now());

  assert.equal(Array.isArray(pricingPlans), true);
  assert.deepEqual(
    pricingPlans.map((plan) => plan.key),
    ["free", "report", "pro"],
  );

  const free = pricingPlans.find((plan) => plan.key === "free");
  const report = pricingPlans.find((plan) => plan.key === "report");
  const pro = pricingPlans.find((plan) => plan.key === "pro");

  assert.equal(free?.price, "$0");
  assert.equal(free?.cadence, "forever");

  assert.equal(report?.price, "$79");
  assert.equal(report?.cadence, "one_time");
  assert.equal(report?.badge, "One-time");

  assert.equal(pro?.price, "$59");
  assert.equal(pro?.cadence, "monthly");
});
