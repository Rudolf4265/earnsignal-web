import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/dashboard/revenue-trend.ts")).href;

async function loadModule(seed = Date.now()) {
  void seed;
  return import(moduleUrl);
}

test("revenue trend view model normalizes and formats chart metadata", async () => {
  const { buildDashboardRevenueTrendViewModel } = await loadModule(Date.now() + 1);
  const result = buildDashboardRevenueTrendViewModel({
    points: [
      { label: "Dec 2025", value: 198000 },
      { label: "Jan 2026", value: 205500 },
      { label: "Feb 2026", value: 215000 },
    ],
  });

  assert.equal(result.hasRenderableChart, true);
  assert.equal(result.latestValueDisplay, "$215,000");
  assert.equal(result.periodLabel, "Dec 2025 to Feb 2026");
  assert.equal(result.movementLabel?.startsWith("Up "), true);
  assert.deepEqual(result.points.map((point) => point.value), [198000, 205500, 215000]);
});

test("revenue trend view model keeps safe fallback for sparse data", async () => {
  const { buildDashboardRevenueTrendViewModel } = await loadModule(Date.now() + 2);
  const result = buildDashboardRevenueTrendViewModel({
    points: [{ label: "", value: 1000 }],
  });

  assert.equal(result.hasRenderableChart, false);
  assert.equal(result.latestValueDisplay, "$1,000");
  assert.equal(result.movementLabel, null);
  assert.equal(result.periodLabel, null);
  assert.deepEqual(result.points, [{ label: "Point 1", value: 1000 }]);
});
