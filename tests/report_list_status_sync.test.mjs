import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/report/list-model.ts")).href;

async function loadModule(seed = Date.now()) {
  return import(`${moduleUrl}?t=${seed}`);
}

test("in-flight report status detection treats queued and running as active", async () => {
  const { isInFlightReportStatus } = await loadModule(Date.now() + 1);

  assert.equal(isInFlightReportStatus("queued"), true);
  assert.equal(isInFlightReportStatus("running"), true);
  assert.equal(isInFlightReportStatus("processing"), true);
  assert.equal(isInFlightReportStatus("failed"), false);
  assert.equal(isInFlightReportStatus("ready"), false);
});

test("overlayReportRunStatus replaces stale running state with status endpoint data", async () => {
  const { overlayReportRunStatus } = await loadModule(Date.now() + 2);

  const next = overlayReportRunStatus(
    {
      reportId: "rep_123",
      status: "running",
      createdAt: "2026-03-26T23:40:00Z",
      finishedAt: null,
      artifactUrl: null,
      artifactJsonUrl: null,
      uploadId: "upl_123",
      jobId: "job_123",
      schemaVersion: null,
      title: "Combined Report",
      platformsIncluded: ["patreon", "substack", "youtube"],
      sourceCount: 3,
      reportKind: "combined",
      coverageStart: null,
      coverageEnd: null,
    },
    {
      status: "failed",
      createdAt: "2026-03-26T23:40:00Z",
      finishedAt: "2026-03-27T00:44:07Z",
      schemaVersion: "v1",
    },
  );

  assert.equal(next.status, "failed");
  assert.equal(next.finishedAt, "2026-03-27T00:44:07Z");
  assert.equal(next.schemaVersion, "v1");
  assert.equal(next.reportId, "rep_123");
  assert.equal(next.title, "Combined Report");
});
