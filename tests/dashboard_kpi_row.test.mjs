import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const kpiRowModuleUrl = pathToFileURL(path.resolve("src/lib/dashboard/kpi-row.ts")).href;

async function loadModule(seed = Date.now()) {
  return import(`${kpiRowModuleUrl}?t=${seed}`);
}

test("dashboard KPI row omits unavailable values instead of emitting placeholder cards", async () => {
  const { buildDashboardKpiItems } = await loadModule(Date.now() + 1);

  const result = buildDashboardKpiItems({
    netRevenue: 245000,
    subscribers: null,
    stabilityIndex: null,
    revenueDeltaText: "Up 6.2% month over month.",
    subscriberDeltaText: null,
  });

  assert.deepEqual(result, [
    {
      id: "net-revenue",
      label: "Net Revenue",
      value: "$245,000",
      changeLabel: "Up 6.2% month over month.",
    },
  ]);
});

test("dashboard KPI row caps the MVP strip at three reliable cards", async () => {
  const { buildDashboardKpiItems } = await loadModule(Date.now() + 2);

  const result = buildDashboardKpiItems({
    netRevenue: 245000,
    subscribers: 18250,
    stabilityIndex: 88,
    revenueDeltaText: "Up 6.2% month over month.",
    subscriberDeltaText: "Up 1.8% since last report.",
    stabilityLabel: "Reduced confidence",
    maxItems: 5,
  });

  assert.equal(result.length, 3);
  assert.equal(result[0]?.label, "Net Revenue");
  assert.equal(result[1]?.label, "Subscribers");
  assert.equal(result[2]?.label, "Stability Index");
  assert.equal(result[2]?.value, "88/100");
});
