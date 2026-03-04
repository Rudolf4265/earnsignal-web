import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";

const modelModuleUrl = pathToFileURL(path.resolve("src/lib/report/report-artifact-model.ts")).href;

async function loadModel(seed = Date.now()) {
  return import(`${modelModuleUrl}?t=${seed}`);
}

test("normalizeArtifactToReportModel handles executive_summary with sections", async () => {
  const { normalizeArtifactToReportModel } = await loadModel(Date.now() + 1);
  const model = normalizeArtifactToReportModel({
    report_id: "rep_1",
    schema_version: "2026-01",
    created_at: "2026-03-01T00:00:00Z",
    executive_summary: {
      paragraphs: ["Revenue rose 10% month over month."],
      kpis: { net_revenue: "$120k" },
    },
    sections: [
      {
        title: "Top Risks",
        bullets: ["High churn in segment A", "Price sensitivity in segment B"],
      },
    ],
  });

  assert.equal(model.reportId, "rep_1");
  assert.equal(model.schemaVersion, "2026-01");
  assert.equal(model.executiveSummaryParagraphs[0], "Revenue rose 10% month over month.");
  assert.equal(model.kpis.netRevenue, "$120k");
  assert.equal(model.sections.length, 1);
  assert.deepEqual(model.sections[0].bullets, ["High churn in segment A", "Price sensitivity in segment B"]);
});

test("normalizeArtifactToReportModel extracts KPI values from top-level or executive_summary.kpis", async () => {
  const { normalizeArtifactToReportModel } = await loadModel(Date.now() + 2);

  const topLevel = normalizeArtifactToReportModel({
    kpis: { net_revenue: "$99k", subscribers: 1200, stability_index: 0.84, churn_velocity: "-0.02" },
  });

  assert.equal(topLevel.kpis.netRevenue, "$99k");
  assert.equal(topLevel.kpis.subscribers, "1200");
  assert.equal(topLevel.kpis.stabilityIndex, "0.84");
  assert.equal(topLevel.kpis.churnVelocity, "-0.02");

  const executive = normalizeArtifactToReportModel({
    executive_summary: {
      kpis: { net_revenue: "$88k", subscribers: 980 },
    },
  });

  assert.equal(executive.kpis.netRevenue, "$88k");
  assert.equal(executive.kpis.subscribers, "980");
});

test("report detail debug JSON is hidden behind collapsed Debug accordion", async () => {
  const source = await readFile("app/(app)/app/report/[reportId]/report-detail-client.tsx", "utf8");

  assert.equal(source.includes("<summary className=\"cursor-pointer text-sm font-medium text-slate-700\">Debug</summary>"), true);
  assert.equal(source.includes("<details className=\"rounded-2xl border border-slate-200 bg-white p-4\" data-testid=\"report-debug-accordion\">"), true);
  assert.equal(source.includes("<details open"), false);
});
