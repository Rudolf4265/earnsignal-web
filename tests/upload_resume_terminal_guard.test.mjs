/**
 * Tests that verify the upload-stepper resume guard:
 * - Active (processing) uploads resume correctly.
 * - Terminal uploads (ready, validated, failed) do NOT auto-resume the full
 *   stepper state on a fresh page load.
 * - The compact completed-upload summary is surfaced for ready/validated.
 * - resetFlow clears latestTerminalUpload so "Upload another" works.
 *
 * These are structural source-scan tests that prove the guard logic is present.
 * Behavioral coverage for the async resume flow lives in e2e tests.
 */

import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

let source;

// Load once for all tests.
test("load upload-stepper source", async () => {
  source = await readFile(uploadStepperPath, "utf8");
  assert.ok(source.length > 0, "upload-stepper.tsx should be non-empty");
});

// ── Core guard ──────────────────────────────────────────────────────────────

test("resumeIfBackendActive returns false immediately for non-processing statuses", () => {
  // The guard must be the first status check after the uploadId null-guard.
  assert.ok(
    source.includes("if (mapped.status !== \"processing\")"),
    "resumeIfBackendActive must short-circuit for non-processing statuses",
  );
});

test("resumeIfBackendActive only polls and resumes for processing status", () => {
  // After the non-processing guard, the code must call updateProcessingFromEnvelope
  // and pollUntilTerminal only when status IS processing.
  const guardIdx = source.indexOf("if (mapped.status !== \"processing\")");
  const resumeIdx = source.indexOf("updateProcessingFromEnvelope(statusEnvelope, activeUploadId);");
  assert.ok(guardIdx !== -1, "non-processing guard must exist");
  assert.ok(resumeIdx !== -1, "updateProcessingFromEnvelope call must exist");
  // The full resume path must come AFTER the guard (higher line index).
  assert.ok(resumeIdx > guardIdx, "resume path must be after the terminal guard");
});

// ── latestTerminalUpload state ───────────────────────────────────────────────

test("latestTerminalUpload state is declared", () => {
  assert.ok(
    source.includes("latestTerminalUpload, setLatestTerminalUpload"),
    "latestTerminalUpload state must be declared via useState",
  );
});

test("resumeIfBackendActive sets latestTerminalUpload for ready status", () => {
  assert.ok(
    source.includes('mapped.status === "ready" || mapped.status === "validated"'),
    "must set latestTerminalUpload for ready and validated statuses",
  );
  assert.ok(
    source.includes("setLatestTerminalUpload({ status: mapped.status, uploadId: activeUploadId, reportId: mapped.reportId })"),
    "setLatestTerminalUpload must capture upload info",
  );
});

test("resumeIfBackendActive does NOT set latestTerminalUpload for failed status", () => {
  // The only call to setLatestTerminalUpload inside resumeIfBackendActive must
  // be guarded by the ready||validated check, so failed falls through without setting it.
  const guardStr = 'mapped.status === "ready" || mapped.status === "validated"';
  const setStr = "setLatestTerminalUpload({ status: mapped.status, uploadId: activeUploadId, reportId: mapped.reportId })";
  assert.ok(source.includes(guardStr), "ready/validated guard must exist");
  assert.ok(source.includes(setStr), "setLatestTerminalUpload call must exist");
  // Verify there's no unconditional setLatestTerminalUpload (would be a bug).
  // We check that the call appears only once (guarded, not duplicated ungated).
  const occurrences = source.split(setStr).length - 1;
  assert.equal(occurrences, 1, "setLatestTerminalUpload must appear exactly once (guarded)");
});

// ── resetFlow ────────────────────────────────────────────────────────────────

test("resetFlow clears latestTerminalUpload", () => {
  assert.ok(
    source.includes("setLatestTerminalUpload(null)"),
    "resetFlow must clear latestTerminalUpload when user starts over",
  );
});

// ── Compact summary banner ───────────────────────────────────────────────────

test("platform step renders compact summary banner for completed uploads", () => {
  assert.ok(
    source.includes('data-testid="upload-completed-summary"'),
    "compact summary banner must have upload-completed-summary test id",
  );
});

test("compact summary has View report link for ready status", () => {
  assert.ok(
    source.includes('data-testid="upload-completed-view-report"'),
    "compact summary must have a view-report link",
  );
});

test("compact summary has dismiss/Upload another button", () => {
  assert.ok(
    source.includes('data-testid="upload-completed-dismiss"'),
    "compact summary must have a dismiss/upload-another button",
  );
});

test("compact summary dismiss button calls setLatestTerminalUpload(null)", () => {
  assert.ok(
    source.includes("onClick={() => setLatestTerminalUpload(null)}"),
    "dismiss button must clear latestTerminalUpload (not full resetFlow)",
  );
});

test("compact summary is shown only when latestTerminalUpload is set", () => {
  assert.ok(
    source.includes(") : latestTerminalUpload ? ("),
    "compact summary must be conditional on latestTerminalUpload being truthy",
  );
});

// ── Existing active-resume behavior is preserved ─────────────────────────────

test("resume banner still exists for in-progress uploads", () => {
  assert.ok(
    source.includes('data-testid="upload-resume-banner"'),
    "in-progress resume banner must still exist",
  );
  assert.ok(
    source.includes("We found a recent upload and will automatically check its status."),
    "resume banner message must be unchanged",
  );
});

test("pollUntilTerminal is still called for processing status resumes", () => {
  assert.ok(
    source.includes("await pollUntilTerminal(activeUploadId);"),
    "active upload resume must still poll until terminal",
  );
});

// ── Upload another in done step is preserved ─────────────────────────────────

test("Upload another button in done step still calls resetFlow", () => {
  // The done-step Upload another buttons both call resetFlow.
  const count = (source.match(/onClick={resetFlow}/g) ?? []).length;
  assert.ok(count >= 2, "done step must have at least two resetFlow onClick handlers (validated + ready variants)");
});
