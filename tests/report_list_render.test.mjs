import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const reportPagePath = path.resolve("app/(app)/app/report/page.tsx");
const listModelPath = path.resolve("src/lib/report/list-model.ts");
const listModelUrl = pathToFileURL(listModelPath).href;

async function loadListModel(seed = Date.now()) {
  return import(`${listModelUrl}?t=${seed}`);
}

test("report list model gives report users purchased-report framing without continuity affordances", async () => {
  const { buildReportListExperienceModel } = await loadListModel(Date.now() + 1);

  const model = buildReportListExperienceModel({
    entitlements: {
      effectivePlanTier: "report",
      accessGranted: true,
      canViewOwnedReport: true,
      canViewReportHistory: false,
      canAccessProComparisonsOrFutureProFeatures: false,
    },
    reportCount: 2,
  });

  assert.equal(model.kind, "purchased_reports");
  assert.equal(model.sectionTitle, "Purchased Reports");
  assert.equal(model.sectionDescription, "Showing 2 purchased reports.");
  assert.equal(model.continuityBody, null);
  assert.equal(
    model.upgradePrompt,
    "You own these reports. Pro connects them with history, comparisons, and ongoing intelligence.",
  );
  assert.equal(model.primaryActionLabel, "Open Report");
  assert.equal(model.showSourceSummary, false);
});

test("report list model gives pro users report-history framing", async () => {
  const { buildReportListExperienceModel } = await loadListModel(Date.now() + 2);

  const model = buildReportListExperienceModel({
    entitlements: {
      effectivePlanTier: "pro",
      accessGranted: true,
      canViewOwnedReport: true,
      canViewReportHistory: true,
      canAccessProComparisonsOrFutureProFeatures: true,
    },
    reportCount: 3,
  });

  assert.equal(model.kind, "report_history");
  assert.equal(model.sectionTitle, "Report History");
  assert.equal(model.sectionDescription, "Showing 3 reports in history.");
  assert.equal(
    model.continuityBody,
    "Connected history across eligible reports and fresh Pro runs, with room for comparisons and ongoing intelligence.",
  );
  assert.equal(model.upgradePrompt, null);
  assert.equal(model.primaryActionLabel, "Open Report");
  assert.equal(model.showSourceSummary, true);
});

test("report list model preserves free-user framing", async () => {
  const { buildReportListExperienceModel } = await loadListModel(Date.now() + 3);

  const model = buildReportListExperienceModel({
    entitlements: {
      effectivePlanTier: "free",
      accessGranted: false,
      canViewOwnedReport: false,
      canViewReportHistory: false,
      canAccessProComparisonsOrFutureProFeatures: false,
    },
    reportCount: 0,
  });

  assert.equal(model.kind, "free");
  assert.equal(model.sectionTitle, "Recent Reports");
  assert.equal(model.sectionDescription, "No reports to display yet.");
  assert.equal(model.continuityBody, null);
  assert.equal(model.upgradePrompt, null);
});

test("reports page source renders purchased-vs-history framing and keeps open-report access", async () => {
  const source = await readFile(reportPagePath, "utf8");
  const listModelSource = await readFile(listModelPath, "utf8");

  assert.equal(source.includes("buildReportListExperienceModel"), true);
  assert.equal(listModelSource.includes("Purchased Reports"), true);
  assert.equal(listModelSource.includes("Report History"), true);
  assert.equal(listModelSource.includes("You own these reports. Pro connects them with history, comparisons, and ongoing intelligence."), true);
  assert.equal(
    listModelSource.includes("Connected history across eligible reports and fresh Pro runs, with room for comparisons and ongoing intelligence."),
    true,
  );
  assert.equal(source.includes("reportListExperience.showSourceSummary"), true);
  assert.equal(source.includes('row.analysisWindowLabel ?? "Latest available"'), true);
  assert.equal(source.includes("reportListExperience.primaryActionLabel"), true);
  assert.equal(source.includes('data-testid="report-list-continuity-framing"'), true);
});
