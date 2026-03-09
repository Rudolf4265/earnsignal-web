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
    artifactUrl: `/v1/reports/${id}/artifact`,
    pdfUrl: `/v1/reports/${id}/artifact`,
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

test("dashboard latest report loader fetches detail from first completed report with a canonical artifact in list", async () => {
  const { loadLatestDashboardReport } = await loadModules();
  const detailCalls = [];
  let listCalls = 0;

  const result = await loadLatestDashboardReport({
    latestUploadReportId: null,
    fetchReportDetail: async (reportId) => {
      detailCalls.push(reportId);
      if (reportId === "rep_second_2") {
        return makeReportDetail("rep_second_2", "completed");
      }

      throw new Error(`Unexpected report id ${reportId}`);
    },
    fetchReportsList: async () => {
      listCalls += 1;
      return {
        items: [
          { reportId: "rep_first_1", status: "processing", artifactUrl: null },
          { reportId: "rep_second_2", status: "completed", artifactUrl: "/v1/reports/rep_second_2/artifact" },
          { reportId: "rep_third_3", status: "ready", artifactUrl: "/v1/reports/rep_third_3/artifact" },
        ],
        nextOffset: null,
        hasMore: false,
      };
    },
  });

  assert.equal(result?.id, "rep_second_2");
  assert.equal(listCalls, 1);
  assert.deepEqual(detailCalls, ["rep_second_2"]);
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
      items: [{ reportId: "rep_list_primary", status: "ready", artifactUrl: "/v1/reports/rep_list_primary/artifact" }],
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
      items: [{ reportId: null, status: "ready", artifactUrl: "/v1/reports/rep_upload_fallback/artifact" }],
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
        artifact_url: "/v1/reports/rep_payload_first/artifact",
        created_at: "2026-03-01T10:00:00Z",
      },
      {
        report_id: "rep_payload_second",
        status: "ready",
        artifact_url: "/v1/reports/rep_payload_second/artifact",
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

test("dashboard latest report loader deterministically picks newest completed report by created_at timestamp", async () => {
  const { loadLatestDashboardReport } = await loadModules();
  const detailCalls = [];

  const result = await loadLatestDashboardReport({
    latestUploadReportId: "rep_upload_stale",
    fetchReportDetail: async (reportId) => {
      detailCalls.push(reportId);
      return makeReportDetail(reportId, "ready");
    },
    fetchReportsList: async () => ({
      items: [
        {
          reportId: "rep_old_001",
          status: "ready",
          createdAt: "2026-03-01T10:00:00Z",
          artifactUrl: "/v1/reports/rep_old_001/artifact",
        },
        {
          reportId: "rep_new_002",
          status: "ready",
          createdAt: "2026-03-09T10:00:00Z",
          artifactUrl: "/v1/reports/rep_new_002/artifact",
        },
      ],
      nextOffset: null,
      hasMore: false,
    }),
  });

  assert.equal(result?.id, "rep_new_002");
  assert.deepEqual(detailCalls, ["rep_new_002"]);
});

test("dashboard latest report loader ignores completed rows with missing artifact_url and falls back to canonical upload report_id", async () => {
  const { loadLatestDashboardReport } = await loadModules();
  const detailCalls = [];

  const result = await loadLatestDashboardReport({
    latestUploadReportId: "rep_upload_usable",
    fetchReportDetail: async (reportId) => {
      detailCalls.push(reportId);
      if (reportId === "rep_upload_usable") {
        return makeReportDetail("rep_upload_usable", "ready");
      }

      throw new Error(`Unexpected report id ${reportId}`);
    },
    fetchReportsList: async () => ({
      items: [{ reportId: "rep_missing_artifact", status: "ready", artifactUrl: null }],
      nextOffset: null,
      hasMore: false,
    }),
  });

  assert.equal(result?.id, "rep_upload_usable");
  assert.deepEqual(detailCalls, ["rep_upload_usable"]);
});
