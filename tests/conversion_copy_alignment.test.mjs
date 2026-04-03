import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const pricingConfigPath = path.resolve("packages/config/src/pricing.ts");
const marketingPagePath = path.resolve("app/(marketing)/page.tsx");
const marketingSectionsPath = path.resolve("app/(marketing)/_components/marketing-sections.tsx");
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

  assert.equal(free?.description.includes("No report included."), true);
  assert.equal(
    report?.description.includes(
      "One complete business diagnosis from your workspace data",
    ),
    true,
  );
  assert.equal(report?.features.includes("Focused 3-month analysis window"), true);
  assert.equal(report?.features.includes("Owned access and downloadable PDF"), true);
  assert.equal(
    pro?.description.includes(
      "Everything in Report, plus ongoing access to track how your business changes",
    ),
    true,
  );
  assert.equal(pro?.features.includes("Full-history analysis across eligible uploads"), true);
  assert.equal(pro?.features.includes("Track how your business evolves over time"), true);
});

test("marketing page leads with present-state product truth", async () => {
  const [pageSource, sectionsSource] = await Promise.all([
    readFile(marketingPagePath, "utf8"),
    readFile(marketingSectionsPath, "utf8"),
  ]);

  assert.equal(pageSource.includes("Patreon, Substack, YouTube, Instagram, and TikTok"), true);
  assert.equal(pageSource.includes("clear, private business diagnosis"), true);
  assert.equal(pageSource.includes("No spreadsheet stitching"), true);
  assert.equal(pageSource.includes("Stop guessing what&apos;s driving your income."), true);
  assert.equal(pageSource.includes("$79 one-time Report"), true);
  assert.equal(sectionsSource.includes("Built around the platforms your business runs on"), true);
  assert.equal(sectionsSource.includes("No new tools. No new workflows. Just your existing data."), true);
  assert.equal(sectionsSource.includes("Support is currently limited to specific export formats by platform."), true);
  assert.equal(sectionsSource.includes('platform: "Snapchat"'), true);
  assert.equal(sectionsSource.includes('format: "Coming soon"'), true);
  assert.equal(sectionsSource.includes("Expanding platform support"), true);
  assert.equal(pageSource.includes("creator operating system"), false);
  assert.equal(pageSource.includes("ongoing BI"), false);
  assert.equal(pageSource.includes("upload anything"), false);
  assert.equal(pageSource.includes("exports you already have"), false);
  assert.equal(sectionsSource.includes("Upload your exports. See the patterns public tools cannot surface."), false);
});

test("billing page explains workspace-based reports and ownership versus Pro value", async () => {
  const source = await readFile(billingPagePath, "utf8");

  assert.equal(source.includes("One complete business diagnosis from your workspace data"), true);
  assert.equal(source.includes("Focused 3-month analysis window"), true);
  assert.equal(source.includes("Owned access and downloadable PDF"), true);
  assert.equal(
    source.includes(
      "Everything in Report, plus ongoing access to track how your business changes",
    ),
    true,
  );
  assert.equal(source.includes("Full-history analysis across eligible uploads"), true);
  assert.equal(source.includes("Report gives you ownership. Pro gives you continuity."), true);
  assert.equal(source.includes("Ongoing dashboard monitoring"), true);
  assert.equal(source.includes("Track how your business evolves over time"), true);
  assert.equal(source.includes("Included at a glance"), true);
  assert.equal(source.includes("Full report"), true);
  assert.equal(source.includes("Ongoing monitoring"), true);
  assert.equal(source.includes("One complete creator business report for one upload"), false);
  assert.equal(source.includes("Full diagnosis for one upload"), false);
});

test("gate callout names the actual upgrade choices without generic activation language", async () => {
  const source = await readFile(gateCalloutsPath, "utf8");

  assert.equal(source.includes("Buy a one-time Report to keep this report"), true);
  assert.equal(source.includes("ongoing history and comparison value"), true);
  assert.equal(source.includes("activate report access"), false);
});
