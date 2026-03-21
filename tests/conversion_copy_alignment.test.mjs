import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const pricingConfigPath = path.resolve("packages/config/src/pricing.ts");
const marketingPricingPagePath = path.resolve("app/(marketing)/pricing/page.tsx");
const marketingPagePath = path.resolve("app/(marketing)/page.tsx");
const billingPagePath = path.resolve("app/(app)/app/billing/page.tsx");
const gateCalloutsPath = path.resolve("app/(app)/_components/gate-callouts.tsx");

const pricingConfigUrl = pathToFileURL(pricingConfigPath).href;

function loadPricingConfig(tag) {
  return import(`${pricingConfigUrl}?t=${tag}`);
}

// ── Pricing config truth ────────────────────────────────────────────────────

test("pricing config Free plan explicitly states no report access", async () => {
  const { pricingPlans } = await loadPricingConfig(Date.now() + 1);
  const free = pricingPlans.find((p) => p.key === "free");

  assert.equal(typeof free, "object");
  assert.equal(free.features.some((f) => f.toLowerCase().includes("no paid report")), true);
  assert.equal(free.description.toLowerCase().includes("no full report"), true);
});

test("pricing config Report plan leads with diagnosis output, not process", async () => {
  const { pricingPlans } = await loadPricingConfig(Date.now() + 2);
  const report = pricingPlans.find((p) => p.key === "report");

  assert.equal(typeof report, "object");
  assert.equal(report.description.toLowerCase().includes("complete"), true);
  assert.equal(report.features.some((f) => f.toLowerCase().includes("biggest opportunity")), true);
  assert.equal(report.features.some((f) => f.toLowerCase().includes("next")), true);
  assert.equal(report.features.some((f) => f.toLowerCase().includes("pdf")), true);
});

test("pricing config Pro plan surfaces monitoring and comparison as key differentiators", async () => {
  const { pricingPlans } = await loadPricingConfig(Date.now() + 3);
  const pro = pricingPlans.find((p) => p.key === "pro");

  assert.equal(typeof pro, "object");
  // Description leads with the "Everything in Report" framing
  assert.equal(pro.description.toLowerCase().includes("everything in report"), true);
  assert.equal(pro.features.some((f) => f.toLowerCase().includes("comparison")), true);
  assert.equal(pro.features.some((f) => f.toLowerCase().includes("monitoring")), true);
});

test("pricing config Report plan includes platform mix and strengths/risks", async () => {
  const { pricingPlans } = await loadPricingConfig(Date.now() + 4);
  const report = pricingPlans.find((p) => p.key === "report");

  assert.equal(report.features.some((f) => f.toLowerCase().includes("platform mix")), true);
  assert.equal(report.features.some((f) => f.toLowerCase().includes("strengths")), true);
  assert.equal(report.features.some((f) => f.toLowerCase().includes("risks")), true);
});

// ── Pricing page card copy ──────────────────────────────────────────────────

test("pricing page Free card positions itself as pre-purchase validation, not full access", async () => {
  const source = await readFile(marketingPricingPagePath, "utf8");

  assert.equal(source.includes("Full report access not included"), true);
  assert.equal(source.includes("Signal teaser"), true);
  assert.equal(source.includes("The full report requires a paid plan"), true);
});

test("pricing page Report card positions as complete creator business breakdown", async () => {
  const source = await readFile(marketingPricingPagePath, "utf8");

  assert.equal(source.includes("Your complete creator business breakdown"), true);
  assert.equal(source.includes("biggest opportunity, platform risks, and next actions"), true);
  assert.equal(source.includes("PDF included"), true);
});

test("pricing page Report card features name actual report sections", async () => {
  const source = await readFile(marketingPricingPagePath, "utf8");

  assert.equal(source.includes("Executive summary and biggest opportunity"), true);
  assert.equal(source.includes("Platform mix and concentration analysis"), true);
  assert.equal(source.includes("Subscriber momentum and churn signals"), true);
  assert.equal(source.includes("3 prioritized next actions"), true);
});

test("pricing page Pro card leads with 'Everything in Report'", async () => {
  const source = await readFile(marketingPricingPagePath, "utf8");

  assert.equal(source.includes("Everything in Report"), true);
  assert.equal(source.includes("Period-over-period comparisons"), true);
  assert.equal(source.includes("Dashboard intelligence and risk monitoring"), true);
});

test("pricing page comparison table rows reflect actual entitlement boundaries", async () => {
  const source = await readFile(marketingPricingPagePath, "utf8");

  assert.equal(source.includes("Full report and diagnosis"), true);
  assert.equal(source.includes("Report history and comparisons"), true);
  assert.equal(source.includes("Dashboard intelligence"), true);
  assert.equal(source.includes("Signal teaser preview"), true);
  // Stale row names should be gone
  assert.equal(source.includes("Recurring monitoring access"), false);
  assert.equal(source.includes("Pro-only comparisons"), false);
});

test("pricing page workflow is a 3-step flow matching the landing page", async () => {
  const source = await readFile(marketingPricingPagePath, "utf8");

  assert.equal(source.includes("Upload Exports"), true);
  assert.equal(source.includes("Analyze Your Data"), true);
  assert.equal(source.includes("Get Your Report"), true);

  // workflowSteps array must not contain the old 4-step labels
  const stepsStart = source.indexOf("const workflowSteps = [");
  const stepsEnd = source.indexOf("] as const;", stepsStart);
  const stepsBlock = source.slice(stepsStart, stepsEnd);
  assert.equal(stepsBlock.includes("Validate for Free"), false);
  assert.equal(stepsBlock.includes("Buy Report"), false);
  assert.equal(stepsBlock.includes("Get Full Diagnosis"), false);
});

