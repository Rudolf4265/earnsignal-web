import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dashboardModuleUrl = pathToFileURL(path.resolve("src/lib/dashboard/latest-report.ts")).href;
const clientModuleUrl = pathToFileURL(path.resolve("src/lib/api/client.ts")).href;

async function loadModules(seed = Date.now()) {
  const [dashboard, client] = await Promise.all([import(`${dashboardModuleUrl}?t=${seed}`), import(clientModuleUrl)]);
  return { ...dashboard, ...client };
}

function makeReportDetail(id, status = "ready") {
  return {
    id,
    title: `Report ${id}`,
    status,
    summary: `Summary ${id}`,
    artifactUrl: null,
    pdfUrl: null,
    artifactJsonUrl: null,
    keySignals: [],
    recommendedActions: [],
    metrics: {
      netRevenue: null,
      subscribers: null,
      stabilityIndex: null,
      churnVelocity: null,
      coverageMonths: null,
      platformsConnected: null,
    },
  };
}

test("dashboard latest report loader falls back to first completed report when upload report_id is missing", async () => {
  const { loadLatestDashboardReport } = await loadModules(Date.now() + 1);
  const detailCalls = [];
  let listCalls = 0;

  const result = await loadLatestDashboardReport({
    latestUploadReportId: null,
    fetchReportDetail: async (reportId) => {
      detailCalls.push(reportId);
      if (reportId === "rep_completed_2") {
        return makeReportDetail("rep_completed_2", "completed");
      }

      throw new Error(`Unexpected report id ${reportId}`);
    },
    fetchReportsList: async () => {
      listCalls += 1;
      return {
        items: [
          { reportId: "rep_processing_1", status: "processing" },
          { reportId: "rep_completed_2", status: "completed" },
          { reportId: "rep_ready_3", status: "ready" },
        ],
        nextOffset: null,
        hasMore: false,
      };
    },
  });

  assert.equal(result?.id, "rep_completed_2");
  assert.equal(listCalls, 1);
  assert.deepEqual(detailCalls, ["rep_completed_2"]);
});

test("dashboard latest report loader falls back after upload report_id resolves to 404", async () => {
  const { ApiError, loadLatestDashboardReport } = await loadModules(Date.now() + 2);
  const detailCalls = [];

  const result = await loadLatestDashboardReport({
    latestUploadReportId: "rep_missing",
    fetchReportDetail: async (reportId) => {
      detailCalls.push(reportId);
      if (reportId === "rep_missing") {
        throw new ApiError({
          status: 404,
          code: "NOT_FOUND",
          message: "missing",
          operation: "report.fetch",
          path: "/v1/reports/rep_missing",
          method: "GET",
        });
      }

      if (reportId === "rep_ready_fallback") {
        return makeReportDetail("rep_ready_fallback", "ready");
      }

      throw new Error(`Unexpected report id ${reportId}`);
    },
    fetchReportsList: async () => ({
      items: [{ reportId: "rep_ready_fallback", status: "ready" }],
      nextOffset: null,
      hasMore: false,
    }),
  });

  assert.equal(result?.id, "rep_ready_fallback");
  assert.deepEqual(detailCalls, ["rep_missing", "rep_ready_fallback"]);
});
