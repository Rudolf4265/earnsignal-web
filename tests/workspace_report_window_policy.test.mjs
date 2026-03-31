import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/workspace/report-window-policy.ts")).href;

async function loadModule(seed = Date.now()) {
  return import(`${moduleUrl}?t=${seed}`);
}

test("report tier with 3 months or less keeps the direct run path", async () => {
  const { resolveWorkspaceReportWindowPolicy } = await loadModule(Date.now() + 1);

  const result = resolveWorkspaceReportWindowPolicy({
    reportModeAllowed: "snapshot",
    maxReportMonths: 3,
    canUseFullHistoryWindow: false,
    coverageMonths: 3,
    coverageStart: "2026-01",
    coverageEnd: "2026-03",
    monthsPresent: ["2026-01", "2026-02", "2026-03"],
  });

  assert.equal(result.requiresWindowChooser, false);
  assert.equal(result.directRunMode, null);
  assert.equal(result.runCtaLabel, "Run Report");
  assert.equal(result.latestSnapshotWindow?.startMonth, "2026-01");
  assert.equal(result.latestSnapshotWindow?.endMonth, "2026-03");
});

test("report tier with more than 3 months requires the chooser and exposes the latest snapshot plus upgrade path", async () => {
  const { resolveWorkspaceReportWindowPolicy } = await loadModule(Date.now() + 2);

  const result = resolveWorkspaceReportWindowPolicy({
    reportModeAllowed: "snapshot",
    maxReportMonths: 3,
    canUseFullHistoryWindow: false,
    coverageMonths: 6,
    coverageStart: "2025-10",
    coverageEnd: "2026-03",
    monthsPresent: ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"],
  });

  assert.equal(result.requiresWindowChooser, true);
  assert.equal(result.hasCoverageBeyondPlanLimit, true);
  assert.equal(result.runCtaLabel, "Choose analysis window");
  assert.equal(result.latestSnapshotWindow?.startMonth, "2026-01");
  assert.equal(result.latestSnapshotWindow?.endMonth, "2026-03");
  assert.equal(result.snapshotWindowOptions.length, 4);
  assert.equal(result.showUpgradeToPro, true);
});

test("pro tier with more than 3 months gets a direct full-history path", async () => {
  const { resolveWorkspaceReportWindowPolicy } = await loadModule(Date.now() + 3);

  const result = resolveWorkspaceReportWindowPolicy({
    reportModeAllowed: "continuous",
    maxReportMonths: null,
    canUseFullHistoryWindow: true,
    coverageMonths: 8,
    coverageStart: "2025-08",
    coverageEnd: "2026-03",
    monthsPresent: ["2025-08", "2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"],
  });

  assert.equal(result.requiresWindowChooser, false);
  assert.equal(result.directRunMode, "full_history");
  assert.equal(result.runCtaLabel, "Run Full-history Report");
  assert.equal(result.showUpgradeToPro, false);
});

test("report tier does not over-gate duplicate and unordered month inputs", async () => {
  const { resolveWorkspaceReportWindowPolicy } = await loadModule(Date.now() + 4);

  const result = resolveWorkspaceReportWindowPolicy({
    reportModeAllowed: "snapshot",
    maxReportMonths: 3,
    canUseFullHistoryWindow: false,
    coverageMonths: 4,
    coverageStart: "2026-01",
    coverageEnd: "2026-03",
    monthsPresent: ["2026-03", "2026-01", "2026-02", "2026-01"],
  });

  assert.equal(result.coverageMonths, 3);
  assert.equal(result.requiresWindowChooser, false);
  assert.equal(result.hasCoverageBeyondPlanLimit, false);
  assert.equal(result.latestSnapshotWindow?.startMonth, "2026-01");
  assert.equal(result.latestSnapshotWindow?.endMonth, "2026-03");
});

test("report tier with sparse unique months does not trigger incorrect >3 month chooser gating", async () => {
  const { resolveWorkspaceReportWindowPolicy } = await loadModule(Date.now() + 5);

  const result = resolveWorkspaceReportWindowPolicy({
    reportModeAllowed: "snapshot",
    maxReportMonths: 3,
    canUseFullHistoryWindow: false,
    coverageMonths: 6,
    coverageStart: "2026-01",
    coverageEnd: "2026-06",
    monthsPresent: ["2026-06", "2026-01", "2026-03"],
  });

  assert.equal(result.coverageMonths, 3);
  assert.equal(result.requiresWindowChooser, false);
  assert.equal(result.hasCoverageBeyondPlanLimit, false);
  assert.equal(result.latestSnapshotWindow, null);
  assert.deepEqual(result.snapshotWindowOptions, []);
});
