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
  assert.equal(source.includes('testId="report-subscriber-health-notice"'), true);
  assert.equal(source.includes('testId="report-revenue-outlook-notice"'), true);

  assert.equal(source.includes("showPlatformRiskExplanationContent ? ("), true);
  assert.equal(source.includes('data-testid="report-platform-risk-explanation-unlocked"'), true);
  assert.equal(source.includes('data-testid="report-what-changed-section"'), true);
  assert.equal(source.includes('testId="report-what-changed-notice"'), true);
  assert.equal(source.includes('testId="report-what-changed-improved"'), true);
  assert.equal(source.includes('testId="report-what-changed-worsened"'), true);
  assert.equal(source.includes('testId="report-what-changed-watch-next"'), true);
  assert.equal(source.includes('title="Audience & Growth Signals"'), true);
  assert.equal(source.includes('description="Based on your available Instagram, TikTok, and YouTube audience data."'), true);
  assert.equal(source.includes("<ReportAudienceGrowthSection model={presentation.audienceGrowth} />"), true);
});

test("report detail includes locked upsell rendering for Basic users", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes('testId="report-subscriber-health-locked"'), true);
  assert.equal(source.includes("Unlock subscriber health insights"), true);

  assert.equal(source.includes('testId="report-growth-recommendations-locked"'), true);
  assert.equal(source.includes("Unlock recommended actions"), true);

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

  assert.equal(source.includes("const showContinuityModules = canAccessDebugPayload;"), true);
  assert.equal(source.includes("includeContinuitySignals: showContinuityModules"), true);
  assert.equal(source.includes("const showSubscriberHealthContent = isFounder || canRenderReportDetailProContent(proSectionGate.subscriberHealth);"), true);
  assert.equal(source.includes("const showGrowthRecommendationsContent = isFounder || canRenderReportDetailProContent(proSectionGate.growthRecommendations);"), true);
  assert.equal(source.includes("const showRevenueOutlookContent = isFounder || canRenderReportDetailProContent(proSectionGate.revenueOutlook);"), true);
  assert.equal(source.includes("const showPlatformRiskExplanationContent = isFounder || canRenderReportDetailProContent(proSectionGate.platformRiskExplanation);"), true);
});

test("report detail adds a single owned snapshot explainer and hides continuity framing for Report users", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes('data-testid="report-owned-snapshot-banner"'), true);
  assert.equal(
    source.includes("This report is a purchased snapshot. Upgrade to Pro for history, comparisons, and ongoing intelligence."),
    true,
  );
  assert.equal(source.includes("showFullReportContent && !showContinuityModules ? ("), true);
  assert.equal(source.includes("showContinuityModules && presentation.displayContext.sourceContributionLine ? ("), true);
  assert.equal(source.includes('const revenueSectionTitle = showContinuityModules ? "Revenue and Trend" : "Revenue Snapshot";'), true);
  assert.equal(source.includes('const revenueSectionDescription = showContinuityModules'), true);
});

test("report detail keeps comparison modules behind continuity access", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes("{showContinuityModules ? ("), true);
  assert.equal(source.includes("presentation.whatChanged.comparisonAvailable ? ("), true);
  assert.equal(source.includes('data-testid="report-what-changed-section"'), true);
  assert.equal(source.includes('<span className="font-medium text-brand-text-muted">Period comparison:</span>{" "}'), true);
});

test("report detail renders truth notices and metric badges for limited states", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes("function TruthNotice"), true);
  assert.equal(source.includes('testId="report-hero-truth-notice"'), true);
  assert.equal(source.includes("metric.stateLabel"), true);
  assert.equal(source.includes("presentation.recommendations[0].stateLabel"), true);
  assert.equal(source.includes("card.stateLabel"), true);
});

test("report detail header renders source framing and included platform chips", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes('import { buildReportFraming, formatIncludedSourceCountLabel } from "@/src/lib/report/source-labeling";'), true);
  assert.equal(source.includes("const reportFraming = useMemo("), true);
  assert.equal(source.includes("const sourceCountLabel = useMemo("), true);
  assert.equal(source.includes('data-testid="report-source-count"'), true);
  assert.equal(source.includes('data-testid={state.report.reportKind === "single-source" ? "report-single-source-framing" : "report-combined-framing"}'), true);
  assert.equal(source.includes('data-testid="report-platform-chips"'), true);
  assert.equal(source.includes("state.report.platformsIncluded.map((platform) => ("), true);
});

test("report detail keeps active PDF actions in the Pro-only branch", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes("const canAccessFullPdf = isFounder || canAccessFullReportPdf(pdfAccessMode);"), true);
  assert.equal(source.includes('pdfAccessMode === "pdf-unlocked"'), true);
  assert.equal(source.includes('canAccessPdf ? ('), true);
  assert.equal(source.includes('"Open PDF"'), true);
  assert.equal(source.includes('"Download PDF"'), true);
});

test("report detail includes locked PDF export state for Basic users", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes('data-testid="report-pdf-locked"'), true);
  assert.equal(source.includes("Full PDF Export."), true);
  assert.equal(source.includes("Report or Pro access is required to open and download this creator earnings report PDF."), true);
  assert.equal(source.includes("View plans"), true);
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

  assert.equal(source.includes('pdfAccessMode === "pdf-unlocked" ? ('), true);
  assert.equal(source.includes("PDF unavailable"), true);
});

test("report detail gates raw artifact debug payload behind Pro access", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes("const canAccessDebugPayload = useMemo(() => isFounder || hasProEquivalentEntitlement(entitlements), [entitlements, isFounder]);"), true);
  assert.equal(source.includes("canAccessDebugPayload ? ("), true);
  assert.equal(source.includes('data-testid="report-debug-accordion"'), true);
  // The debug leak message ("Debug payload view is available with Pro access.") must NOT be shown
  // to standard users — the accordion is only rendered for founder/pro, nothing is shown otherwise.
  assert.equal(source.includes("Debug payload view is available with Pro access."), false);
});

test("report detail suppresses founder paywalls and renders retry instead of upgrade CTA on gated API responses", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes("const showFullReportContent = isFounder || canRenderReportDetailReportContent(proSectionGate.wowSummary);"), true);
  assert.equal(source.includes('!isFounder && proSectionGate.wowSummary === "report-locked" && freeTeaserModel'), true);
  assert.equal(source.includes('state.view === "entitlement_required" && !isFounder'), true);
  assert.equal(source.includes('data-testid="report-founder-override-retry"'), true);
  assert.equal(source.includes("Founder override was detected, but this report request still returned a gated response."), true);
  assert.equal(source.includes("Go to Billing"), true);
});
