import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const latestReportModuleUrl = pathToFileURL(path.resolve("src/lib/dashboard/latest-report.ts")).href;
const normalizeReportModuleUrl = pathToFileURL(path.resolve("src/lib/report/normalize-report-detail.ts")).href;

const { loadLatestDashboardReport } = await import(`${latestReportModuleUrl}?t=${Date.now()}`);
const { normalizeReportDetail } = await import(`${normalizeReportModuleUrl}?t=${Date.now() + 1}`);

function createNormalizedReportDetail(reportId, payload) {
  return normalizeReportDetail(reportId, payload);
}

test("mixed-platform launch path keeps the newest report and preserves four-platform report metrics", async () => {
  const reportPayloads = {
    rep_stale_001: {
      id: "rep_stale_001",
      status: "ready",
      summary: "Older report should not win.",
      created_at: "2026-03-01T10:00:00Z",
      report: {
        metrics: {
          net_revenue: 3200,
          subscribers: 410,
          stability_index: 74,
          platforms_connected: 2,
        },
      },
    },
    rep_launch_004: {
      id: "rep_launch_004",
      status: "ready",
      summary: "Mixed-platform workspace is ready from the latest report.",
      created_at: "2026-03-12T10:00:00Z",
      report: {
        key_signals: [
          "Patreon and YouTube remain in the current revenue mix.",
          "Instagram and TikTok performance imports are included in the latest report.",
        ],
        recommended_actions: ["Refresh the next monthly export set after the current cycle closes."],
        metrics: {
          net_revenue: 4800,
          subscribers: 530,
          stability_index: 81,
          coverage_months: 6,
        },
        platforms: ["patreon", "youtube", "instagram", "tiktok"],
      },
    },
  };

  const result = await loadLatestDashboardReport({
    fetchReportDetail: async (reportId) => createNormalizedReportDetail(reportId, reportPayloads[reportId]),
    fetchReportsList: async () => ({
      items: [
        {
          reportId: "rep_stale_001",
          status: "ready",
          createdAt: "2026-03-01T10:00:00Z",
          artifactUrl: "/v1/reports/rep_stale_001/artifact",
        },
        {
          reportId: "rep_launch_004",
          status: "ready",
          createdAt: "2026-03-12T10:00:00Z",
          artifactUrl: "/v1/reports/rep_launch_004/artifact",
        },
      ],
      nextOffset: null,
      hasMore: false,
    }),
  });

  assert.equal(result?.id, "rep_launch_004");
  assert.equal(result?.summary, "Mixed-platform workspace is ready from the latest report.");
  assert.deepEqual(result?.keySignals, [
    "Patreon and YouTube remain in the current revenue mix.",
    "Instagram and TikTok performance imports are included in the latest report.",
  ]);
  assert.deepEqual(result?.metrics, {
    netRevenue: 4800,
    subscribers: 530,
    stabilityIndex: 81,
    churnVelocity: null,
    coverageMonths: 6,
    platformsConnected: 4,
  });
});
