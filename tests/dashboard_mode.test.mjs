import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const modeModuleUrl = pathToFileURL(path.resolve("src/lib/dashboard/mode.ts")).href;
const earnModuleUrl = pathToFileURL(path.resolve("src/lib/dashboard/earn-model.ts")).href;
const viewModelModuleUrl = pathToFileURL(path.resolve("src/lib/dashboard/view-model.ts")).href;

async function loadModules(seed = Date.now()) {
  const [mode, earn, viewModel] = await Promise.all([
    import(`${modeModuleUrl}?t=${seed}`),
    import(`${earnModuleUrl}?t=${seed}`),
    import(`${viewModelModuleUrl}?t=${seed}`),
  ]);

  return { ...mode, ...earn, ...viewModel };
}

test("dashboard mode defaults to earn and keeps grow additive in the query string", async () => {
  const { parseDashboardMode, buildDashboardModeSearch } = await loadModules(Date.now() + 1);

  assert.equal(parseDashboardMode(null), "earn");
  assert.equal(parseDashboardMode(undefined), "earn");
  assert.equal(parseDashboardMode("unknown"), "earn");
  assert.equal(parseDashboardMode("grow"), "grow");

  assert.equal(buildDashboardModeSearch(new URLSearchParams(""), "earn"), "");
  assert.equal(buildDashboardModeSearch(new URLSearchParams("foo=bar"), "grow"), "foo=bar&mode=grow");
  assert.equal(buildDashboardModeSearch(new URLSearchParams("mode=grow&foo=bar"), "earn"), "foo=bar");
});

test("earn dashboard model preserves the existing revenue-oriented view model", async () => {
  const { buildDashboardViewModel, buildEarnDashboardModel } = await loadModules(Date.now() + 2);

  const input = {
    kpis: {
      netRevenue: 215000,
      subscribers: 12150,
      stabilityIndex: 88,
    },
    revenueDeltaText: "Up 4.6% month over month.",
    subscriberDeltaText: "Up 1.5% since last month.",
    revenueSparkline: [198000, 205500, 215000],
    subscribersSparkline: [11950, 12050, 12150],
  };

  assert.deepEqual(buildEarnDashboardModel(input), buildDashboardViewModel(input));
});
