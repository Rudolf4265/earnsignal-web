import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const statusModuleUrl = pathToFileURL(path.resolve("src/lib/upload/status.ts")).href;

const { mapUploadStatus, buildUploadDiagnostics, uploadStatusMessage } = await import(`${statusModuleUrl}?t=${Date.now()}`);

test("mapUploadStatus maps terminal and processing states", () => {
  assert.equal(mapUploadStatus({ status: "ready" }).status, "ready");
  assert.equal(mapUploadStatus({ status: "FAILED" }).status, "failed");
  assert.equal(mapUploadStatus({ status: "processing" }).status, "processing");
  assert.equal(mapUploadStatus({ status: "validated" }).status, "processing");
  assert.equal(mapUploadStatus({ status: "ingested" }).status, "processing");
  assert.equal(mapUploadStatus({ status: "reporting" }).status, "processing");
  assert.equal(mapUploadStatus({ status: "unknown_state" }).status, "processing");
});

test("uploadStatusMessage maps backend statuses to clearer stages", () => {
  assert.equal(uploadStatusMessage("validated"), "Validating…");
  assert.equal(uploadStatusMessage("ingested"), "Preparing report…");
  assert.equal(uploadStatusMessage("reporting"), "Generating report…");
  assert.equal(uploadStatusMessage("other"), "Processing upload…");
});

test("buildUploadDiagnostics returns deterministic safe json", () => {
  const diagnostics = buildUploadDiagnostics({
    uploadId: "up_123",
    rawStatus: "ingested",
    reason: "still_processing",
    timestamps: {
      created_at: "2026-01-01T00:00:00.000Z",
      validated_at: "2026-01-01T00:01:00.000Z",
      ingested_at: "2026-01-01T00:02:00.000Z",
      report_started_at: "2026-01-01T00:03:00.000Z",
      ready_at: null,
      updated_at: "2026-01-01T00:03:30.000Z",
    },
    monthsPresent: 12,
    rowsWritten: 340,
    recommendedNextAction: "retry_status",
  });

  const parsed = JSON.parse(diagnostics);
  assert.deepEqual(parsed, {
    upload_id: "up_123",
    status: "ingested",
    timestamps: {
      created_at: "2026-01-01T00:00:00.000Z",
      validated_at: "2026-01-01T00:01:00.000Z",
      ingested_at: "2026-01-01T00:02:00.000Z",
      report_started_at: "2026-01-01T00:03:00.000Z",
      ready_at: null,
      updated_at: "2026-01-01T00:03:30.000Z",
    },
    reason: "still_processing",
    months_present: 12,
    rows_written: 340,
    recommended_next_action: "retry_status",
  });
});
