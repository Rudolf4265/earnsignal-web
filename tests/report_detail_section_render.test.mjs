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
  assert.equal(source.includes('!isFounder && proSectionGate.wowSummary === "report-locked" && freeTeaserModel'), true);
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
  assert.equal(source.includes('data-testid="report-audience-growth-cards"'), false);
  assert.equal(source.includes('data-testid="report-audience-growth-sources"'), true);
  assert.equal(source.includes("cursor-default"), true);
  assert.equal(source.includes("select-none"), true);
  assert.equal(source.includes("Included sources"), true);
});
