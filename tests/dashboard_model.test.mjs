import test from "node:test";
import assert from "node:assert/strict";

import { buildDashboardModelWithDeps } from "../src/lib/dashboard/model";

function baseDeps(overrides = {}) {
  return {
    listReports: async () => ({ items: [], next_offset: 0, has_more: false }),
    getReport: async () => ({ id: "r1", title: "Report", status: "ready", summary: "", artifactJsonUrl: "/v1/reports/r1/artifact.json" }),
    getUploadStatusById: async () => null,
    getLatestUploadStatus: async () => null,
    fetchReportJsonArtifact: async () => ({ kpis: { net_revenue: "$100", subscribers: 4, stability_index: 77, churn_velocity: "Low" } }),
    getAccessToken: async () => "token-1",
    ...overrides,
  };
}

test("dashboard recent reports matches order and app route links", async () => {
  const model = await buildDashboardModelWithDeps(baseDeps({
    listReports: async () => ({
      items: [
        { report_id: "r1", created_at: "2026-02-01T00:00:00.000Z", status: "ready", artifact_url: null, artifact_json_url: "/a.json", artifact_kind: null, upload_id: "u1", job_id: null, title: "Jan", platforms: ["youtube"], coverage_start: null, coverage_end: null },
        { report_id: "r2", created_at: "2026-02-12T00:00:00.000Z", status: "ready", artifact_url: null, artifact_json_url: "/b.json", artifact_kind: null, upload_id: "u2", job_id: null, title: "Feb", platforms: ["youtube"], coverage_start: null, coverage_end: null },
      ], next_offset: 2, has_more: false,
    }),
    getReport: async () => ({ id: "r2", title: "Feb", status: "ready", summary: "", artifactJsonUrl: "/b.json" }),
  }));

  assert.deepEqual(model.recentReports.map((item) => item.title), ["Feb", "Jan"]);
  assert.deepEqual(model.recentReports.map((item) => item.internalHref), ["/app/report/r2", "/app/report/r1"]);
  assert.deepEqual(model.recentReports.map((item) => item.externalHref), [null, null]);
});

test("dashboard hydrates KPI cards from report JSON artifact", async () => {
  const model = await buildDashboardModelWithDeps(baseDeps({
    listReports: async () => ({
      items: [
        { report_id: "r2", created_at: "2026-02-12T00:00:00.000Z", status: "ready", artifact_url: null, artifact_json_url: "/b.json", artifact_kind: null, upload_id: "u2", job_id: null, title: "Feb", platforms: ["youtube"], coverage_start: null, coverage_end: null },
      ], next_offset: 1, has_more: false,
    }),
  }));

  assert.equal(model.kpis.netRevenue, "$100");
  assert.equal(model.kpis.subscribers, "4");
  assert.equal(model.reportDataError, false);
});

test("dashboard sets reportDataError when report exists but JSON fetch fails", async () => {
  const model = await buildDashboardModelWithDeps(baseDeps({
    listReports: async () => ({
      items: [
        { report_id: "r2", created_at: "2026-02-12T00:00:00.000Z", status: "ready", artifact_url: null, artifact_json_url: "/b.json", artifact_kind: null, upload_id: "u2", job_id: null, title: "Feb", platforms: ["youtube"], coverage_start: null, coverage_end: null },
      ], next_offset: 1, has_more: false,
    }),
    fetchReportJsonArtifact: async () => { throw new Error("boom"); },
  }));

  assert.equal(model.hasReports, true);
  assert.equal(model.reportDataError, true);
});


test("dashboard prefers artifact_json_url and does not require detail JSON url", async () => {
  let hydratedFromUrl = null;
  const model = await buildDashboardModelWithDeps(baseDeps({
    listReports: async () => ({
      items: [
        { report_id: "r2", created_at: "2026-02-12T00:00:00.000Z", status: "ready", artifact_url: "/r2.pdf", artifact_json_url: "/b.json", artifact_kind: null, upload_id: "u2", job_id: null, title: "Feb", platforms: ["youtube"], coverage_start: null, coverage_end: null },
      ], next_offset: 1, has_more: false,
    }),
    getReport: async () => ({ id: "r2", title: "Feb", status: "ready", summary: "", artifactJsonUrl: null }),
    fetchReportJsonArtifact: async ({ artifactJsonUrl }) => {
      hydratedFromUrl = artifactJsonUrl;
      return { kpis: { net_revenue: "$300" } };
    },
  }));

  assert.equal(hydratedFromUrl, "/b.json");
  assert.equal(model.kpis.netRevenue, "$300");
  assert.equal(model.reportDataError, false);
});

