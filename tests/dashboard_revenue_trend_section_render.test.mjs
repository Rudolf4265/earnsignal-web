import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const revenueTrendSectionPath = path.resolve("app/(app)/app/_components/dashboard/RevenueTrendSection.tsx");
const revenueTrendChartPath = path.resolve("app/(app)/app/_components/dashboard/RevenueTrendChart.tsx");

test("revenue trend section renders a dedicated chart state", async () => {
  const source = await readFile(revenueTrendSectionPath, "utf8");
  const chartSource = await readFile(revenueTrendChartPath, "utf8");

  assert.equal(source.includes("trend.hasRenderableChart"), true);
  assert.equal(source.includes('data-testid="dashboard-revenue-trend-ready"'), true);
  assert.equal(chartSource.includes('data-testid="dashboard-revenue-trend-chart"'), true);
  assert.equal(chartSource.includes('aria-label="Revenue trend chart"'), true);
});

test("revenue trend section keeps intentional missing-data fallback", async () => {
  const source = await readFile(revenueTrendSectionPath, "utf8");

  assert.equal(source.includes('data-testid="dashboard-revenue-trend-empty"'), true);
  assert.equal(source.includes("Charts appear once data is connected"), true);
  assert.equal(source.includes("Latest narrative signal"), true);
});

test("revenue trend section includes loading skeleton state", async () => {
  const source = await readFile(revenueTrendSectionPath, "utf8");

  assert.equal(source.includes('data-testid="dashboard-revenue-trend-loading"'), true);
  assert.equal(source.includes("<SkeletonBlock"), true);
});
