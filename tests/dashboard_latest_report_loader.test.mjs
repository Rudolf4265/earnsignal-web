import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dashboardModuleUrl = pathToFileURL(path.resolve("src/lib/dashboard/latest-report.ts")).href;
const listModelModuleUrl = pathToFileURL(path.resolve("src/lib/report/list-model.ts")).href;

async function loadModules() {
  const [dashboard, listModel] = await Promise.all([import(dashboardModuleUrl), import(listModelModuleUrl)]);
  return { ...dashboard, ...listModel };
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

test("dashboard latest report loader fetches detail from first report in list when upload report_id is missing", async () => {
  const { loadLatestDashboardReport } = await loadModules();
  const detailCalls = [];
  let listCalls = 0;

  const result = await loadLatestDashboardReport({
    latestUploadReportId: null,
    fetchReportDetail: async (reportId) => {
      detailCalls.push(reportId);
      if (reportId === "rep_first_1") {
        return makeReportDetail("rep_first_1", "processing");
      }

      throw new Error(`Unexpected report id ${reportId}`);
    },
    fetchReportsList: async () => {
      listCalls += 1;
      return {
        items: [
          { reportId: "rep_first_1", status: "processing" },
          { reportId: "rep_second_2", status: "completed" },
          { reportId: "rep_third_3", status: "ready" },
        ],
        nextOffset: null,
        hasMore: false,
      };
    },
  });

  assert.equal(result?.id, "rep_first_1");
  assert.equal(listCalls, 1);
  assert.deepEqual(detailCalls, ["rep_first_1"]);
});

test("dashboard latest report loader prefers list-based hydration over upload report_id optimization", async () => {
  const { loadLatestDashboardReport } = await loadModules();
  const detailCalls = [];

  const result = await loadLatestDashboardReport({
    latestUploadReportId: "rep_upload_optimized",
    fetchReportDetail: async (reportId) => {
      detailCalls.push(reportId);
      if (reportId === "rep_list_primary") {
        return makeReportDetail("rep_list_primary", "ready");
      }

      throw new Error(`Unexpected report id ${reportId}`);
    },
    fetchReportsList: async () => ({
      items: [{ reportId: "rep_list_primary", status: "ready" }],
      nextOffset: null,
      hasMore: false,
    }),
  });

  assert.equal(result?.id, "rep_list_primary");
  assert.deepEqual(detailCalls, ["rep_list_primary"]);
});

test("dashboard latest report loader falls back to upload report_id when list has no canonical report_id", async () => {
  const { loadLatestDashboardReport } = await loadModules();
  const detailCalls = [];

  const result = await loadLatestDashboardReport({
    latestUploadReportId: "rep_upload_fallback",
    fetchReportDetail: async (reportId) => {
      detailCalls.push(reportId);
      if (reportId === "rep_upload_fallback") {
        return makeReportDetail("rep_upload_fallback", "ready");
      }

      throw new Error(`Unexpected report id ${reportId}`);
    },
    fetchReportsList: async () => ({
      items: [{ reportId: null, status: "ready" }],
      nextOffset: null,
      hasMore: false,
    }),
  });

  assert.equal(result?.id, "rep_upload_fallback");
  assert.deepEqual(detailCalls, ["rep_upload_fallback"]);
});

test("dashboard latest report loader triggers detail fetch from /v1/reports payload report_id values", async () => {
  const { loadLatestDashboardReport, normalizeReportsListResponse } = await loadModules();
  const detailCalls = [];

  const rawPayload = {
    items: [
      {
        report_id: "rep_payload_first",
        status: "ready",
        created_at: "2026-03-01T10:00:00Z",
      },
      {
        report_id: "rep_payload_second",
        status: "ready",
        created_at: "2026-03-01T09:00:00Z",
      },
    ],
    has_more: false,
    next_offset: null,
  };

  const result = await loadLatestDashboardReport({
    latestUploadReportId: null,
    fetchReportDetail: async (reportId) => {
      detailCalls.push(reportId);
      return makeReportDetail(reportId, "ready");
    },
    fetchReportsList: async () => normalizeReportsListResponse(rawPayload),
  });

  assert.equal(result?.id, "rep_payload_first");
  assert.deepEqual(detailCalls, ["rep_payload_first"]);
});
