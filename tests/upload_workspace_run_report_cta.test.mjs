import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const dataUploadPagePath = path.resolve("app/(app)/app/_components/upload/data-upload-page.tsx");
const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

test("workspace hero derives Run Report availability from canonical workspace fields", async () => {
  const source = await readFile(dataUploadPagePath, "utf8");

  assert.equal(source.includes("fetchWorkspaceDataSources"), true);
  assert.equal(source.includes("buildWorkspaceReportState"), true);
  assert.equal(source.includes("workspaceReportState.canRunReport"), true);
  assert.equal(source.includes("workspaceReportState.blockingReason"), true);
  assert.equal(source.includes("workspaceReportState.reportReadinessNote"), true);
  assert.equal(source.includes("workspaceReportState.reportHasBusinessMetrics"), true);
  assert.equal(source.includes('data-testid="staged-run-report"'), true);
  assert.equal(source.includes("Ready to run"), true);
  assert.equal(source.includes('data-testid="workspace-run-summary"'), true);
  assert.equal(source.includes("Build your report"), true);
  assert.equal(source.includes("View all reports"), true);
  assert.equal(source.includes("What this report is based on"), false);
});

test("upload stepper keeps Run Report visible but disabled until workspace eligibility is true", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes("const showWorkspaceViewReport ="), true);
  assert.equal(source.includes("workspaceReportState.hasExistingReport"), true);
  assert.equal(source.includes("const showWorkspaceRunReportCta ="), true);
  assert.equal(source.includes("!workspaceReportState.canRunReport"), true);
  assert.equal(source.includes("workspaceBlockingReason"), true);
  assert.equal(source.includes('data-testid="upload-run-report"'), true);
  assert.equal(source.includes('data-testid="upload-completed-run-report"'), true);
  assert.equal(source.includes('data-testid="upload-completed-view-report"'), true);
  assert.equal(source.includes("Checking workspace..."), true);
});
