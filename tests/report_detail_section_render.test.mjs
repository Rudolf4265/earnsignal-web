import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const reportDetailPagePath = path.resolve("app/(app)/app/report/[id]/page.tsx");

test("report detail includes unlocked rendering branches for Pro-gated sections", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes("showSubscriberHealthContent ? ("), true);
  assert.equal(source.includes('data-testid="report-subscriber-health-unlocked"'), true);

  assert.equal(source.includes("showGrowthRecommendationsContent ? ("), true);
  assert.equal(source.includes('data-testid="report-growth-recommendations-unlocked"'), true);

  assert.equal(source.includes("showRevenueOutlookContent ? ("), true);
  assert.equal(source.includes('data-testid="report-revenue-outlook-unlocked"'), true);

  assert.equal(source.includes("showPlatformRiskExplanationContent ? ("), true);
  assert.equal(source.includes('data-testid="report-platform-risk-explanation-unlocked"'), true);
});

test("report detail includes locked upsell rendering for Basic users", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes('testId="report-subscriber-health-locked"'), true);
  assert.equal(source.includes("Unlock subscriber health insights"), true);

  assert.equal(source.includes('testId="report-growth-recommendations-locked"'), true);
  assert.equal(source.includes("Unlock growth recommendations"), true);

  assert.equal(source.includes('testId="report-revenue-outlook-locked"'), true);
  assert.equal(source.includes("Unlock revenue forecasts"), true);

  assert.equal(source.includes('testId="report-platform-risk-explanation-locked"'), true);
  assert.equal(source.includes("Unlock platform risk analysis"), true);

  assert.equal(source.includes('href="/app/billing"'), true);
  assert.equal(source.includes("Upgrade to Pro"), true);
});

test("report detail includes loading-safe placeholders for unresolved entitlement state", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes('testId="report-subscriber-health-loading"'), true);
  assert.equal(source.includes('testId="report-growth-recommendations-loading"'), true);
  assert.equal(source.includes('testId="report-revenue-outlook-loading"'), true);
  assert.equal(source.includes('testId="report-platform-risk-explanation-loading"'), true);
});

test("report detail keeps Pro content conditional to avoid locked-state leaks", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes("const showSubscriberHealthContent = canRenderReportDetailProContent(proSectionGate.subscriberHealth);"), true);
  assert.equal(source.includes("const showGrowthRecommendationsContent = canRenderReportDetailProContent(proSectionGate.growthRecommendations);"), true);
  assert.equal(source.includes("const showRevenueOutlookContent = canRenderReportDetailProContent(proSectionGate.revenueOutlook);"), true);
  assert.equal(source.includes("const showPlatformRiskExplanationContent = canRenderReportDetailProContent(proSectionGate.platformRiskExplanation);"), true);
});

test("report detail keeps active PDF actions in the Pro-only branch", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes('pdfAccessMode === "pro-unlocked"'), true);
  assert.equal(source.includes('canAccessPdf ? ('), true);
  assert.equal(source.includes('"Open PDF"'), true);
  assert.equal(source.includes('"Download PDF"'), true);
});

test("report detail includes locked PDF export state for Basic users", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes('data-testid="report-pdf-locked"'), true);
  assert.equal(source.includes("Full PDF Export."), true);
  assert.equal(source.includes("Upgrade to Pro to open and download the full creator earnings report PDF."), true);
  assert.equal(source.includes("Upgrade to Pro"), true);
});

test("report detail includes loading-safe PDF placeholder while entitlements resolve", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes('data-testid="report-pdf-loading"'), true);
  assert.equal(source.includes("Checking plan access for full PDF export..."), true);
});

test("report detail blocks PDF handler execution and avoids artifact URL leakage outside Pro access", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes("if (!state.report || !canAccessFullPdf || !canAccessPdf || pdfLoading)"), true);
  assert.equal(source.includes("if (!state.report || !canAccessFullPdf || !canAccessPdf || downloadLoading)"), true);
  assert.equal(source.includes("href={state.report.artifactUrl}"), false);
  assert.equal(source.includes("href={state.report.pdfUrl}"), false);
});

test("report detail preserves Pro artifact-missing PDF unavailable state", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes('pdfAccessMode === "pro-unlocked" ? ('), true);
  assert.equal(source.includes("PDF unavailable"), true);
});
