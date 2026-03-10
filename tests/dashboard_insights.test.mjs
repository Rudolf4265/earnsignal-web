import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const insightsModuleUrl = pathToFileURL(path.resolve("src/lib/dashboard/insights.ts")).href;

async function loadModule(seed = Date.now()) {
  return import(`${insightsModuleUrl}?t=${seed}`);
}

test("dashboard insights map supported report signals into up to three cards", async () => {
  const { buildDashboardInsights } = await loadModule(Date.now() + 1);
  const insights = buildDashboardInsights({
    keySignals: [
      "Revenue momentum improved after pricing updates.",
      "Platform concentration risk is elevated this month.",
      "Subscriber activity shifted across cohorts.",
      "Stability variance narrowed in the latest period.",
    ],
  });

  assert.equal(insights.length, 3);
  assert.deepEqual(
    insights.map((insight) => insight.title),
    ["Platform Risk", "Revenue Momentum", "Subscriber Churn Risk"],
  );
});

test("dashboard insights assign positive, warning, and neutral variants deterministically", async () => {
  const { buildDashboardInsights } = await loadModule(Date.now() + 2);
  const insights = buildDashboardInsights({
    keySignals: [
      "Revenue momentum improved in the latest period.",
      "Platform concentration risk is rising on one channel.",
      "Subscriber activity shifted across cohorts.",
    ],
  });

  const byTitle = new Map(insights.map((insight) => [insight.title, insight.variant]));
  assert.equal(byTitle.get("Revenue Momentum"), "positive");
  assert.equal(byTitle.get("Platform Risk"), "warning");
  assert.equal(byTitle.get("Subscriber Churn Risk"), "neutral");
});

test("dashboard insights return empty cards when no supported signal text exists", async () => {
  const { buildDashboardInsights } = await loadModule(Date.now() + 3);
  assert.deepEqual(buildDashboardInsights({ keySignals: [] }), []);
  assert.deepEqual(buildDashboardInsights({ keySignals: ["  ", ""] }), []);
  assert.deepEqual(buildDashboardInsights({ keySignals: null }), []);
});

test("dashboard insights clamp long signal copy for card safety", async () => {
  const { buildDashboardInsights } = await loadModule(Date.now() + 4);
  const longSignal = `Revenue momentum ${"improved ".repeat(80)}across audience segments.`;
  const [first] = buildDashboardInsights({
    keySignals: [longSignal],
  });

  assert.ok(first, "expected one insight card");
  assert.equal(first.body.length <= 220, true);
  assert.equal(first.implication.length <= 180, true);
  assert.equal(first.body.endsWith("..."), true);
});

test("dashboard insights preserve source order for uncategorized items after prioritized picks", async () => {
  const { buildDashboardInsights } = await loadModule(Date.now() + 5);
  const insights = buildDashboardInsights({
    keySignals: [
      "Misc signal B appears first in source.",
      "Revenue momentum improved after pricing updates.",
      "Misc signal A appears second in source.",
      "Platform concentration risk is elevated this month.",
    ],
  });

  assert.equal(insights.length, 3);
  assert.deepEqual(
    insights.map((insight) => insight.body),
    [
      "Platform concentration risk is elevated this month.",
      "Revenue momentum improved after pricing updates.",
      "Misc signal B appears first in source.",
    ],
  );
});
