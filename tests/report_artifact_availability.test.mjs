import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/report/artifact-availability.ts")).href;

async function loadModule(seed = Date.now()) {
  return import(`${moduleUrl}?t=${seed}`);
}

test("hasUsableReportArtifact requires completed status, canonical report_id, and canonical artifact endpoint", async () => {
  const { hasUsableReportArtifact } = await loadModule(Date.now() + 1);

  assert.equal(
    hasUsableReportArtifact({
      reportId: "rep_ok_1",
      status: "ready",
      artifactUrl: "/v1/reports/rep_ok_1/artifact",
    }),
    true,
  );

  assert.equal(
    hasUsableReportArtifact({
      reportId: "rep_processing",
      status: "processing",
      artifactUrl: "/v1/reports/rep_processing/artifact",
    }),
    false,
  );

  assert.equal(
    hasUsableReportArtifact({
      reportId: "rep_missing",
      status: "ready",
      artifactUrl: null,
    }),
    false,
  );

  assert.equal(
    hasUsableReportArtifact({
      reportId: "rep_json",
      status: "ready",
      artifactUrl: "/v1/reports/rep_json/artifact.json",
    }),
    false,
  );

  assert.equal(
    hasUsableReportArtifact({
      reportId: "rep_mismatch",
      status: "ready",
      artifactUrl: "/v1/reports/rep_other/artifact",
    }),
    false,
  );
});
