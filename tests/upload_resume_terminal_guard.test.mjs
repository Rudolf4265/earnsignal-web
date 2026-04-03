/**
 * Structural tests for the upload-stepper resume guard:
 * - Active uploads still resume correctly.
 * - Terminal uploads surface a compact summary instead of hijacking the stepper.
 * - Run Report CTA gating now comes from workspaceReportState, not upload report ids.
 */

import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

let source;

test("load upload-stepper source", async () => {
  source = await readFile(uploadStepperPath, "utf8");
  assert.ok(source.length > 0, "upload-stepper.tsx should be non-empty");
});

test("resumeIfBackendActive returns false immediately for non-processing statuses", () => {
  assert.ok(source.includes('if (mapped.status !== "processing")'));
});

test("resumeIfBackendActive only polls and resumes for processing status", () => {
  const guardIdx = source.indexOf('if (mapped.status !== "processing")');
  const resumeIdx = source.indexOf("updateProcessingFromEnvelope(statusEnvelope, activeUploadId);");
  assert.ok(guardIdx !== -1);
  assert.ok(resumeIdx !== -1);
  assert.ok(resumeIdx > guardIdx);
});

test("latestTerminalUpload state is declared without upload-level report ids", () => {
  assert.ok(source.includes("latestTerminalUpload, setLatestTerminalUpload"));
  assert.equal(source.includes("reportId: string | null"), false);
});

test("resumeIfBackendActive stores ready and validated uploads for the compact summary banner", () => {
  assert.ok(source.includes('mapped.status === "ready" || mapped.status === "validated"'));
  assert.ok(source.includes("setLatestTerminalUpload({ status: mapped.status, uploadId: activeUploadId })"));
});

test("resetFlow clears latestTerminalUpload", () => {
  assert.ok(source.includes("setLatestTerminalUpload(null)"));
});

test("compact summary banner still exists for completed uploads", () => {
  assert.ok(source.includes('data-testid="upload-completed-summary"'));
  assert.equal(source.includes('data-testid="upload-completed-run-report"'), false);
  assert.ok(source.includes('data-testid="upload-completed-dismiss"'));
});

test("compact summary still reflects workspace report truth without duplicating the Run Report CTA", () => {
  assert.ok(source.includes("workspaceReportState.canRunReport"));
  assert.ok(source.includes("workspaceReportState.hasExistingReport"));
  assert.ok(source.includes("Review your staged sources below, then run the report from the final step."));
  assert.equal(source.includes("latestTerminalUpload.reportId"), false);
});

test("stepper clears the current report when a new upload starts or completes", () => {
  assert.ok(source.includes("clearCurrentReport();"));
});

test("resume banner still exists for in-progress uploads", () => {
  assert.ok(source.includes('data-testid="upload-resume-banner"'));
  assert.ok(source.includes("We found a recent upload and will automatically check its status."));
});

test("pollUntilTerminal is still called for processing status resumes", () => {
  assert.ok(source.includes("await pollUntilTerminal(activeUploadId);"));
});

test("Upload another buttons in the done step still call resetFlow", () => {
  const count = (source.match(/onClick={resetFlow}/g) ?? []).length;
  assert.ok(count >= 2);
});
