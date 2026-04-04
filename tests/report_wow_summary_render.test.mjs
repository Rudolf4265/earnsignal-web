import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const wowSummaryPath = path.resolve("app/(app)/app/report/[id]/_components/ReportWowSummary.tsx");

test("report wow summary leads with executive summary before the KPI strip", async () => {
  const source = await readFile(wowSummaryPath, "utf8");

  assert.equal(source.includes('data-testid="report-executive-summary-card"'), true);
  assert.equal(source.includes('data-testid="report-kpi-strip"'), true);
  assert.equal(source.indexOf("ExecutiveSummaryCard") < source.indexOf("KpiStripSection"), true);
});

test("report wow summary renders the biggest risk and opportunity cards", async () => {
  const source = await readFile(wowSummaryPath, "utf8");

  assert.equal(source.includes('data-testid="wow-biggest-risk"'), true);
  assert.equal(source.includes('data-testid="wow-biggest-opportunity"'), true);
});

test("report wow summary renders compact income risk and momentum tiles", async () => {
  const source = await readFile(wowSummaryPath, "utf8");

  assert.equal(source.includes('testId="wow-income-risk"'), true);
  assert.equal(source.includes('testId="wow-momentum"'), true);
});
