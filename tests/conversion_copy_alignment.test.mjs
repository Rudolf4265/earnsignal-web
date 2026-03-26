import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const pricingConfigPath = path.resolve("packages/config/src/pricing.ts");
const marketingPagePath = path.resolve("app/(marketing)/page.tsx");
const billingPagePath = path.resolve("app/(app)/app/billing/page.tsx");
const gateCalloutsPath = path.resolve("app/(app)/_components/gate-callouts.tsx");

const pricingConfigUrl = pathToFileURL(pricingConfigPath).href;

function loadPricingConfig(tag) {
  return import(`${pricingConfigUrl}?t=${tag}`);
}

test("pricing config reflects the canonical Free / Report / Pro product ladder", async () => {
  const { pricingPlans } = await loadPricingConfig(Date.now() + 1);
  const free = pricingPlans.find((plan) => plan.key === "free");
  const report = pricingPlans.find((plan) => plan.key === "report");
  const pro = pricingPlans.find((plan) => plan.key === "pro");

  assert.equal(free?.description.includes("No full report included."), true);
  assert.equal(report?.description.includes("One combined creator business report from your staged data sources."), true);
  assert.equal(report?.features.includes("Owned report access and downloadable PDF"), true);
  assert.equal(pro?.description.includes("Everything in Report, plus report history, comparisons, and ongoing intelligence across fresh workspace runs."), true);
  assert.equal(pro?.features.includes("You keep purchased reports while Pro adds ongoing value"), true);
});

test("marketing page leads with present-state product truth", async () => {
  const source = await readFile(marketingPagePath, "utf8");

  assert.equal(source.includes("Turn your creator exports"), true);
  assert.equal(source.includes("into one clear business report."), true);
  assert.equal(source.includes("No spreadsheet stitching"), true);
  assert.equal(source.includes("Upload real exports"), true);
  assert.equal(source.includes("One combined report"), true);
  assert.equal(source.includes("$79 one-time Report"), true);
  assert.equal(source.includes("private to your workspace"), true);
  assert.equal(source.includes("creator operating system"), false);
  assert.equal(source.includes("ongoing BI"), false);
});

test("billing page explains workspace-based reports and ownership versus Pro value", async () => {
  const source = await readFile(billingPagePath, "utf8");

  assert.equal(source.includes("One combined creator business report from your staged workspace sources."), true);
  assert.equal(source.includes("Owned report access and downloadable PDF"), true);
  assert.equal(source.includes("You keep purchased reports while Pro adds ongoing value"), true);
  assert.equal(source.includes("Ownership and subscription value"), true);
  assert.equal(source.includes("You keep any report you purchase."), true);
  assert.equal(source.includes("One complete creator business report for one upload"), false);
  assert.equal(source.includes("Full diagnosis for one upload"), false);
});

test("gate callout names the actual upgrade choices without generic activation language", async () => {
  const source = await readFile(gateCalloutsPath, "utf8");

  assert.equal(source.includes("Buy a one-time Report to keep this report"), true);
  assert.equal(source.includes("ongoing history and comparison value"), true);
  assert.equal(source.includes("activate report access"), false);
});