test("dashboard does not show reportDataError when artifact_json_url is missing", async () => {
  const model = await buildDashboardModelWithDeps(baseDeps({
    listReports: async () => ({
      items: [
        { report_id: "r2", created_at: "2026-02-12T00:00:00.000Z", status: "ready", artifact_url: "/r2.pdf", artifact_json_url: null, artifact_kind: null, upload_id: "u2", job_id: null, title: "Feb", platforms: ["youtube"], coverage_start: null, coverage_end: null },
      ], next_offset: 1, has_more: false,
    }),
    getReport: async () => ({ id: "r2", title: "Feb", status: "ready", summary: "", artifactJsonUrl: null }),
  }));

  assert.equal(model.reportDataError, false);
  assert.equal(model.dataStatus.coverageHint, "Available after first report");
});


test("dashboard recent reports uses absolute artifact URL as external view target", async () => {
  const model = await buildDashboardModelWithDeps(baseDeps({
    listReports: async () => ({
      items: [
        { report_id: "r2", created_at: "2026-02-12T00:00:00.000Z", status: "ready", artifact_url: "https://cdn.example.test/r2.pdf", artifact_json_url: null, artifact_kind: null, upload_id: "u2", job_id: null, title: "Feb", platforms: ["youtube"], coverage_start: null, coverage_end: null },
      ], next_offset: 1, has_more: false,
    }),
    getReport: async () => ({ id: "r2", title: "Feb", status: "ready", summary: "", artifactJsonUrl: null }),
  }));

  assert.equal(model.recentReports[0].externalHref, "https://cdn.example.test/r2.pdf");
  assert.equal(model.recentReports[0].internalHref, null);
});

test("dashboard recent reports prefixes relative artifact URL with API base origin", async () => {
  const previous = process.env.NEXT_PUBLIC_API_BASE_URL;
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";

  try {
    const model = await buildDashboardModelWithDeps(baseDeps({
      listReports: async () => ({
        items: [
          { report_id: "r2", created_at: "2026-02-12T00:00:00.000Z", status: "ready", artifact_url: "/v1/reports/r2/artifact", artifact_json_url: null, artifact_kind: null, upload_id: "u2", job_id: null, title: "Feb", platforms: ["youtube"], coverage_start: null, coverage_end: null },
        ], next_offset: 1, has_more: false,
      }),
      getReport: async () => ({ id: "r2", title: "Feb", status: "ready", summary: "", artifactJsonUrl: null }),
    }));

    assert.equal(model.recentReports[0].externalHref, "https://api.example.test/v1/reports/r2/artifact");
    assert.equal(model.recentReports[0].internalHref, null);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL;
    else process.env.NEXT_PUBLIC_API_BASE_URL = previous;
  }
});

test("dashboard recent reports uses internal route when artifact URL is missing", async () => {
  const model = await buildDashboardModelWithDeps(baseDeps({
    listReports: async () => ({
      items: [
        { report_id: "r2", created_at: "2026-02-12T00:00:00.000Z", status: "ready", artifact_url: null, artifact_json_url: null, artifact_kind: null, upload_id: "u2", job_id: null, title: "Feb", platforms: ["youtube"], coverage_start: null, coverage_end: null },
      ], next_offset: 1, has_more: false,
    }),
    getReport: async () => ({ id: "r2", title: "Feb", status: "ready", summary: "", artifactJsonUrl: null }),
  }));

  assert.equal(model.recentReports[0].externalHref, null);
  assert.equal(model.recentReports[0].internalHref, "/app/report/r2");
});

test("dashboard recent reports disables view when artifact URL and report_id are missing", async () => {
  const model = await buildDashboardModelWithDeps(baseDeps({
    listReports: async () => ({
      items: [
        { report_id: null, created_at: "2026-02-12T00:00:00.000Z", status: "running", artifact_url: null, artifact_json_url: null, artifact_kind: null, upload_id: "u2", job_id: null, title: "Feb", platforms: ["youtube"], coverage_start: null, coverage_end: null },
      ], next_offset: 1, has_more: false,
    }),
    getReport: async () => ({ id: "r2", title: "Feb", status: "ready", summary: "", artifactJsonUrl: null }),
  }));

  assert.equal(model.recentReports[0].externalHref, null);
  assert.equal(model.recentReports[0].internalHref, null);
  assert.equal(model.recentReports[0].canView, false);
});
