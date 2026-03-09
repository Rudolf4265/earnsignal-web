import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const statusModuleUrl = pathToFileURL(path.resolve("src/lib/upload/status.ts")).href;
const reportPathModuleUrl = pathToFileURL(path.resolve("src/lib/report/path.ts")).href;

const { mapUploadStatus, buildUploadDiagnostics } = await import(`${statusModuleUrl}?t=${Date.now()}`);
const { buildReportDetailPathOrIndex } = await import(`${reportPathModuleUrl}?t=${Date.now() + 1}`);

test("mapUploadStatus maps terminal and processing states", () => {
  assert.equal(mapUploadStatus({ status: "ready" }).status, "ready");
  assert.equal(mapUploadStatus({ status: "FAILED" }).status, "failed");
  assert.equal(mapUploadStatus({ status: "processing" }).status, "processing");
  assert.equal(mapUploadStatus({ status: "validating" }).status, "processing");
  assert.equal(mapUploadStatus({ status: "ingesting" }).status, "processing");
  assert.equal(mapUploadStatus({ status: "generating_report" }).status, "processing");
  assert.equal(mapUploadStatus({ status: "unknown_state" }).status, "processing");
});

test("mapUploadStatus accepts nullable reason fields from backend payloads", () => {
  const mapped = mapUploadStatus({
    status: "failed",
    reason_code: null,
    reason: null,
    message: null,
  });

  assert.equal(mapped.status, "failed");
  assert.equal(mapped.reasonCode, null);
  assert.equal(mapped.message, null);
});

test("buildUploadDiagnostics returns deterministic safe json", () => {
  const diagnostics = buildUploadDiagnostics({
    uploadId: "up_123",
    rawStatus: "failed",
    reasonCode: "validation_failed",
    message: "invalid column",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });

  const parsed = JSON.parse(diagnostics);
  assert.deepEqual(parsed, {
    upload_id: "up_123",
    status: "failed",
    reason_code: "validation_failed",
    message: "invalid column",
    updated_at: "2026-01-01T00:00:00.000Z",
    request_id: null,
    operation: null,
  });
});

test("ready upload with sentinel report_id falls back to report index href", () => {
  const mapped = mapUploadStatus({
    status: "report_ready",
    report_id: "undefined",
  });

  assert.equal(mapped.status, "ready");
  assert.equal(mapped.reportId, null);
  assert.equal(buildReportDetailPathOrIndex(mapped.reportId), "/app/report");
});
