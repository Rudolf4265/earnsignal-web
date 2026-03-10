import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const viewModelModuleUrl = pathToFileURL(path.resolve("src/lib/dashboard/view-model.ts")).href;

async function loadModule(seed = Date.now()) {
  void seed;
  return import(viewModelModuleUrl);
}

test("dashboard view-model maps creator health and revenue snapshot displays", async () => {
  const { buildDashboardViewModel } = await loadModule(Date.now() + 1);
  const result = buildDashboardViewModel({
    kpis: {
      netRevenue: 215000,
      subscribers: 12150,
      stabilityIndex: 88,
    },
    revenueDeltaText: "Up 4.6% month over month.",
    subscriberDeltaText: "Up 1.5% since last month.",
    revenueSparkline: [198000, 205500, 215000],
    subscribersSparkline: [11950, 12050, 12150],
  });

  assert.equal(result.creatorHealth.score, 88);
  assert.equal(result.creatorHealth.title, "Your creator health score is 88/100.");
  assert.equal(result.creatorHealth.subtitle, "This score updates from your latest completed report.");

  assert.equal(result.revenueSnapshot.revenueDisplay, "$215,000");
  assert.equal(result.revenueSnapshot.revenueDeltaText, "Up 4.6% month over month.");
  assert.equal(result.revenueSnapshot.subscribersDisplay, "12,150");
  assert.equal(result.revenueSnapshot.subscriberDeltaText, "Up 1.5% since last month.");
  assert.deepEqual(result.revenueSnapshot.revenueSparkline, [198000, 205500, 215000]);
  assert.deepEqual(result.revenueSnapshot.subscribersSparkline, [11950, 12050, 12150]);
});

test("dashboard view-model keeps safe fallbacks when metrics are missing", async () => {
  const { buildDashboardViewModel } = await loadModule(Date.now() + 2);
  const result = buildDashboardViewModel({
    kpis: {
      netRevenue: null,
      subscribers: null,
      stabilityIndex: null,
    },
    revenueDeltaText: "",
    subscriberDeltaText: "   ",
    revenueSparkline: null,
    subscribersSparkline: undefined,
  });

  assert.equal(result.creatorHealth.score, null);
  assert.equal(result.creatorHealth.title, "Your health score will appear after your next report.");
  assert.equal(result.creatorHealth.subtitle, "Run a report to unlock a personalized health snapshot.");
  assert.equal(result.revenueSnapshot.revenueDisplay, "$--");
  assert.equal(result.revenueSnapshot.revenueDeltaText, null);
  assert.equal(result.revenueSnapshot.subscribersDisplay, "--");
  assert.equal(result.revenueSnapshot.subscriberDeltaText, null);
  assert.equal(result.revenueSnapshot.revenueSparkline, null);
  assert.equal(result.revenueSnapshot.subscribersSparkline, null);
});

test("dashboard view-model clamps score and drops non-renderable sparkline inputs", async () => {
  const { buildDashboardViewModel } = await loadModule(Date.now() + 3);
  const result = buildDashboardViewModel({
    kpis: {
      netRevenue: 1000,
      subscribers: 25,
      stabilityIndex: 140,
    },
    revenueSparkline: [100, Number.NaN, 300],
    subscribersSparkline: [12],
  });

  assert.equal(result.creatorHealth.score, 100);
  assert.deepEqual(result.revenueSnapshot.revenueSparkline, [100, 300]);
  assert.equal(result.revenueSnapshot.subscribersSparkline, null);
});