// ── Marketing page copy ─────────────────────────────────────────────────────

test("marketing how-it-works is a 3-step flow, not 4", async () => {
  const source = await readFile(marketingPagePath, "utf8");

  assert.equal(source.includes("Upload your real exports"), true);
  assert.equal(source.includes("Validate free, then buy a report"), true);
  assert.equal(source.includes("Get your full diagnosis"), true);
  // 4th "Data stays yours" step should be gone
  assert.equal(source.includes("Data stays yours"), false);
});

test("marketing how-it-works validate step names the $79 report price", async () => {
  const source = await readFile(marketingPagePath, "utf8");

  assert.equal(source.includes("$79 one-time Report"), true);
});

test("marketing report section pillars map to actual report sections", async () => {
  const source = await readFile(marketingPagePath, "utf8");

  // New pillars matching the actual 6 report sections
  assert.equal(source.includes('"Executive Summary"'), true);
  assert.equal(source.includes('"Biggest Opportunity"'), true);
  assert.equal(source.includes('"Platform Mix"'), true);
  assert.equal(source.includes('"Subscriber Momentum"'), true);
  assert.equal(source.includes('"Strengths & Risks"'), true);
  assert.equal(source.includes('"Next 3 Actions"'), true);

  // Old pillar names must be gone from the reportSectionPillars array
  // (check that the array does not contain them as quoted string literals in that context)
  const pillarsStart = source.indexOf("const reportSectionPillars = [");
  const pillarsEnd = source.indexOf("];", pillarsStart);
  assert.equal(pillarsStart !== -1, true);
  const pillarsBlock = source.slice(pillarsStart, pillarsEnd);
  assert.equal(pillarsBlock.includes("Churn Risk Map"), false);
  assert.equal(pillarsBlock.includes("Revenue Concentration"), false);
  assert.equal(pillarsBlock.includes("Next Best Move"), false);
});

test("marketing how-it-works diagnosis step names all 6 report section outputs", async () => {
  const source = await readFile(marketingPagePath, "utf8");

  // The diagnosis step body should reference what the report covers
  assert.equal(source.includes("biggest opportunity"), true);
  assert.equal(source.includes("platform risk"), true);
  assert.equal(source.includes("subscriber momentum"), true);
  assert.equal(source.includes("strengths"), true);
  assert.equal(source.includes("3 next actions"), true);
});

// ── Billing page in-product copy ────────────────────────────────────────────

test("billing page Report plan summary leads with diagnosis output", async () => {
  const source = await readFile(billingPagePath, "utf8");

  assert.equal(source.includes("One complete creator business report for one upload"), true);
  assert.equal(source.includes("Biggest opportunity"), true);
  assert.equal(source.includes("platform risks"), true);
  assert.equal(source.includes("next actions"), true);
  assert.equal(source.includes("PDF download"), true);
});

test("billing page Report plan highlights include next 3 actions and downloadable PDF", async () => {
  const source = await readFile(billingPagePath, "utf8");

  assert.equal(source.includes("Biggest opportunity and platform risks"), true);
  assert.equal(source.includes("next 3 actions"), true);
  assert.equal(source.includes("Downloadable PDF report"), true);
});

test("billing page Pro plan summary leads with Report inclusion", async () => {
  const source = await readFile(billingPagePath, "utf8");

  assert.equal(source.includes("Everything in Report"), true);
  assert.equal(source.includes("period comparisons"), true);
  assert.equal(source.includes("dashboard intelligence"), true);
});

// ── Gate callouts in-product upgrade copy ──────────────────────────────────

test("not-entitled callout names the actual locked output — biggest opportunity and next actions", async () => {
  const source = await readFile(gateCalloutsPath, "utf8");

  assert.equal(source.includes("biggest opportunity"), true);
  assert.equal(source.includes("next actions"), true);
});

test("not-entitled callout names both upgrade paths — Report and Pro", async () => {
  const source = await readFile(gateCalloutsPath, "utf8");

  assert.equal(source.includes("one-time Report"), true);
  assert.equal(source.includes("Pro"), true);
});

test("not-entitled callout does not use stale generic activation language", async () => {
  const source = await readFile(gateCalloutsPath, "utf8");

  assert.equal(source.includes("activate report access"), false);
  assert.equal(source.includes("does not include this feature"), false);
});

// ── Entitlement truth — no stale messaging ─────────────────────────────────

test("pricing config does not contain stale 'limited dashboard context' language", async () => {
  const source = await readFile(pricingConfigPath, "utf8");

  assert.equal(source.includes("Limited dashboard context"), false);
  assert.equal(source.includes("Report detail context tied to that purchase"), false);
  assert.equal(source.includes("Monitoring-oriented Pro surfaces"), false);
});

test("pricing page does not contain stale 'Not equivalent to Pro monitoring access' language", async () => {
  const source = await readFile(marketingPricingPagePath, "utf8");

  assert.equal(source.includes("Not equivalent to Pro monitoring access"), false);
  assert.equal(source.includes("Recurring monitoring-oriented surfaces"), false);
});

test("billing page does not contain stale one-liner summaries", async () => {
  const source = await readFile(billingPagePath, "utf8");

  assert.equal(source.includes("One purchased report for one upload, with owned report view and PDF download access."), false);
  assert.equal(source.includes("Recurring access for report history, dashboard intelligence, and monitoring-oriented surfaces."), false);
});
