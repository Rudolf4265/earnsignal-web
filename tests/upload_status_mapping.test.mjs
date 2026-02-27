import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const statusModuleUrl = pathToFileURL(path.resolve("src/lib/upload/status.ts")).href;

const { mapUploadStatus, buildUploadDiagnostics } = await import(`${statusModuleUrl}?t=${Date.now()}`);

test("mapUploadStatus maps terminal and processing states", () => {
  assert.equal(mapUploadStatus({ status: "ready" }).status, "ready");
  assert.equal(mapUploadStatus({ status: "FAILED" }).status, "failed");
  assert.equal(mapUploadStatus({ status: "processing" }).status, "processing");
  assert.equal(mapUploadStatus({ status: "validating" }).status, "processing");
  assert.equal(mapUploadStatus({ status: "ingesting" }).status, "processing");
  assert.equal(mapUploadStatus({ status: "generating_report" }).status, "processing");
  assert.equal(mapUploadStatus({ status: "unknown_state" }).status, "processing");
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
  });
});
