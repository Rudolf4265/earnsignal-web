import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const dataUploadPagePath = path.resolve("app/(app)/app/_components/upload/data-upload-page.tsx");
const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

test("data upload page keeps the main workspace simple while upload flow stays manifest-driven", async () => {
  const [source, uploadStepperSource] = await Promise.all([
    readFile(dataUploadPagePath, "utf8"),
    readFile(uploadStepperPath, "utf8"),
  ]);

  assert.equal(source.includes("DataPageHeader"), true);
  assert.equal(source.includes("ReadyToRunBanner"), true);
  assert.equal(source.includes("SourceListSection"), true);
  assert.equal(source.includes("HelpSection"), true);
  assert.equal(source.includes("DangerZoneClearData"), true);
  assert.equal(source.includes("fetchWorkspaceDataSources"), true);
  assert.equal(source.includes("buildWorkspaceReportState"), true);
  assert.equal(source.includes("getSourceManifest"), true);
  assert.equal(source.includes("normalizeSourceManifestResponse"), true);
  assert.equal(source.includes("buildUploadPlatformCardsFromManifest"), true);
  assert.equal(source.includes("UploadFlowSkeleton"), true);
  assert.equal(source.includes("source-manifest-unavailable"), true);
  assert.equal(source.includes('data-testid={`workspace-source-row-${item.id}`}'), true);
  assert.equal(source.includes("Advanced details"), true);
  assert.equal(source.includes("Connect source"), true);
  assert.equal(source.includes("Ready to run"), true);
  assert.equal(source.includes("View all reports"), true);
  assert.equal(source.includes("Your data sources"), true);
  assert.equal(source.includes("This report uses your staged sources."), true);
  assert.equal(source.includes("Contribution"), false);
  assert.equal(source.includes("Next run"), false);
  assert.equal(source.includes("report-driving"), false);
  assert.equal(source.includes("optional context"), false);
  assert.equal(source.includes("Accepted format:"), false);
  assert.equal(source.includes("Manage details in Settings"), false);
  assert.equal(source.includes("What this report is based on"), false);

  assert.equal(uploadStepperSource.includes("UploadFlowHeader"), true);
  assert.equal(uploadStepperSource.includes("UploadPrivacyLine"), true);
  assert.equal(uploadStepperSource.includes("UploadPlatformPicker"), true);
  assert.equal(uploadStepperSource.includes("UploadPrimaryFooterBar"), true);
  assert.equal(uploadStepperSource.includes("Your data stays private"), true);
  assert.equal(uploadStepperSource.includes("<TrustMicrocopy"), false);
  assert.equal(uploadStepperSource.includes('testId="upload-trust-strip"'), false);
});
