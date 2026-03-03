import test from "node:test";
import assert from "node:assert/strict";

import { buildDashboardModelWithDeps } from "../src/lib/dashboard/model";

test("when reports endpoint returns 2 reports, dashboard recent reports matches order and titles/dates", async () => {
  const model = await buildDashboardModelWithDeps({
    listReports: async () => ({
      items: [
        {
          report_id: "r1",
          created_at: "2026-02-01T00:00:00.000Z",
          status: "ready",
          artifact_url: null,
          artifact_kind: null,
          upload_id: "u1",
          job_id: null,
          title: "Revenue quality Jan",
          platforms: ["youtube"],
          coverage_start: null,
          coverage_end: null,
        },
        {
          report_id: "r2",
          created_at: "2026-02-12T00:00:00.000Z",
          status: "ready",
          artifact_url: null,
          artifact_kind: null,
          upload_id: "u2",
          job_id: null,
          title: "Revenue quality Feb",
          platforms: ["youtube"],
          coverage_start: null,
          coverage_end: null,
        },
      ],
      next_offset: 2,
      has_more: false,
    }),
    getUploadStatusById: async () => null,
    getLatestUploadStatus: async () => null,
  });

  assert.equal(model.recentReports.length, 2);
  assert.deepEqual(model.recentReports.map((item) => item.title), ["Revenue quality Feb", "Revenue quality Jan"]);
  assert.deepEqual(model.recentReports.map((item) => item.createdAt), ["2026-02-12", "2026-02-01"]);
});

test("when upload status has platform and timestamps, dashboard data status includes platform and last upload", async () => {
  const model = await buildDashboardModelWithDeps({
    listReports: async () => ({ items: [], next_offset: 0, has_more: false }),
    getUploadStatusById: async () => ({
      uploadId: "u-123",
      status: "ready",
      platform: "youtube",
      platforms: ["youtube"],
      monthsPresent: 8,
      lastUpdatedAt: "2026-02-20T08:10:11.000Z",
      createdAt: "2026-02-20T08:00:00.000Z",
      message: null,
      reportId: "r-1",
    }),
    getLatestUploadStatus: async () => null,
    readLastUploadId: () => "u-123",
  });

  assert.equal(model.dataStatus.platformsConnected, "youtube");
  assert.equal(model.dataStatus.lastUpload, "2026-02-20");
});

test("empty state model when reports and uploads are missing", async () => {
  const model = await buildDashboardModelWithDeps({
    listReports: async () => ({ items: [], next_offset: 0, has_more: false }),
    getUploadStatusById: async () => null,
    getLatestUploadStatus: async () => null,
  });

  assert.equal(model.hasReports, false);
  assert.equal(model.recentReports.length, 0);
  assert.equal(model.dataStatus.platformsConnected, "None (upload to connect)");
  assert.equal(model.dataStatus.coverageHint, "Available after first report");
});
