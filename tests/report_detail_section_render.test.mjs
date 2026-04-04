import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const reportDetailPagePath = path.resolve("app/(app)/app/report/[id]/page.tsx");
const audienceSectionPath = path.resolve("app/(app)/app/report/[id]/_components/ReportAudienceGrowthSection.tsx");

test("report detail renders the creator-facing section order after the header", async () => {
  const source = await readFile(reportDetailPagePath, "utf8");

  assert.equal(source.includes("showFullReportContent && wowSummary"), true);
  assert.equal(source.includes('title="Revenue Trend"'), true);
  assert.equal(source.includes('title="Audience Growth"'), true);
  assert.equal(source.includes('title="What to do next"'), true);
  assert.equal(
    source.indexOf("showFullReportContent && wowSummary") < source.indexOf('title="Revenue Trend"'),
    true,
  );
  assert.equal(source.indexOf('title="Revenue Trend"') < source.indexOf('title="Audience Growth"'), true);
  assert.equal(source.indexOf('title="Audience Growth"') < source.indexOf('title="What to do next"'), true);
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

test("audience growth hero is elevated above the smaller cards and source chips", async () => {
  const source = await readFile(audienceSectionPath, "utf8");

  assert.equal(source.includes('data-testid="report-audience-growth-hero"'), true);
  assert.equal(source.indexOf('data-testid="report-audience-growth-hero"') < source.indexOf('data-testid="report-audience-growth-summary"'), true);
  assert.equal(source.indexOf('data-testid="report-audience-growth-hero"') < source.indexOf('data-testid="report-audience-growth-cards"'), true);
});

test("audience growth source chips stay muted and non-interactive", async () => {
  const source = await readFile(audienceSectionPath, "utf8");

  assert.equal(source.includes('data-testid="report-audience-growth-sources"'), true);
  assert.equal(source.includes("cursor-default"), true);
  assert.equal(source.includes("select-none"), true);
  assert.equal(source.includes("Included sources"), true);
});
