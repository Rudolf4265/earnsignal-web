import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const dataUploadPagePath = path.resolve("app/(app)/app/_components/upload/data-upload-page.tsx");
const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");
const reportWindowDialogPath = path.resolve("app/(app)/app/_components/upload/report-window-chooser-dialog.tsx");

test("workspace banner derives Run Report availability from canonical workspace fields", async () => {
  const source = await readFile(dataUploadPagePath, "utf8");

  assert.equal(source.includes("fetchWorkspaceDataSources"), true);
  assert.equal(source.includes("buildWorkspaceReportState"), true);
  assert.equal(source.includes("resolveWorkspaceReportWindowPolicy"), true);
  assert.equal(source.includes("useEntitlementState"), true);
  assert.equal(source.includes("workspaceReportState.canRunReport"), true);
  assert.equal(source.includes("workspaceReportState.reportHasBusinessMetrics"), true);
  assert.equal(source.includes("reportWindowPolicy.runCtaLabel"), true);
  assert.equal(source.includes('data-testid="staged-run-report"'), true);
  assert.equal(source.includes("Ready to run"), true);
  assert.equal(source.includes("View all reports"), true);
  assert.equal(source.includes("What this report is based on"), false);
});

test("workspace report flow includes the new analysis-window chooser with billing upgrade path", async () => {
  const [pageSource, stepperSource, dialogSource] = await Promise.all([
    readFile(dataUploadPagePath, "utf8"),
    readFile(uploadStepperPath, "utf8"),
    readFile(reportWindowDialogPath, "utf8"),
  ]);

  assert.equal(pageSource.includes("ReportWindowChooserDialog"), true);
  assert.equal(dialogSource.includes("Choose your analysis window"), true);
  assert.equal(dialogSource.includes("Report includes a focused 3-month business diagnostic."), true);
  assert.equal(dialogSource.includes('data-testid="analysis-window-dialog"'), true);
  assert.equal(dialogSource.includes('data-testid="analysis-window-latest"'), true);
  assert.equal(dialogSource.includes("Choose a 3-month period"), false);
  assert.equal(dialogSource.includes('data-testid="analysis-window-custom"'), false);
  assert.equal(dialogSource.includes('data-testid="analysis-window-period-select"'), false);
  assert.equal(dialogSource.includes('data-testid="analysis-window-upgrade"'), true);
  assert.equal(dialogSource.includes('href="/app/billing"'), true);
  assert.equal(pageSource.includes("onClearRunReportError={clearRunReportError}"), true);
  assert.equal(stepperSource.includes("runReportLabel"), true);
  assert.equal(stepperSource.includes("onClearRunReportError"), true);
  assert.equal(stepperSource.includes("setRunReportBusy("), false);
  assert.equal(stepperSource.includes("setRunReportError("), false);
  assert.equal(stepperSource.includes('data-testid="upload-run-report"'), true);
  assert.equal(stepperSource.includes('data-testid="upload-completed-run-report"'), true);
});

test("upload stepper keeps workspace CTA visibility and single-source gating structure intact", async () => {
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
