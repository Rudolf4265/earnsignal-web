import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const reportDetailPagePath = path.resolve("app/(app)/app/report/[id]/page.tsx");
const audienceSectionPath = path.resolve("app/(app)/app/report/[id]/_components/ReportAudienceGrowthSection.tsx");

test("report detail renders the creator-facing section order after the header", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  const sectionOrder = [
    'title="Key findings"',
    'title="Revenue overview"',
    'title="Platform concentration"',
    'title="Subscriber structure"',
    'title="Revenue concentration"',
    'title="Audience signals"',
    'title="Strengths, risks, and opportunities"',
    'title="Opportunities"',
    'title="Action plan"',
    'title="Methodology"',
  ];

  for (const section of sectionOrder) {
    assert.equal(source.includes(section), true, `Missing section heading: ${section}`);
  }

  for (let index = 0; index < sectionOrder.length - 1; index += 1) {
    assert.equal(source.indexOf(sectionOrder[index]) < source.indexOf(sectionOrder[index + 1]), true);
  }
});

test("report detail removes supporting details, what changed, and old recommended actions sections from the creator page", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes("Supporting Detail"), false);
  assert.equal(source.includes('data-testid="report-what-changed-section"'), false);
  assert.equal(source.includes('data-testid="report-subscriber-health-unlocked"'), false);
  assert.equal(source.includes('data-testid="report-revenue-outlook-unlocked"'), false);
  assert.equal(source.includes("Recommended Actions"), false);
});

test("report detail uses the new revenue interpretation and next actions surfaces", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes('data-testid="report-revenue-interpretation"'), true);
  assert.equal(source.includes('data-testid="report-what-to-do-next"'), true);
  assert.equal(source.includes('report-next-action-primary'), true);
  assert.equal(source.includes('report-next-action-secondary'), true);
});

test("report detail keeps report access gating and PDF controls wired", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes("const canAccessFullPdf = isFounder || canAccessFullReportPdf(pdfAccessMode);"), true);
  assert.equal(source.includes('pdfAccessMode === "pdf-unlocked"'), true);
  assert.equal(source.includes('"Open PDF"'), true);
  assert.equal(source.includes('"Download PDF"'), true);
  assert.equal(source.includes("PDF not ready yet"), true);
  assert.equal(source.includes('title="Unable to load PDF"'), true);
  assert.equal(source.includes('!isFounder && proSectionGate.wowSummary === "report-locked" && freeTeaserModel'), true);
});

test("report detail defines dedicated running and failed report states and removes the old PDF unavailable copy", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes('data-testid="report-running"'), true);
  assert.equal(source.includes('data-testid="report-failed"'), true);
  assert.equal(source.includes("Building your report"), true);
  assert.equal(source.includes("These checkpoints are general progress updates rather than exact backend stages."), true);
  assert.equal(source.includes("You do not need to upload the files again."), true);
  assert.equal(source.includes("PDF unavailable"), false);
  assert.equal(source.toLowerCase().includes("avaliable"), false);
});

test("report detail hero uses a restrained at-a-glance row instead of a KPI card grid", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes('data-testid="report-hero-at-a-glance"'), true);
  assert.equal(source.includes('data-testid="report-executive-summary-card"'), true);
  assert.equal(source.includes('data-testid="report-kpi-strip"'), false);
});

test("report detail only renders one revenue overview heading and keeps opportunities plus methodology present", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");
  const revenueOverviewMatches = source.match(/title="Revenue overview"/g) ?? [];

  assert.equal(revenueOverviewMatches.length, 1);
  assert.equal(source.includes('testId="report-opportunities"'), true);
  assert.equal(source.includes('testId="report-methodology"'), true);
});

test("audience growth component is reduced to summary copy, rows, and muted source chips", async () => {
  const source = await readFile(audienceSectionPath, "utf8");

  assert.equal(source.includes('data-testid="report-audience-growth-summary"'), true);
  assert.equal(source.includes('data-testid="report-audience-growth-rows"'), true);
  assert.equal(source.includes('data-testid="report-audience-growth-empty"'), true);
  assert.equal(source.includes('data-testid="report-audience-growth-cards"'), false);
  assert.equal(source.includes('data-testid="report-audience-growth-sources"'), true);
  assert.equal(source.includes("cursor-default"), true);
  assert.equal(source.includes("select-none"), true);
  assert.equal(source.includes("Included sources"), true);
  assert.equal(source.includes("Instagram"), false);
  assert.equal(source.includes("TikTok"), false);
});

test("report detail keeps audience scope truthful and renders a restrained empty state when no audience source is present", async () => {
  const pageSource = await readFile(reportDetailPagePath, "utf8");

  assert.equal(pageSource.includes("function buildAudienceEmptyState"), true);
  assert.equal(pageSource.includes("No audience-growth source was included in this report."), true);
  assert.equal(pageSource.includes("Audience signals are not available for the included sources yet."), true);
  assert.equal(pageSource.includes("<ReportAudienceGrowthSection model={audienceSectionModel} emptyMessage={audienceEmptyState} />"), true);
});

test("report detail source does not contain unsupported multi-source fallback phrasing", async () => {
  const source = await readFile(reportDetailPagePath, "utf8").then((value) => value.toLowerCase());

  assert.equal(source.includes("more than one source working"), false);
  assert.equal(source.includes("spread across a few sources"), false);
  assert.equal(source.includes("each one is softening"), false);
});

test("report detail methodology delegates legacy coverage copy and mixed source roles to shared helpers", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes("buildReportSourceRoleLine"), true);
  assert.equal(source.includes("rewriteReportSnapshotCoverageNote"), true);
});

test("report detail only fetches artifact json after the report is complete", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");
  const completionGuardIndex = source.indexOf("if (!isCompletedReportStatus(report.status)) {");
  const artifactFetchIndex = source.indexOf("const artifactRaw = await fetchReportArtifactJson(report.artifactJsonUrl);");

  assert.notEqual(completionGuardIndex, -1);
  assert.notEqual(artifactFetchIndex, -1);
  assert.equal(completionGuardIndex < artifactFetchIndex, true);
});
